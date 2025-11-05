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

interface WelcomeEmailProps {
  name: string;
}

export const WelcomeEmail = ({ name }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to Mobile Shop Management System</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome, {name}! 👋</Heading>
        <Text style={text}>
          Thank you for signing up for Mobile Shop Management System!
        </Text>
        <Section style={section}>
          <Text style={text}>
            You're currently on the <strong>Free Plan</strong> with access to:
          </Text>
          <ul style={list}>
            <li>Up to 20 mobile entries</li>
            <li>Basic inventory management</li>
            <li>Sales tracking</li>
          </ul>
        </Section>
        <Text style={text}>
          Ready to unlock more features? Upgrade to <strong>Standard</strong> or{" "}
          <strong>Premium</strong> to get:
        </Text>
        <ul style={list}>
          <li>Unlimited inventory</li>
          <li>Profit tracking & reports</li>
          <li>AI-powered business assistant</li>
          <li>Data export & custom reports</li>
        </ul>
        <Text style={footer}>
          Best regards,
          <br />
          Mobile Shop Management Team
        </Text>
      </Container>
    </Body>
  </Html>
);

export default WelcomeEmail;

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

const section = {
  backgroundColor: "#f8f9fa",
  padding: "20px",
  borderRadius: "8px",
  margin: "20px 0",
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
