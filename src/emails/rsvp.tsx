import * as React from "react";
import { Body, Container, Head, Heading, Hr, Html, Img, Preview, Section, Text } from "@react-email/components";
import { IRSVP } from "../models/rsvp/types";

function RSVPEmail({ firstName, lastName, email, attending }: IRSVP) {
  return (
    <Html>
      <Head />
      
      <Preview>
        Painter's Loyalty
      </Preview>
      
      <Body style={main}>
        <Container style={container}>
          <Section style={coverSection}>
            <Section style={imageSection}>
              <Img
                src={`${process.env.FRONTEND_URL}/icons/logo-white.png`}
                width="75"
                height="45"
                style={image}
                alt="Marcel & Victoria"
              />
            </Section>

            <Section style={upperSection}>
              <Heading style={heading}>New RSVP Entry</Heading>
              <Text style={mainText}>
                You have a new RSVP entry with the following details;
              </Text>
              
              <Section style={formDetails}>
                <Section style={verificationSection}>
                  <Text style={verifyText}>First Name</Text>
                  <Text style={codeText}>{firstName}</Text>
                </Section>
                
                <Section style={verificationSection}>
                  <Text style={verifyText}>Last Name</Text>
                  <Text style={codeText}>{lastName}</Text>
                </Section>

                <Section style={verificationSection}>
                  <Text style={verifyText}>Email</Text>
                  <Text style={codeText}>{email}</Text>
                </Section>
                
                <Section style={verificationSection}>
                  <Text style={verifyText}>Attending</Text>
                  <Text style={codeText}>{attending}</Text>
                </Section>
              </Section>
            </Section>

            <Hr />
            
            <Section style={lowerSection}>
              <Text style={cautionText}>
                This is an auto generated email. 
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#fff",
  color: "#212121",
};

const container = {
  padding: "20px",
  margin: "0 auto",
  backgroundColor: "#eee",
};

const coverSection = { 
  backgroundColor: "#fff" 
};

const formDetails = {
  backgroundColor: "#FFFFFF",
  padding: "0.875rem",
  borderRadius: "0.875rem",
  border: "1px solid #EBEBEB"
}

const heading = {
  color: "#333",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "20px",
  fontWeight: "bold",
  marginBottom: "15px",
};

const image = {
  objectFit: "contain" as const,
};

const imageSection = {
  backgroundColor: "#252f3d",
  display: "flex",
  padding: "20px 0",
  alignItems: "center",
  justifyContent: "center",
};

const lowerSection = { 
  padding: "25px 35px" 
};

const text = {
  color: "#333",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "14px",
  margin: "24px 0",
};

const upperSection = { 
  padding: "25px 35px" 
};

const verifyText = {
  ...text,
  margin: 0,
  fontWeight: "500",
  fontSize: "0.675rem",
  textTransform: "uppercase" as const,
  textAlign: "center" as const,
  paddingBottom: "0.25rem",
  borderBottom: "1px solid #EBEBEB"
};

const codeText = {
  ...text,
  fontWeight: "600",
  fontSize: "0.875rem",
  margin: "0.25rem 0",
  textAlign: "center" as const,
};

const verificationSection = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: '0.5rem',
  borderBottom: "1px solid #eee"
};

const mainText = { 
  ...text, marginBottom: "14px" 
};

const cautionText = { 
  ...text, margin: "0px", textAlign: "center" as const 
};

export default RSVPEmail;
