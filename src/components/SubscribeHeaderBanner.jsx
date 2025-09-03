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
  color: var(--primary-blue);
  font-weight: 600;
  font-size: 1.1rem;
  background-color: var(--white);
`;

const LeftContainer = styled.div``;

const CenterContainer = styled.div`
  display: flex;
  gap: 6px;
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
  border: 1px solid var(--primary-blue);
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
            Want to customize your own feeds?
            <Link href="/pricing">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "fit-content",
                }}
              >
                <p>Become a member!</p>
                <Underline />
              </div>
            </Link>
          </CenterContainer>
          <RightContainer>
            <CloseButton onClick={handleDismissCta}>
              <img
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
