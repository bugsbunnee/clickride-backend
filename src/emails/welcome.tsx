import * as React from "react";
import { Body, Button, Container, Head, Hr, Html, Img, Preview, Section, Text } from "@react-email/components";
import { CLIKRIDE_BASE_URL, CLIKRIDE_LOGO } from '../utils/data';
  
interface Props {
    userFirstname: string;
}

const WelcomeEmail = ({ userFirstname }: Props) => (
    <Html>
      <Head />
      
      <Preview>
        Welcome to ClikRide
      </Preview>
      
      <Body style={main}>
        <Container style={container}>
          <Img
            src={CLIKRIDE_LOGO}
            width="170"
            height="70"
            alt="ClikRide"
            style={logo}
          />

          <Text style={paragraph}>Hi {userFirstname},</Text>
          
          <Text style={paragraph}>
            Welcome to ClikRide, providing you with the most affordable rides from the convenience of your home.
          </Text>
          
          <Section style={btnContainer}>
            <Button style={button} href={CLIKRIDE_BASE_URL}>
              Get started
            </Button>
          </Section>

          <Text style={paragraph}>
            Best,
            <br />
            The ClikRide team
          </Text>

          <Hr style={hr} />
          
          <Text style={footer}>
            Lagos Island, Lagos, Nigeria
          </Text>
        </Container>
      </Body>
    </Html>
);
    
const main = {
    backgroundColor: "#ffffff",
    fontFamily:
      '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};
  
const container = {
    margin: "0 auto",
    padding: "20px 0 48px",
};
  
const logo = {
    margin: "0 auto",
    objectFit: "cover" as const,
};
  
const paragraph = {
    fontSize: "16px",
    lineHeight: "26px",
};
  
const btnContainer = {
    textAlign: "center" as const,
};
  
const button = {
    backgroundColor: "#F58634",
    borderRadius: "3px",
    color: "#fff",
    fontSize: "16px",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "block",
    padding: "12px",
};
  
const hr = {
    borderColor: "#cccccc",
    margin: "20px 0",
};
  
const footer = {
    color: "#8898aa",
    fontSize: "12px",
};
  
export default WelcomeEmail;
