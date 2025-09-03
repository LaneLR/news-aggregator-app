"use client";
import { useSession } from "next-auth/react";
import Button from "./Button";
import Divider from "./Divider";
import styled from "styled-components";
import Loading from "@/app/loading";
import { useState, useEffect } from "react";
import Image from "next/image";

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

const FALLBACK_IMAGE_URL = "/images/default-avatar.png";

export default function ProfilePage({ sessionData }) {
  const { data: session, status, update } = useSession({ data: sessionData });

  const proxiedImageUrl = session?.user?.image
    ? `/api/image-proxy?url=${encodeURIComponent(session.user.image)}`
    : FALLBACK_IMAGE_URL;

  const [imageSrc, setImageSrc] = useState(FALLBACK_IMAGE_URL);

  useEffect(() => {
    if (session?.user?.image) {
      // Get the raw URL from the session
      const rawUrl = session.user.image;
      // Construct the proxied URL
      const proxiedUrl = `/api/image-proxy?url=${encodeURIComponent(rawUrl)}`;
      setImageSrc(proxiedUrl);
    } else {
      // If there's no image in the session, ensure it uses the fallback
      setImageSrc(FALLBACK_IMAGE_URL);
    }
  }, [session]);

  const handleImageError = () => {
    setImageSrc(FALLBACK_IMAGE_URL);
  };

  if (status === "loading") {
    return <Loading />;
  }

  if (status === "unauthenticated" || !session) {
    return <p>Access Denied. Please sign in to view your profile.</p>;
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
    try {
      const res = await fetch("/api/users/cancel-deletion", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id }),
      });

      if (!res.ok) {
        throw new Error("Failed to cancel account deletion");
      }

      await update();
    } catch (err) {
      console.error("Cancellation error:", err);
    }
  };

  const handleRequestDeletion = async () => {
    try {
      const res = await fetch("/api/users/request-deletion", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id }),
      });

      if (!res.ok) {
        throw new Error("Failed to request account deletion");
      }

      await update();

    } catch (err) {
      console.error("Deletion request error:", err);
    }
  };

  const readyForDeletion = session?.user?.isPendingDeletion;

  return (
    <>
      {readyForDeletion ? (
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
        <Image
          src={imageSrc}
          width={100}
          height={100}
          alt={"User image"}
          onError={handleImageError}
          style={{ borderRadius: "50%" }}
        />
        <p>Your email: {session.user.email}</p>
        <br /> <p>Your name: {session.user.name}</p>
        <Divider /> <p>Subscription stuff</p>
      </div>
      {!readyForDeletion && (
        <Button
          onClick={handleRequestDeletion}
          bgColor={"var(--primary-blue)"}
          clr={"var(--white)"}
        >
          Delete Account
        </Button>
      )}
    </>
  );
}
