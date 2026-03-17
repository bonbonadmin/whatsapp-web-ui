import Icon from "common/components/icons";
import { RecentOrder } from "common/types/common.type";
import {
  AboutItem,
  ActionSection,
  ActionText,
  OrdersEmptyState,
  OrdersTable,
  OrdersTableCell,
  OrdersTableHeadCell,
  OrdersTableRow,
  OrdersTableWrapper,
  OrderSectionTitle,
  PersonalInfo,
  ProfileName,
  Section,
  Wrapper,
} from "./styles";

type ProfileSectionProps = {
  name: string;
  phoneNumber: string;
  orders: RecentOrder[];
};

export default function ProfileSection(props: ProfileSectionProps) {
  const { name, phoneNumber, orders } = props;

  const formatOrderDate = (value: string | null) => {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatStatus = (value: string | null) => {
    if (!value) return "-";
    return value
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  return (
    <Wrapper>
      <PersonalInfo>
        {/* <AvatarWrapper>
          <Avatar src={image} alt="User Profile" />
        </AvatarWrapper> */}
        <ProfileName>{name}</ProfileName>
      </PersonalInfo>

      {/* <Section>
        <HeadingWrapper>
          <Heading>Media, Links and Documents</Heading>
          <MediaButton>
            <Icon id="rightArrow" className="icon" />
          </MediaButton>
        </HeadingWrapper>
        <MediaImagesWrapper>
          <MediaImage src="/assets/images/placeholder.jpeg" alt="Media" />
          <MediaImage src="/assets/images/placeholder.jpeg" alt="Media" />
          <MediaImage src="/assets/images/placeholder.jpeg" alt="Media" />
        </MediaImagesWrapper>
      </Section> */}

      <Section>
        {/* <HeadingWrapper>
          <Heading>About and phone number</Heading>
        </HeadingWrapper> */}
        <ul>
          {/* <AboutItem>
            Everyone should learn how to program because it teaches you how to think.
          </AboutItem> */}
          <AboutItem>{phoneNumber}</AboutItem>
        </ul>
      </Section>

      <Section>
        <OrderSectionTitle>Recent Orders</OrderSectionTitle>
        {orders.length === 0 ? (
          <OrdersEmptyState>No recent orders found.</OrdersEmptyState>
        ) : (
          <OrdersTableWrapper>
            <OrdersTable>
              <thead>
                <tr>
                  <OrdersTableHeadCell>OrderId</OrdersTableHeadCell>
                  <OrdersTableHeadCell>Order Date</OrdersTableHeadCell>
                  <OrdersTableHeadCell>Payment Status</OrdersTableHeadCell>
                  <OrdersTableHeadCell>Shipment Status</OrdersTableHeadCell>
                  <OrdersTableHeadCell>Tracking code</OrdersTableHeadCell>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <OrdersTableRow key={order.orderId}>
                    <OrdersTableCell>{order.orderId}</OrdersTableCell>
                    <OrdersTableCell>{formatOrderDate(order.orderDate)}</OrdersTableCell>
                    <OrdersTableCell>{formatStatus(order.paymentStatus)}</OrdersTableCell>
                    <OrdersTableCell>{formatStatus(order.shipmentStatus)}</OrdersTableCell>
                    <OrdersTableCell>{order.trackingCode || "-"}</OrdersTableCell>
                  </OrdersTableRow>
                ))}
              </tbody>
            </OrdersTable>
          </OrdersTableWrapper>
        )}
      </Section>

      {/* <ActionSection>
        <Icon id="block" className="icon" />
        <ActionText>Block</ActionText>
      </ActionSection> */}
      <ActionSection>
        <Icon id="thumbsDown" className="icon" />
        <ActionText>Load all chats</ActionText>
      </ActionSection>
      {/* <ActionSection>
        <Icon id="delete" className="icon" />
        <ActionText>Delete chat</ActionText>
      </ActionSection> */}
    </Wrapper>
  );
}
