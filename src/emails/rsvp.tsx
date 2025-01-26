import * as React from "react";
import { Body, Container, Head, Heading, Hr, Html, Img, Preview, Section, Text } from "@react-email/components";
import { IRSVP } from "../models/rsvp/types";

function RSVPEmail({ firstName, lastName, email, attending, favoriteDanceMove, storyName, marriageAdvice, hashtag, figure, favoriteMemory }: IRSVP) {
  return (
    <Html>
      <Head />
      
      <Preview>
        NEW RSVP FOR MAVI2025
      </Preview>
      
      <Body style={main}>
        <Container style={container}>
          <Section style={coverSection}>
            <Section style={imageSection}>
              <Img
                src='https://mavi-nu.vercel.app/images/mv-logo.jpeg'
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
                
                <Section style={verificationSection}>
                  <Text style={verifyText}>Signature Dance Move</Text>
                  <Text style={codeText}>{favoriteDanceMove}</Text>
                </Section>
                
                <Section style={verificationSection}>
                  <Text style={verifyText}>Love Story Title</Text>
                  <Text style={codeText}>{storyName}</Text>
                </Section>
                
                <Section style={verificationSection}>
                  <Text style={verifyText}>MarriageAdvice</Text>
                  <Text style={codeText}>{marriageAdvice}</Text>
                </Section>
                
                <Section style={verificationSection}>
                  <Text style={verifyText}>HASHTAG</Text>
                  <Text style={hastagText}>{hashtag}</Text>
                </Section>
                
                <Section style={verificationSection}>
                  <Text style={verifyText}>Historical Plus One</Text>
                  <Text style={hastagText}>{figure}</Text>
                </Section>
                
                <Section style={verificationSection}>
                  <Text style={verifyText}>Favorite Memory</Text>
                  <Text style={hastagText}>{favoriteMemory}</Text>
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
  border: "1px solid #EBEBEB",
  justifyContent: "center" as const,
  alignItems: "center" as const,
  flexDirection: "column" as const,
}

const heading = {
  color: "#333",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "20px",
  fontWeight: "bold",
  textAlign: "center" as const, 
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
  textAlign: "center" as const, 
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
  ...text,
  marginBottom: "14px",
};

const cautionText = { 
  ...text, margin: "0px", textAlign: "center" as const 
};

const hastagText = {
  ...codeText,
  textTransform: "uppercase" as const,
};

export default RSVPEmail;
