import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActionGroup,
  Badge,
  Body,
  Button,
  CenterState,
  CountText,
  FilterForm,
  Header,
  HeaderActions,
  Input,
  Message,
  ModalActions,
  ModalCard,
  ModalOverlay,
  ModalText,
  ModalTitle,
  Muted,
  Page,
  ParticipantButton,
  Subtitle,
  Table,
  TableShell,
  Td,
  TextCell,
  Th,
  Title,
  TitleGroup,
  Toolbar,
} from "./styles";

type QueuedProcess = {
  id: string | number;
  threadDbId: number;
  assistantId: string;
  state: string;
  participantId?: string | null;
  displayPhoneId?: string | null;
  messageId?: string | null;
  messageType?: string | null;
  messageText?: string | null;
  routeType?: string | null;
  routeReason?: string | null;
  timestamp: number;
  attemptsMade: number;
  failedReason?: string | null;
};

type QueueResponse = {
  success?: boolean;
  message?: string;
  count?: number;
  data?: QueuedProcess[];
};

type CancelQueuePayload = {
  jobId?: QueuedProcess["id"];
  threadDbId?: QueuedProcess["threadDbId"];
  all?: boolean;
};

type OpenAIQueuePanelProps = {
  embedded?: boolean;
  onClose?: () => void;
  onParticipantClick?: (participantId: string) => void;
};

const apiBase = process.env.REACT_APP_API_URL?.replace(/\/+$/, "") || "";

const endpoint = (path: string) => `${apiBase}${path}`;

const rowKey = (row: QueuedProcess) => `${row.threadDbId}:${row.id}`;

const formatNullable = (value?: string | number | null) => {
  if (value === undefined || value === null || value === "") return "-";
  return String(value);
};

const formatTimestamp = (value: number) => {
  if (!Number.isFinite(value)) return "-";

  const millis = value < 1000000000000 ? value * 1000 : value;
  const date = new Date(millis);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString();
};

const getResponseJson = async (response: Response) => {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return "OpenAI queue request failed.";
};

