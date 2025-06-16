"use client";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { logoutUser } from "@/app/slices/manageLoggedIn";
import { useDispatch } from "react-redux";
import LogoutComponent from "./Logout";
import Link from "next/link";

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 50px;
  width: 100vw;
  background-color: rgb(180, 107, 107);
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
            <h1>The News</h1>
          </LeftContainer>
          <RightContainer>
            <nav style={{display: "flex", columnGap: "10px"}}>
              <LogoutComponent onClick={handleLogout}>Logout</LogoutComponent>
              <UserAccountIcon>
                <p>User</p>
              </UserAccountIcon>
            </nav>
          </RightContainer>
        </>
      ) : (
        <>
          <LeftContainer />
          <RightContainer>
            <nav style={{display: "flex", columnGap: "10px"}}>
                <Link href={"/login"}>
                <p>Login</p>
                </Link>
            </nav>
          </RightContainer>
        </>
      )}
    </Wrapper>
  );
}
