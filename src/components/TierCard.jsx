import Image from "next/image";
import React from "react";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  width: 200px;
  background-color: ${(props) => props.theme.primary};
  padding: 20px 8px;
  border-radius: 12px;
`;

const CardsWrapper = styled.div`
  display: flex;
  gap: 2rem;
  width: 100%;
  flex-wrap: wrap;
  justify-content: center;
`;

const Card = styled.div`
  flex: 1;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const Title = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
`;

const ContentPlaceholder = styled.div`
  width: 100%;
  height: auto;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  display: flex;
  padding: 10px 0;
  justify-content: center;
  align-items: center;
  font-size: 1.2rem;
  font-weight: 500;
`;

const Description = styled.p`
  font-size: 1rem;
`;

const BulletList = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: left;
  width: 100%;
  gap: 0.5rem;
  padding: 0 0 0 20px;
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.5;
  text-align: left;

  p {
    position: relative;
    margin: 0;

    /* Bullet before each p */
    &::before {
      content: "•";
      position: absolute;
      left: -15px;
      color: ${(props) => props.theme.primary};
      font-weight: bold;
    }
  }
`;

export default function TierCard({ title }) {
  return (
    <Container>
      <CardsWrapper>
        <Card>
          <Title>{title}</Title>
          <ContentPlaceholder>
            <BulletList>
              <p>abc</p>
            </BulletList>
          </ContentPlaceholder>
          <Description>
            Description of the tier goes here. This can include features,
            benefits, and any other relevant information that helps users
            understand what they get with this tier.
          </Description>
        </Card>
      </CardsWrapper>
    </Container>
  );
}
