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

interface InvitationEmailProps {
  inviterName?: string;
  companyName: string;
  recipientName?: string;
  role: string;
  acceptUrl: string;
}

export const InvitationEmail = ({
  inviterName = 'Team Admin',
  companyName = 'Your Company',
  recipientName,
  role,
  acceptUrl,
}: InvitationEmailProps) => {
  const greeting = recipientName ? `Hello ${recipientName},` : 'Hello,';
  const roleFormatted = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <Html>
      <Head />
      <Preview>You&apos;ve been invited to join {companyName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Join {companyName}</Heading>
          <Section>
            <Text style={text}>{greeting}</Text>
            <Text style={text}>
              {inviterName} has invited you to join {companyName} as a {roleFormatted}.
            </Text>
            <Text style={text}>
              Click the button below to accept the invitation and create your account. This invitation will expire in 48 hours.
            </Text>
            <Button style={button} href={acceptUrl}>
              Accept Invitation
            </Button>
            <Text style={text}>
              If you didn&apos;t expect this invitation, you can safely ignore this email.
            </Text>
            <Text style={text}>
              If the button doesn&apos;t work, you can also copy and paste this URL into your browser:
            </Text>
            <Text style={link}>{acceptUrl}</Text>
          </Section>
          <Text style={footer}>
            &copy; {new Date().getFullYear()} {companyName}. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
  padding: '20px 0',
};

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #e0e0e0',
  borderRadius: '5px',
  margin: '0 auto',
  padding: '20px',
  maxWidth: '600px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '30px 0',
  padding: '0',
  textAlign: 'center' as const,
};

const text = {
  color: '#444',
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
  width: 'fit-content',
};

const link = {
  color: '#5469d4',
  wordBreak: 'break-all' as const,
  fontSize: '14px',
};

const footer = {
  color: '#898989',
  fontSize: '14px',
  margin: '24px 0 0',
  textAlign: 'center' as const,
}; 