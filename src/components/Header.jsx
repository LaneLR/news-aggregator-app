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
  background-color: #EE821F;
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
`;

const UserAccountIcon = styled.div`
  width: 40px;
  height: 40px;
  background-color: #fff;
  border-radius: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  color: black;
`;

const LogoutButton = styled.button`
  background-color: rgb(179, 40, 31);
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 15px;
  cursor: pointer;
  font-size: 1rem;
  &:hover {
    background-color: rgb(139, 15, 15);
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
            {session?.user ?
            <Link href={'/news'}>
              {/* <Image
                src={"/images/BronzeLogoHeader.png"}
                width={100}
                height={50}
                alt="Bronze Logo in the Header"
              /> */}
              News
            </Link>
              :
            <Link href={'/'}>
              <Image
                src={"/images/BronzeLogoHeader.png"}
                width={100}
                height={50}
                alt="Bronze Logo in the Header"
              />
            </Link>
            }
          </LeftContainer>
          <RightContainer>
            <nav style={{ display: "flex", columnGap: "10px" }}>
              <LogoutButton onClick={() => signOut({ callbackUrl: "/login" })}>
                Log out
              </LogoutButton>
              <Link href="/account">
                <UserAccountIcon>
                  <p>
                    {session?.user?.username?.slice(0, 2).toUpperCase()}
                  </p>
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
              <p style={{fontWeight: '600', fontSize: '2rem'}}>News</p>
            </Link>
          </LeftContainer>
          <RightContainer>
            <nav style={{ display: "flex", columnGap: "10px" }}>
              <Link href={"/login"}>
                <Button bgColor="#FFEFD5" clr={"#EE821F"}>Log In</Button>
              </Link>
            </nav>
          </RightContainer>
        </>
      )}
    </Wrapper>
  );
}
