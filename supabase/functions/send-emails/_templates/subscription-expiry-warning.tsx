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

interface ExpiryWarningEmailProps {
  name: string;
  tier: string;
  expiryDate: string;
  daysRemaining: number;
}

export const ExpiryWarningEmail = ({
  name,
  tier,
  expiryDate,
  daysRemaining,
}: ExpiryWarningEmailProps) => (
  <Html>
    <Head />
    <Preview>Your {tier} subscription is expiring soon</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>⚠️ Subscription Expiring Soon</Heading>
        <Text style={text}>Hi {name},</Text>
        <Section style={warningBox}>
          <Text style={warningText}>
            Your <strong>{tier.toUpperCase()}</strong> subscription will expire in{" "}
            <strong>{daysRemaining} days</strong>
          </Text>
          <Text style={warningText}>Expiry Date: {expiryDate}</Text>
        </Section>
        <Text style={text}>
          After expiry, your account will be downgraded to the <strong>Free Plan</strong> with limited features:
        </Text>
        <ul style={list}>
          <li>Maximum 20 mobile entries</li>
          <li>No profit tracking</li>
          <li>No reports or data export</li>
          <li>No AI assistant</li>
        </ul>
        <Text style={text}>
          To continue enjoying premium features, please contact your administrator to renew your subscription.
        </Text>
        <Text style={footer}>
          Best regards,
          <br />
          Mobile Shop Management Team
        </Text>
      </Container>
    </Body>
  </Html>
);

export default ExpiryWarningEmail;

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

const warningBox = {
  backgroundColor: "#fff3cd",
  border: "1px solid #ffc107",
  padding: "20px",
  borderRadius: "8px",
  margin: "20px 0",
};

const warningText = {
  color: "#856404",
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

const footer = {
  color: "#898989",
  fontSize: "14px",
  lineHeight: "22px",
  marginTop: "32px",
};
