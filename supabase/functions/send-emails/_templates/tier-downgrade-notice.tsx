import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";

interface DowngradeNoticeEmailProps {
  name: string;
  fromTier: string;
  toTier: string;
}

export const DowngradeNoticeEmail = ({
  name,
  fromTier,
  toTier,
}: DowngradeNoticeEmailProps) => (
  <Html>
    <Head />
    <Preview>Your subscription has been updated</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Subscription Updated</Heading>
        <Text style={text}>Hi {name},</Text>
        <Section style={noticeBox}>
          <Text style={noticeText}>
            Your subscription has been changed from <strong>{fromTier.toUpperCase()}</strong> to{" "}
            <strong>{toTier.toUpperCase()}</strong>
          </Text>
        </Section>
        {toTier === "basic" && (
          <>
            <Text style={text}>
              You now have access to <strong>Free Plan</strong> features:
            </Text>
            <ul style={list}>
              <li>Up to 20 mobile entries</li>
              <li>Basic inventory management</li>
              <li>Sales tracking</li>
            </ul>
            <Text style={text}>
              Some features are no longer available:
            </Text>
            <ul style={listDisabled}>
              <li>Unlimited inventory</li>
              <li>Profit tracking & reports</li>
              <li>Data export</li>
              <li>AI assistant</li>
              <li>Custom reports</li>
            </ul>
            <Text style={text}>
              To regain access to premium features, please contact your administrator to upgrade your subscription.
            </Text>
          </>
        )}
        <Text style={footer}>
          Best regards,
          <br />
          Mobile Shop Management Team
        </Text>
      </Container>
    </Body>
  </Html>
);

export default DowngradeNoticeEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "600px",
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "20px 0",
};

const text = {
  color: "#484848",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
};

const noticeBox = {
  backgroundColor: "#e7f3ff",
  border: "1px solid #0066cc",
  padding: "20px",
  borderRadius: "8px",
  margin: "20px 0",
};

const noticeText = {
  color: "#004080",
  fontSize: "16px",
  fontWeight: "600",
  margin: "8px 0",
};

const list = {
  color: "#484848",
  fontSize: "16px",
  lineHeight: "28px",
  margin: "8px 0",
};

const listDisabled = {
  color: "#999",
  fontSize: "16px",
  lineHeight: "28px",
  margin: "8px 0",
  textDecoration: "line-through",
};

const footer = {
  color: "#898989",
  fontSize: "14px",
  lineHeight: "22px",
  marginTop: "32px",
};
