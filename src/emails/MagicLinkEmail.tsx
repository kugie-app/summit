import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface MagicLinkEmailProps {
  clientName: string;
  magicLink: string;
}

export const MagicLinkEmail = ({
  clientName = 'Valued Client',
  magicLink = 'https://example.com/login',
}: MagicLinkEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your sign-in link for the Client Portal</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Sign in to the Client Portal</Heading>
          <Section>
            <Text style={text}>Hello {clientName},</Text>
            <Text style={text}>
              Click the button below to sign in to the client portal. This link is valid for 1 hour.
            </Text>
            <Button style={button} href={magicLink}>
              Sign In to Portal
            </Button>
            <Text style={text}>
              If you didn&apos;t request this email, you can safely ignore it.
            </Text>
            <Text style={text}>
              If the button doesn&apos;t work, you can also copy and paste this URL into your browser:
            </Text>
            <Text style={link}>{magicLink}</Text>
          </Section>
          <Text style={footer}>
            &copy; {new Date().getFullYear()} Your Company Name. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f5f5f5',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  width: '580px',
  maxWidth: '100%',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const button = {
  backgroundColor: '#5469d4',
  borderRadius: '4px',
  color: '#fff',
  display: 'block',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '24px auto',
  padding: '12px 24px',
  textAlign: 'center' as const,
  textDecoration: 'none',
  width: '220px',
};

const link = {
  color: '#5469d4',
  fontSize: '14px',
  margin: '16px 0',
  wordBreak: 'break-all' as const,
};

const footer = {
  color: '#898989',
  fontSize: '12px',
  margin: '48px 0 0',
  textAlign: 'center' as const,
};

export default MagicLinkEmail; 