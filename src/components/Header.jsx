"use client";
import styled from "styled-components";
import Image from "next/image";
import Link from "next/link";
import Button from "./Button";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80px;
  width: 100vw;
  // background-image: url("images/BronzeHeaderBackground.png");
  background-color: var(--dark-blue);
  color: white;
`;

const LeftContainer = styled.div`
  display: flex;
  align-items: center;
  text-align: left;
  justify-content: space-evenly;
  max-width: 50%;
  width: auto;
  height: 100%;
  padding: 0 0 0 20px;
  background-color: inherit;
`;

const RightContainer = styled.div`
  display: flex;
  align-items: center;
  text-align: right;
  justify-content: space-evenly;
  max-width: 50%;
  width: auto;
  height: 100%;
  padding: 0 20px 0 0;
  background-color: inherit;
`;

const UserAccountIcon = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  color: var(--light-white);
`;

const HeaderLogoBox = styled.div`
  display: flex;
  background-color: inherit;
  font-size: 2.5rem;
  font-weight: 700;
`;

const MenuIcon = styled.div`
  width: 20px;
  height: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  span {
    display: block;
    width: 100%;
    height: 2px;
    background-color: var(--white);
  }
`;

export default function Header() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  return (
    <Wrapper>
      {!!session ? (
        <>
          <LeftContainer>
            {session?.user ? (
              <Link href={"/news"}>
                {/* <Image
                src={"/images/BronzeLogoHeader.png"}
                width={100}
                height={50}
                alt="Bronze Logo in the Header"
              /> */}
                <HeaderLogoBox>News</HeaderLogoBox>
              </Link>
            ) : (
              <Link href={"/"}>
                <Image
                  src={"/images/BronzeLogoHeader.png"}
                  width={100}
                  height={50}
                  alt="Bronze Logo in the Header"
                />
              </Link>
            )}
          </LeftContainer>
          <RightContainer>
            <nav style={{ display: "flex", columnGap: "10px" }}>
              <Button
                bgColor={"var(--primary-blue)"}
                clr={"var(--light-white)"}
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Log out
              </Button>
              <Link href="/account">
                <UserAccountIcon>
                  <MenuIcon>
                    <span></span>
                    <span></span>
                    <span></span>
                  </MenuIcon>
                </UserAccountIcon>
              </Link>
            </nav>
          </RightContainer>
        </>
      ) : (
        <>
          <LeftContainer>
            <Link href={"/"}>
              {/* <Image
                src={"/images/BronzeText.png"}
                width={125}
                height={39}
                alt="Bronze Logo in the Header"
              /> */}
              <HeaderLogoBox>News</HeaderLogoBox>
            </Link>
          </LeftContainer>
          <RightContainer>
            <nav style={{ display: "flex", columnGap: "10px" }}>
              <Link href={"/login"}>
                <Button
                  bgColor={"var(--primary-blue)"}
                  clr={"var(--light-white)"}
                >
                  Log in
                </Button>
              </Link>
            </nav>
          </RightContainer>
        </>
      )}
    </Wrapper>
  );
}
