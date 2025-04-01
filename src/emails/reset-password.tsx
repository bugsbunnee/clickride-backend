import * as React from "react";
import { Body, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text } from "@react-email/components";
import { CLIKRIDE_BASE_URL, CLIKRIDE_LOGO } from '../utils/data';
import { COMPANY_NAME } from "../utils/constants";

interface Props {
    verificationCode: string;
    validityInMinutes: number;
}
  
const ResetPasswordEmail = ({ verificationCode, validityInMinutes }: Props) => {
    return (
      <Html>
        <Head />
        
        <Preview>
            Reset Your {COMPANY_NAME} Account Pasword
        </Preview>
        
        <Body style={main}>
          <Container style={container}>
            <Section style={coverSection}>
              <Section style={imageSection}>
                <Img
                  src={CLIKRIDE_LOGO}
                  width="75"
                  height="45"
                  alt={COMPANY_NAME}
                  style={{ objectFit: "cover" }}
                />
              </Section>

              <Section style={upperSection}>
                <Heading style={h1}>Reset your {COMPANY_NAME} Account Password.</Heading>
                <Text style={mainText}>
                  You requested a password reset on your {COMPANY_NAME} Account. Please enter the following
                  verification code when prompted. If you don&apos;t want to
                  reset your password, you can ignore this message.
                </Text>
                <Section style={verificationSection}>
                  <Text style={verifyText}>Verification code</Text>
  
                  <Text style={codeText}>{verificationCode}</Text>
                  <Text style={validityText}>
                    (This code is valid for {validityInMinutes} minutes)
                  </Text>
                </Section>
              </Section>

              <Hr />

              <Section style={lowerSection}>
                <Text style={cautionText}>
                  {COMPANY_NAME} will never email you and ask you to disclose
                  or verify your password, credit card, or banking account number.
                </Text>
              </Section>
            </Section>

            <Text style={footerText}>
              All rights reserved. {COMPANY_NAME} is a registered trademark
              of{" "}
              <Link href={CLIKRIDE_BASE_URL} target="_blank" style={link}>
                clikride.com
              </Link>
            </Text>
          </Container>
        </Body>
      </Html>
    );
};
  
const main = {
backgroundColor: "#fff",
color: "#212121",
};

const container = {
padding: "20px",
margin: "0 auto",
backgroundColor: "#eee",
};

const h1 = {
color: "#333",
fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
fontSize: "20px",
fontWeight: "bold",
marginBottom: "15px",
};

const link = {
color: "#2754C5",
fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
fontSize: "14px",
textDecoration: "underline",
};

const text = {
color: "#333",
fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
fontSize: "14px",
margin: "24px 0",
};

const imageSection = {
backgroundColor: "#252f3d",
display: "flex",
padding: "20px 0",
alignItems: "center",
justifyContent: "center",
};

const coverSection = { backgroundColor: "#fff" };

const upperSection = { padding: "25px 35px" };

const lowerSection = { padding: "25px 35px" };

const footerText = {
...text,
fontSize: "12px",
padding: "0 20px",
};

const verifyText = {
...text,
margin: 0,
fontWeight: "bold",
textAlign: "center" as const,
};

const codeText = {
...text,
fontWeight: "bold",
fontSize: "36px",
margin: "10px 0",
textAlign: "center" as const,
};

const validityText = {
...text,
margin: "0px",
textAlign: "center" as const,
};

const verificationSection = {
display: "flex",
alignItems: "center",
justifyContent: "center",
};

const mainText = { ...text, marginBottom: "14px" };

const cautionText = { ...text, margin: "0px" };
  
export default ResetPasswordEmail;