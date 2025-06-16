"use client";
import { useDispatch } from "react-redux";
import { logoutUser } from "@/app/slices/manageLoggedIn";
import { useRouter } from "next/navigation";
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
  const dispatch = useDispatch();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        dispatch(logoutUser());
        console.log("Logged out successfully.");
        router.push("/login");
      } else {
        console.error("Logout failed on server side:", await res.json());
      }
    } catch (err) {
      console.error("Client-side logout error:", err);
    }
  };

  return <LogoutButton onClick={handleLogout}>Logout</LogoutButton>;
}
