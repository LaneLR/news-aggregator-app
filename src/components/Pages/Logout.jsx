"use client";
import { signOut } from "next-auth/react";
import styled from "styled-components";

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

//create separate component for handling logout, then import into Header
export default function LogoutComponent() {

  return <LogoutButton onClick={() => signOut({callbackUrl: '/login'}) }>Logout</LogoutButton>;
}
