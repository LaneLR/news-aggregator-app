"use client";
import styled from "styled-components";
import Button from "./Button";

const Wrapper = styled.div`
  width: 220px;
  height: 100%;
  padding: 20px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-direction: column;
  border-radius: 12px;
  background-color: var(--primary-blue);
  color: var(--white);
  background-image: linear-gradient(
    to bottom,
    var(--secondary-blue),
    var(--primary-blue)
  );
`;

const PlanTitle = styled.div`
  font-size: 1.55rem;
  text-align: center;
  font-weight: 600;
  padding: 0 0 6px 0;
`;

const PlanSubTitle = styled.div`
  font-size: 1.05rem;
  text-align: center;
  font-weight: 500;
`;

const PlanBody = styled.div`
  text-align: left;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin: 15px 0 0 0;

  p {
    position: relative;
    margin: 0;

    /* Bullet before each p */
    &::before {
      content: "✔";
      position: absolute;
      left: -16px;
      color: var(--white);
      font-weight: bold;
    }
  }
`;

const PlanChecklist = styled.p`
  font-size: 0.9rem;
  width: 100%;
`;

const Cost = styled.div`
  font-size: 1.6rem;
  font-weight: 600;
  margin-top: 20px;
`;

const ButtonContainer = styled.div`
  width: 100%;
  height: auto;
  margin: 10px 0 0 0;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export default function Banner3({ title, features, cost, onClick, children }) {
  return (
    <>
      <Wrapper>
        <PlanTitle>{title}</PlanTitle>
        <PlanSubTitle>You&apos;ll get</PlanSubTitle>
        <PlanBody>
          {features.map((feature, index) => (
            <PlanChecklist key={index}>{feature}</PlanChecklist>
          ))}
        </PlanBody>
        <Cost>{cost}</Cost>
        <ButtonContainer>
          {children}
        </ButtonContainer>
      </Wrapper>
    </>
  );
}
