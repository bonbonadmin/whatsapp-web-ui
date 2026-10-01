import React from "react";
import { act, render, waitFor, screen } from "@testing-library/react";
import axios from "axios";
import ChatProvider, { useChatContext, ALL_WA_IDS } from "./chat";
import { createAuthSession } from "common/auth/session";
import SearchSection from "../chat-room-page/components/search-section";
import { fireEvent } from "@testing-library/react";

jest.mock("axios", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    isCancel: jest.fn(),
    defaults: { headers: { common: {} } },
  },
}));
const get = axios.get as jest.Mock;
let current: ReturnType<typeof useChatContext>;
function Probe() {
  current = useChatContext();
  return <div data-testid="results">{current.inbox.map((x) => x.name).join(",")}</div>;
}
function deferred() {
  let resolve!: (value: any) => void;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
}
function inbox(name: string, waId = "line123") {
  return { id: `${waId}:${name}`, participantId: name, waId, name, image: "", updatedAt: "" };
}
function result(name: string, hasMore = false) {
  return {
    data: {
      success: true,
      hasMore,
      version: "v1",
      data: [
        {
          id: 1,
          participant_id: name,
          participant_name: name,
          message_text: "",
          created_at: "2026-01-01",
          updated_at: "2026-01-01",
        },
      ],
    },
  };
}
function message(id: number, body: string) {
  return {
    id,
    message_text: body,
    from_me: 0,
    message_type: "text",
    created_at: "2026-01-01",
    template_log: {},
  };
}
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  createAuthSession("test@example.com");
  localStorage.setItem("wa:selectedId", "line123");
  (axios as any).defaults = { headers: { common: {} } };
  (axios.isCancel as any).mockReturnValue(false);
});

test("search discards obsolete responses, clears unrelated rows, and blocks pagination during first page", async () => {
  const old = deferred(),
    next = deferred();
  get.mockImplementation((_url, opts) =>
    opts.params.searchTerm === "new" ? next.promise : old.promise
  );
  render(
    <ChatProvider>
      <Probe />
    </ChatProvider>
  );
  act(() => current.onSearch("old"));
  act(() => current.onSearch("new"));
  act(() => current.loadMore());
  expect(get).toHaveBeenCalledTimes(2);
  expect(get.mock.calls[0][1].signal.aborted).toBe(true);
  await act(async () => next.resolve(result("new")));
  await act(async () => old.resolve(result("old")));
  expect(screen.getByTestId("results")).toHaveTextContent("new");
  expect(screen.getByTestId("results")).not.toHaveTextContent("old");
  get.mockReturnValueOnce(deferred().promise);
  act(() => current.onSearch("another"));
  expect(screen.getByTestId("results")).toBeEmptyDOMElement();
});

test("all-line inbox uses one request and global pagination while retaining each chat line", async () => {
  localStorage.setItem("wa:selectedId", ALL_WA_IDS);
  localStorage.setItem("wa:ids", JSON.stringify([{ id: "line123" }, { id: "line456" }]));
  const pending = deferred();
  get.mockReturnValue(pending.promise);
  render(
    <ChatProvider>
      <Probe />
    </ChatProvider>
  );
  act(() => current.initializeInbox());
  expect(get).toHaveBeenCalledTimes(1);
  expect(get.mock.calls[0][1].params).toMatchObject({
    waIds: "line123,line456",
    page: 1,
    perPage: 50,
  });
  const first = result("same", true);
  first.data.data = [
    { ...first.data.data[0], display_phone_id: "line123" },
    { ...first.data.data[0], id: 2, display_phone_id: "line456" },
  ] as any;
  await act(async () => pending.resolve(first));
  expect(current.inbox.map((row) => row.id)).toEqual(["line123:same", "line456:same"]);
  expect(current.isFetchInbox).toBe(false);
  const next = result("next");
  next.data.data = [{ ...next.data.data[0], display_phone_id: "line456" }] as any;
  get.mockResolvedValueOnce(next);
  await act(async () => current.loadMore());
  expect(get).toHaveBeenCalledTimes(2);
  expect(get.mock.calls[1][1].params).toMatchObject({
    waIds: "line123,line456",
    page: 2,
    perPage: 50,
  });
  expect(current.inbox).toHaveLength(3);
  expect(current.hasMore).toBe(false);
});

test("line discovery starts exactly one request even when initialization repeats", async () => {
  localStorage.removeItem("wa:selectedId");
  const pending = deferred();
  get.mockReturnValue(pending.promise);
  render(
    <ChatProvider>
      <Probe />
    </ChatProvider>
  );
  act(() => current.initializeInbox());
  expect(get).not.toHaveBeenCalled();
  localStorage.setItem("wa:selectedId", "line123");
  act(() => {
    current.initializeInbox();
    current.initializeInbox();
  });
  expect(get).toHaveBeenCalledTimes(1);
  await act(async () => pending.resolve(result("loaded")));
});

