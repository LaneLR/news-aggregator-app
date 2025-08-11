"use client";
import { useSession } from "next-auth/react";
import Button from "./Button";
import Divider from "./Divider";
import styled from "styled-components";
import Loading from "@/app/loading";
import { useState, useEffect } from "react"; 

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
  width: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 16px 32px;
  font-weight: 500;
  border-radius: 6px;
  margin: 0 0 20px 0;
`;

const EmphasizedText = styled.div`
  font-weight: 600;
`;

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const [isPendingDeletion, setIsPendingDeletion] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setIsPendingDeletion(session.user.pendingDeletion !== false);
    }
  }, [session]);

  if (status === "loading") {
    return <Loading />;
  }

  if (!session) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        Please log in to view your profile.
      </div>
    );
  }

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const tomorrowDateString = tomorrow.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleCancelDeletion = async () => {
    setIsPendingDeletion(false);
    try {
      const res = await fetch("/api/users/cancel-deletion", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Failed to cancel account deletion");

      await update();
      alert("Account deletion has been canceled.");
    } catch (err) {
      setIsPendingDeletion(true);
      console.error("Cancellation error:", err);
      alert("Something went wrong while canceling account deletion.");
    }
  };

  const handleRequestDeletion = async () => {
    setIsPendingDeletion(true);
    try {
      const res = await fetch("/api/users/request-deletion", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Failed to request account deletion");

      await update();
      alert(
        "Account deletion requested. Your account will be deleted in 24 hours unless you cancel."
      );
    } catch (err) {
      setIsPendingDeletion(false);
      console.error("Deletion request error:", err);
      alert("Something went wrong while requesting account deletion.");
    }
  };

  return (
    <>
      {isPendingDeletion ? (
        <WarningWrapper>
          <DeleteAccountWarning>
            <p>
              Your account is scheduled to be deleted on{" "}
              <b>{tomorrowDateString}</b> at <b>11:59pm CT</b>.
            </p>
            <Underline />
          </DeleteAccountWarning>
          <Button
            onClick={handleCancelDeletion}
            bgColor={"#333333ff"}
            clr={"var(--white)"}
          >
            Cancel Deleting Account
          </Button>
        </WarningWrapper>
      ) : null}

      <div>
        <h1>Profile</h1>
        <p>Your email: {session.user.email}</p>
        <Divider />
        <p>Subscription stuff</p>
      </div>

      {!isPendingDeletion && (
        <Button onClick={handleRequestDeletion} bgColor={"var(--primary-blue)"}>Delete Account</Button>
      )}
    </>
  );
}
