import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 9px 13px;
  color: ${(props) => props.theme.primary};
  font-weight: 600;
  font-size: 1.1rem;
  background-color: ${(props) => props.theme.background};
`;

const LeftContainer = styled.div``;

const CenterContainer = styled.div`
  display: flex;
  flex-flow: row nowrap;
  gap: 6px;

  @media (max-width: 618px) {
    flex-direction: column;
    align-items: center;
    text-align: center;
    width: 100%;
  }

  @media (max-width: 440px) {
    flex-direction: column;
    align-items: center;
    text-align: center;
    width: 100%;
    font-size: 0.95rem;
  }
`;

const RightContainer = styled.div``;

const CloseButton = styled.button`
  border: none;
  background-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

const Underline = styled.div`
  border: 1px solid ${(props) => props.theme.primary};
`;

export default function HeaderSubscribeBanner({ sessionData }) {
  const { data: session, status, update } = useSession({ data: sessionData });
  const isNotSubscribed = session?.user?.tier === "Free";

  const [isCtaVisible, setIsCtaVisible] = useState(true);

  useEffect(() => {
    const ctaDismissed = sessionStorage.getItem("hideUpgradeCTA");
    if (ctaDismissed === "true") {
      setIsCtaVisible(false);
    }
  }, []);

  const handleDismissCta = () => {
    setIsCtaVisible(false);
    sessionStorage.setItem("hideUpgradeCTA", "true");
  };

  return (
    <>
      {isNotSubscribed && isCtaVisible && (
        <Wrapper>
          <LeftContainer />
          <CenterContainer>
            Want to create and customize your own feeds?
            <Link
              href="/pricing"
              style={{
                display: "flex",
                flexFlow: "column nowrap",
                width: "fit-content",
              }}
            >
              <p>Become a member!</p>
              <Underline />
            </Link>
          </CenterContainer>
          <RightContainer>
            <CloseButton onClick={handleDismissCta}>
              <img
                alt="Close button"
                src="/images/close.svg"
                width={16}
                height={16}
                color="white"
              />
            </CloseButton>
          </RightContainer>
        </Wrapper>
      )}
    </>
  );
}
