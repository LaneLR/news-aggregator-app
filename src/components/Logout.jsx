"use client";
import { signOut } from "next-auth/react";
import styled from "styled-components";

const LogoutButton = styled.button`
  background-color: ${(props) => props.theme.primary};
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 15px;
  cursor: pointer;
  font-size: 1rem;
  &:hover {
    background-color: ${(props) => props.theme.primary};
  }
`;

//create separate component for handling logout, then import into Header
export default function LogoutComponent() {

  return <LogoutButton onClick={() => signOut({callbackUrl: '/login'}) }>Logout</LogoutButton>;
}
