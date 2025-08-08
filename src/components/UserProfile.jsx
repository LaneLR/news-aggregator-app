"use client";
import Button from "./Button";
import Divider from "./Divider";
import styled from "styled-components";

const WarningWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  flex-direction: column;
  margin: 0 0 20px 0;
`;

const Underline = styled.div`
  margin-top: 2px;
  border-top: 2px solid #000;
  width: 100%;
`;

const DeleteAccountWarning = styled.div`
  background-color: rgba(255, 34, 34, 0.42);
  max-width: 500px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 16px 32px;
  font-weight: 600;
  border-radius: 6px;
  margin: 0 0 20px 0;
`;

export default function ProfilePage({ session }) {
  const handleCancelDeletion = async () => {
    try {
      const res = await fetch("/api/users/cancel-deletion", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to cancel account deletion");

      alert("Account deletion has been canceled.");
      location.reload();
    } catch (err) {
      console.error("Cancellation error:", err);
      alert("Something went wrong while canceling account deletion.");
    }
  };

  const handleRequestDeletion = async () => {
    try {
      const res = await fetch("/api/users/request-deletion", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to request account deletion");

      alert(
        "Account deletion requested. Your account will be deleted in 24 hours unless you cancel."
      );
      location.reload();
    } catch (err) {
      console.error("Deletion request error:", err);
      alert("Something went wrong while requesting account deletion.");
    }
  };

  return (
    <>
      {session.user.pendingDeletion !== false ? (
        <WarningWrapper>
          <DeleteAccountWarning>
            <p>Your account is scheduled to be deleted at 11:59pm CT.</p>
            <Underline />
          </DeleteAccountWarning>
          <Button
            onClick={handleCancelDeletion}
            bgColor={"#333333ff"}
            clr={"var(--white)"}
          >
            Cancel Account Deletion
          </Button>
        </WarningWrapper>
      ) : (
        ""
      )}
      <div
        style={{
          color: "var(--dark-blue)",
          display: "flex",
          justifyContent: "center",
          width: "100%",
          height: "auto",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        <h1>Profile</h1>
        <p>Your email: {session.user.email}</p>
        <Divider />
        <p>Subscription stuff</p>
      </div>
      <Button onClick={handleRequestDeletion}>Request Account Deletion</Button>
    </>
  );
}
