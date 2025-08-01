import * as React from "react";
import { Body, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text } from "@react-email/components";
import { CLIKRIDE_BASE_URL, CLIKRIDE_LOGO } from '../utils/data';

interface Props {
    verificationCode: string;
    firstName: string;
}
  
const AdminWelcomeEmail = ({ verificationCode, firstName }: Props) => {
    return (
      <Html>
        <Head />
        
        <Preview>
            ClikRide Admin Email Verification
        </Preview>
        
        <Body style={main}>
          <Container style={container}>
            <Section style={coverSection}>
              <Section style={imageSection}>
                <Img
                  src={CLIKRIDE_LOGO}
                  width="75"
                  height="45"
                  alt="ClikRide Logo"
                  style={{ objectFit: "cover" }}
                />
              </Section>

              <Section style={upperSection}>
                <Heading style={h1}>Hello, {firstName}</Heading>
                <Text style={mainText}>
                  A new ClikRide admin account has been created for you. Please login with the password
                  below. If you don&apos;t want to create an account, you can ignore this message.
                </Text>
                <Section style={verificationSection}>
                  <Text style={verifyText}>Login code</Text>
  
                  <Text style={codeText}>{verificationCode}</Text>
                  <Text style={validityText}>
                    (Please reset your password once you're logged in.)
                  </Text>
                </Section>
              </Section>

              <Hr />

              <Section style={lowerSection}>
                <Text style={cautionText}>
                  ClikRide will never email you and ask you to disclose
                  or verify your password, credit card, or banking account number.
                </Text>
              </Section>
            </Section>

            <Text style={footerText}>
              All rights reserved. ClikRide is a registered trademark
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
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "20px",
  fontWeight: "bold",
  marginBottom: "15px",
};

const link = {
  color: "#2754C5",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
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
  
export default AdminWelcomeEmail;