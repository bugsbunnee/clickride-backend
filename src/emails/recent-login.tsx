import React from "react";
import { Body, Button, Container, Column, Head, Heading, Html, Img, Preview, Row, Section, Text } from "@react-email/components";
import { CLIKRIDE_BASE_URL, CLIKRIDE_LOGO } from '../utils/data';
  
  interface Props {
    userFirstName: string;
    loginDate: string;
    loginDevice: string;
    loginLocation: string;
    loginIp: string;
  }
  
  const RecentLoginEmail = ({
    userFirstName,
    loginDate,
    loginDevice,
    loginLocation,
    loginIp,
  }: Props) => {
  
    return (
      <Html>
        <Head />
        
        <Preview>
          Recent login
        </Preview>
        
        <Body style={main}>
          <Container>
            <Section style={logo}>
              <Img src={CLIKRIDE_LOGO} style={cta} />
            </Section>
  
            <Section style={content}>
              <Row>
                <Img
                  style={image}
                  width={820}
                  src='https://res.cloudinary.com/dgdu2dyce/image/upload/v1733577799/recent-login-header_tt9yjb.png'
                />
              </Row>
  
              <Row style={{ ...boxInfos, paddingBottom: "0" }}>
                <Column>
                  <Heading style={greeting}>
                    Hi {userFirstName},
                  </Heading>

                  <Heading as="h2" style={body}>
                    We noticed a recent login to your account.
                  </Heading>
  
                  <Text style={paragraph}>
                    <b>Time: </b>
                    {loginDate}
                  </Text>

                  <Text style={paragraphWithMargin}>
                    <b>Device: </b>
                    {loginDevice}
                  </Text>
                
                  <Text style={paragraphWithMargin}>
                    <b>Location: </b>
                    {loginLocation}
                  </Text>

                  <Text style={note}>
                    *Approximate geographic location based on IP address:
                    {loginIp}
                  </Text>
  
                  <Text style={paragraph}>
                    If this was you, there's nothing else you need to do.
                  </Text>

                  <Text style={paragraphWithMargin}>
                    If this wasn't you or if you have additional questions, please
                    see our support page.
                  </Text>
                </Column>
              </Row>

              <Row style={{ ...boxInfos, paddingTop: "0" }}>
                <Column style={containerButton} colSpan={2}>
                  <Button style={button} href={CLIKRIDE_BASE_URL}>Learn More</Button>
                </Column>
              </Row>
            </Section>

            <Section style={containerImageFooter}>
              <Img
                style={image}
                width={820}
                src='https://res.cloudinary.com/dgdu2dyce/image/upload/v1733577800/recent-login-footer_twob1o.png'
              />
            </Section>

            <Text style={address}>
              © 2025 | Lagos Island, Lagos, Nigeria | {CLIKRIDE_BASE_URL}
            </Text>
          </Container>
        </Body>
      </Html>
    );
  };
  
  const address = {
    textAlign: "center" as const,
    fontSize: 12,
    color: "rgb(0,0,0, 0.7)",
  };

  const body = {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center" as const,
  };

  const cta = {
    width: "100px",
    height: "50px",
    objectFit: "contain" as const,
  }

  const boxInfos = {
    padding: "20px",
  };
  
  const button = {
    backgroundColor: "#e00707",
    borderRadius: 3,
    color: "#FFF",
    fontWeight: "bold",
    border: "1px solid rgb(0,0,0, 0.1)",
    cursor: "pointer",
    padding: "12px 30px",
  };

  const containerButton = {
    display: "flex",
    justifyContent: "center",
    width: "100%",
  };
  
  const containerImageFooter = {
    padding: "45px 0 0 0",
  };

  const content = {
    border: "1px solid rgb(0,0,0, 0.1)",
    borderRadius: "3px",
    overflow: "hidden",
  };

  const greeting = {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center" as const,
  };

  const image = {
    maxWidth: "100%",
  };

  const logo = {
    padding: "30px 20px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  };

  const main = {
    backgroundColor: "#fff",
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  };

  const note = {
    color: "rgb(0,0,0, 0.5)",
    fontSize: 14,
    marginTop: -5,
  };

  const paragraph = {
    fontSize: 16,
  };

  const paragraphWithMargin = { 
    ...paragraph, 
    marginTop: -5 
  };
  
  export default RecentLoginEmail;