export default function OpenAIQueuePanel(props: OpenAIQueuePanelProps) {
  const { embedded = false, onClose, onParticipantClick } = props;
  const [queued, setQueued] = useState<QueuedProcess[]>([]);
  const [count, setCount] = useState(0);
  const [threadFilterDraft, setThreadFilterDraft] = useState("");
  const [threadFilter, setThreadFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRunAllLoading, setIsRunAllLoading] = useState(false);
  const [isCancelAllLoading, setIsCancelAllLoading] = useState(false);
  const [runningRows, setRunningRows] = useState<Record<string, boolean>>({});
  const [cancellingRows, setCancellingRows] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [pendingBulkAction, setPendingBulkAction] = useState<"run" | "cancel" | null>(null);

  const listUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (threadFilter) params.set("threadDbId", threadFilter);
    const qs = params.toString();
    return endpoint(`/openai-queue/queued${qs ? `?${qs}` : ""}`);
  }, [threadFilter]);

  const fetchQueued = useCallback(
    async (options?: { silent?: boolean }) => {
      try {
        if (!options?.silent) setIsLoading(true);
        setError("");

        const response = await fetch(listUrl);
        const json: QueueResponse = await getResponseJson(response);

        if (!response.ok || json.success === false) {
          throw new Error(json.message || `Failed to load queue (${response.status})`);
        }

        const rows = Array.isArray(json.data) ? json.data : [];
        setQueued(rows);
        setCount(typeof json.count === "number" ? json.count : rows.length);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        if (!options?.silent) setIsLoading(false);
      }
    },
    [listUrl]
  );

  useEffect(() => {
    fetchQueued();
  }, [fetchQueued]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      fetchQueued({ silent: true });
    }, 12000);

    return () => window.clearInterval(intervalId);
  }, [fetchQueued]);

  const runRow = async (row: QueuedProcess) => {
    const key = rowKey(row);

    try {
      setRunningRows((prev) => ({ ...prev, [key]: true }));
      setError("");
      setSuccessMessage("");

      const response = await fetch(endpoint("/openai-queue/run"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadDbId: row.threadDbId,
          jobId: row.id,
        }),
      });
      const json = await getResponseJson(response);

      if (!response.ok || json.success === false) {
        throw new Error(json.message || `Failed to run process (${response.status})`);
      }

      await fetchQueued({ silent: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRunningRows((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const runAll = async () => {
    try {
      setIsRunAllLoading(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch(endpoint("/openai-queue/run"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      const json = await getResponseJson(response);

      if (!response.ok || json.success === false) {
        throw new Error(json.message || `Failed to run all processes (${response.status})`);
      }

      await fetchQueued({ silent: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsRunAllLoading(false);
    }
  };

  const cancelQueue = async (payload: CancelQueuePayload) => {
    const response = await fetch(endpoint("/openai-queue/cancel"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json: QueueResponse = await getResponseJson(response);

    if (!response.ok || json.success === false) {
      throw new Error(json.message || `Failed to cancel queued process (${response.status})`);
    }

    await fetchQueued({ silent: true });
    setSuccessMessage(json.message || "Queued OpenAI process cancelled.");
  };

  const cancelRow = async (row: QueuedProcess) => {
    const key = rowKey(row);

    try {
      setCancellingRows((prev) => ({ ...prev, [key]: true }));
      setError("");
      setSuccessMessage("");
      await cancelQueue({ jobId: row.id });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCancellingRows((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const cancelAll = async () => {
    try {
      setIsCancelAllLoading(true);
      setError("");
      setSuccessMessage("");
      await cancelQueue({ all: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsCancelAllLoading(false);
    }
  };

  const confirmBulkAction = () => {
    const action = pendingBulkAction;
    setPendingBulkAction(null);

    if (action === "run") {
      runAll();
    } else if (action === "cancel") {
      cancelAll();
    }
  };

  const applyFilter = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setThreadFilter(threadFilterDraft.trim());
  };

  const clearFilter = () => {
    setThreadFilterDraft("");
    setThreadFilter("");
  };

  const renderParticipantId = (participantId?: string | null) => {
    const formatted = formatNullable(participantId);
    if (!participantId || !onParticipantClick) return formatted;

    return (
      <ParticipantButton
        type="button"
        onClick={() => onParticipantClick(participantId)}
        title={`Open messages for ${participantId}`}
      >
        {participantId}
      </ParticipantButton>
    );
  };

  const hasRows = queued.length > 0;
  const isBulkActionLoading = isRunAllLoading || isCancelAllLoading;

  return (
    <Page $embedded={embedded}>
      <Header $embedded={embedded}>
        <TitleGroup>
          <Title>OpenAI Queue</Title>
          <Subtitle>Resume queued or paused OpenAI processes.</Subtitle>
        </TitleGroup>

        <HeaderActions>
          <Button type="button" onClick={() => fetchQueued()} disabled={isLoading}>
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
          <Button
            type="button"
            $variant="primary"
            onClick={() => setPendingBulkAction("run")}
            disabled={isBulkActionLoading || !hasRows}
          >
            {isRunAllLoading ? "Running..." : "Run All"}
          </Button>
          <Button
            type="button"
            onClick={() => setPendingBulkAction("cancel")}
            disabled={isBulkActionLoading || !hasRows}
          >
            {isCancelAllLoading ? "Cancelling..." : "Cancel All"}
          </Button>
          {onClose && (
            <Button type="button" onClick={onClose}>
              Close
            </Button>
          )}
        </HeaderActions>
      </Header>

      <Body $embedded={embedded}>
        <Toolbar>
          <FilterForm onSubmit={applyFilter}>
            <Input
              inputMode="numeric"
              placeholder="threadDbId"
              value={threadFilterDraft}
              onChange={(event) => setThreadFilterDraft(event.target.value)}
            />
            <Button type="submit">Apply</Button>
            {threadFilter && (
              <Button type="button" onClick={clearFilter}>
                Clear
              </Button>
            )}
          </FilterForm>

          <CountText>
            {count} queued process{count === 1 ? "" : "es"}
            {threadFilter ? ` for thread ${threadFilter}` : ""}
          </CountText>
        </Toolbar>

        {error && <Message $tone="error">{error}</Message>}
        {successMessage && <Message $tone="success">{successMessage}</Message>}

        {isLoading && !hasRows ? (
          <CenterState>Loading OpenAI queue...</CenterState>
        ) : !hasRows ? (
          <CenterState>No queued OpenAI processes</CenterState>
        ) : (
          <TableShell>
            <Table>
              <thead>
                <tr>
                  <Th>threadDbId</Th>
                  <Th>Job ID</Th>
                  <Th>participantId</Th>
                  <Th>displayPhoneId</Th>
                  <Th>state</Th>
                  <Th>messageType</Th>
                  <Th>messageText</Th>
                  <Th>routeReason</Th>
                  <Th>timestamp</Th>
                  <Th>attempts</Th>
                  <Th>action</Th>
                </tr>
              </thead>
              <tbody>
                {queued.map((row) => {
                  const key = rowKey(row);
                  const isRowRunning = !!runningRows[key];
                  const isRowCancelling = !!cancellingRows[key];

                  return (
                    <tr key={key}>
                      <Td>{row.threadDbId}</Td>
                      <Td>{formatNullable(row.id)}</Td>
                      <Td>{renderParticipantId(row.participantId)}</Td>
                      <Td>{formatNullable(row.displayPhoneId)}</Td>
                      <Td>
                        <Badge>{formatNullable(row.state)}</Badge>
                      </Td>
                      <Td>{formatNullable(row.messageType)}</Td>
                      <Td>
                        <TextCell title={row.messageText || undefined}>
                          {formatNullable(row.messageText)}
                        </TextCell>
                      </Td>
                      <Td>
                        <TextCell title={row.routeReason || undefined}>
                          {formatNullable(row.routeReason)}
                        </TextCell>
                        {row.failedReason && <Muted>Failed: {row.failedReason}</Muted>}
                      </Td>
                      <Td>{formatTimestamp(row.timestamp)}</Td>
                      <Td>{row.attemptsMade}</Td>
                      <Td>
                        <ActionGroup>
                          <Button
                            type="button"
                            onClick={() => runRow(row)}
                            disabled={isRowRunning || isRowCancelling}
                          >
                            {isRowRunning ? "Running..." : "Run"}
                          </Button>
                          <Button
                            type="button"
                            onClick={() => cancelRow(row)}
                            disabled={isRowCancelling || isRowRunning}
                          >
                            {isRowCancelling ? "Cancelling..." : "Cancel"}
                          </Button>
                        </ActionGroup>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </TableShell>
        )}
      </Body>

      {pendingBulkAction && (
        <ModalOverlay
          role="dialog"
          aria-modal="true"
          onClick={() => setPendingBulkAction(null)}
        >
          <ModalCard onClick={(event) => event.stopPropagation()}>
            <ModalTitle>
              {pendingBulkAction === "run" ? "Run all queued jobs?" : "Cancel all queued jobs?"}
            </ModalTitle>
            <ModalText>
              {pendingBulkAction === "run"
                ? `This will resume all ${count} queued OpenAI process${
                    count === 1 ? "" : "es"
                  }${threadFilter ? ` for thread ${threadFilter}` : ""}. This action cannot be undone.`
                : `This will cancel all ${count} queued OpenAI process${
                    count === 1 ? "" : "es"
                  }${threadFilter ? ` for thread ${threadFilter}` : ""}. This action cannot be undone.`}
            </ModalText>
            <ModalActions>
              <Button type="button" onClick={() => setPendingBulkAction(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                $variant={pendingBulkAction === "run" ? "primary" : "danger"}
                onClick={confirmBulkAction}
              >
                {pendingBulkAction === "run" ? "Run All" : "Cancel All"}
              </Button>
            </ModalActions>
          </ModalCard>
        </ModalOverlay>
      )}
    </Page>
  );
}
