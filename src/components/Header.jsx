"use client";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { logoutUser } from "@/app/slices/manageLoggedIn";
import { useDispatch } from "react-redux";
import Image from "next/image";
import LogoutComponent from "./Logout";
import Link from "next/link";
import Button from "./Button";

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80px;
  width: 100vw;
  background-image: url('images/BronzeHeaderBackground.png');
  color: white;
`;

const HeaderLogo = styled.div`
background-image: url('images/BronzeLogoHeader.png')
width: auto;
height: auto;
`

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

export default function Header() {
  const isLoggedIn = useSelector((state) => state.manageLoggedIn.isLoggedIn);
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logoutUser());
    window.location.href = "/login";
  };

  return (
    <Wrapper>
      {isLoggedIn ? (
        <>
          <LeftContainer>
            <Image 
            src={'/images/BronzeLogoHeader.png'}
            width={100}
            height={50}
            alt="Bronze Logo in the Header"
            />
          </LeftContainer>
          <RightContainer>
            <nav style={{display: "flex", columnGap: "10px"}}>
              <LogoutComponent onClick={handleLogout}>Logout</LogoutComponent>
              <UserAccountIcon>
                <Link href='/account'>
                <p>User</p>
                </Link>
                
              </UserAccountIcon>
            </nav>
          </RightContainer>
        </>
      ) : (
        <>
          <LeftContainer >
            <Link href={'/'}>
                         <Image 
            src={'/images/BronzeText.png'}
            width={125}
            height={39}
            alt="Bronze Logo in the Header"
            />
            </Link>

          </LeftContainer>
          <RightContainer>
            <nav style={{display: "flex", columnGap: "10px"}}>
                <Link href={"/login"}>
                <Button bgColor='#9E6532'>Login</Button>
                </Link>
            </nav>
          </RightContainer>
        </>
      )}
    </Wrapper>
  );
}