test("chat messages render while booking service is pending and stale chat responses are ignored", async () => {
  const first = deferred(),
    second = deferred(),
    context = deferred();
  get.mockImplementation((url: string) => {
    if (url.endsWith("/context")) return context.promise;
    if (url.endsWith("/manual")) return Promise.resolve({ data: { data: {} } });
    return url.endsWith("/first") ? first.promise : second.promise;
  });
  render(
    <ChatProvider>
      <Probe />
    </ChatProvider>
  );
  act(() => current.onChangeChat(inbox("first")));
  act(() => current.onChangeChat(inbox("second")));
  await act(async () =>
    second.resolve({
      data: { success: true, data: [message(5, "second message")], oldestId: 5, hasMore: true },
    })
  );
  expect(current.participantMessages[0].body).toBe("second message");
  expect(current.isLoadingMessages).toBe(false);
  expect(current.bookings).toBeUndefined();
  await act(async () =>
    first.resolve({ data: { success: true, data: [message(1, "old message")], oldestId: 1 } })
  );
  expect(current.participantMessages[0].body).toBe("second message");
  const request = get.mock.calls.find(([url]) => url.endsWith("/second"));
  expect(request[1].params.limit).toBe(50);
  expect(request[1].params.includeContext).toBe(0);
});

test("in-chat search scopes the active line and requests a read-only search page", async () => {
  get.mockImplementation((url: string, opts) => {
    if (url.endsWith("/context")) return Promise.resolve({ data: { bookings: [] } });
    if (url.endsWith("/manual")) return Promise.resolve({ data: { data: {} } });
    if (opts.params.searchOnly)
      return Promise.resolve({
        data: { success: true, data: [message(4, "a+b <img>")], oldestId: 4 },
      });
    return Promise.resolve({ data: { success: true, data: [], oldestId: null } });
  });
  render(
    <ChatProvider>
      <Probe />
      <SearchSection isSearchActive onClickSearch={() => {}} />
    </ChatProvider>
  );
  act(() => current.onChangeChat(inbox("person", "line456")));
  await waitFor(() => expect(current.isLoadingMessages).toBe(false));
  fireEvent.change(screen.getByPlaceholderText("Search messages ..."), {
    target: { value: "a+b" },
  });
  fireEvent.keyDown(screen.getByPlaceholderText("Search messages ..."), { key: "Enter" });
  await waitFor(() => expect(screen.getByText("a+b")).toBeInTheDocument());
  expect(screen.getByText("a+b").tagName).toBe("MARK");
  const request = get.mock.calls.find(([, opts]) => opts.params?.searchOnly);
  expect(request[1].headers["x-wa-id"]).toBe("line456");
  expect(request[1].params.limit).toBe(50);
  expect(document.querySelector("img")).toBeNull();
});

test("older pages merge without duplicates and search navigation stays bounded", async () => {
  get.mockImplementation((url: string, opts) => {
    if (url.endsWith("/context")) return Promise.resolve({ data: { bookings: [] } });
    if (url.endsWith("/manual")) return Promise.resolve({ data: { data: {} } });
    const rows = opts.params.aroundId
      ? [message(1, "target")]
      : opts.params.beforeId
      ? [message(3, "older"), message(4, "overlap")]
      : [message(4, "recent"), message(5, "latest")];
    return Promise.resolve({
      data: { success: true, data: rows, oldestId: rows[0].id, hasMore: true },
    });
  });
  render(
    <ChatProvider>
      <Probe />
    </ChatProvider>
  );
  await act(async () => current.onChangeChat(inbox("person")));
  await act(async () => current.loadOlderMessages());
  expect(current.participantMessages.map((row) => row.id)).toEqual(["3", "4", "5"]);
  await act(async () => current.revealMessage("1"));
  expect(current.participantMessages.map((row) => row.id)).toEqual(["1"]);
  expect(current.viewingHistory).toBe(true);
  const count = get.mock.calls.length;
  await act(async () => current.reloadMessages());
  expect(get.mock.calls.length).toBe(count);
  await act(async () => current.returnToLatest());
  expect(current.participantMessages.map((row) => row.id)).toEqual(["4", "5"]);
  expect(current.viewingHistory).toBe(false);
});

test("poll retries message changes skipped during an older-page request", async () => {
  jest.useFakeTimers();
  const older = deferred();
  const history = (id: number) => ({
    data: {
      success: true,
      data: [message(id, "message")],
      tools: [],
      oldestId: id,
      newestId: id,
      hasMore: false,
    },
  });
  get.mockImplementation((url, options) => {
    if (url.endsWith("/message-inbox")) return Promise.resolve(result("person"));
    if (url.endsWith("/context")) return Promise.resolve({ data: { bookings: [], events: [] } });
    if (url.endsWith("/manual")) return Promise.resolve({ data: { data: { manual: 0 } } });
    if (options?.params?.beforeId) return older.promise;
    return Promise.resolve(history(100));
  });
  (axios.post as jest.Mock).mockResolvedValue({
    data: { versions: { line123: "v2" }, changed: ["line123"] },
  });
  const view = render(
    <ChatProvider>
      <Probe />
    </ChatProvider>
  );
  await act(async () => current.onChangeChat(inbox("person")));
  act(() => {
    void current.loadOlderMessages();
  });
  await act(async () => {
    jest.advanceTimersByTime(10000);
  });
  const before = get.mock.calls.filter(([url]) => url.endsWith("/message-inbox/person")).length;
  await act(async () => older.resolve(history(50)));
  (axios.post as jest.Mock).mockResolvedValue({
    data: { versions: { line123: "v2" }, changed: [] },
  });
  await act(async () => {
    jest.advanceTimersByTime(10000);
  });
  expect(
    get.mock.calls.filter(([url]) => url.endsWith("/message-inbox/person")).length
  ).toBeGreaterThan(before);
  view.unmount();
  jest.useRealTimers();
});
