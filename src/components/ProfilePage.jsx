"use client";

import { useSession } from "next-auth/react";
import Button from "./Button";
import Divider from "./Divider";
import styled from "styled-components";
import Loading from "@/app/loading";
import { useState, useEffect } from "react";
import Image from "next/image";

// --- (Your styled-components remain the same) ---
const WarningWrapper = styled.div`
  /* ... */
`;
const Underline = styled.div`
  /* ... */
`;
const DeleteAccountWarning = styled.div`
  /* ... */
`;
const EmphasizedText = styled.div`
  /* ... */
`;

// Define a constant for your fallback image
const FALLBACK_IMAGE_URL = "/default-avatar.png";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const [isPendingDeletion, setIsPendingDeletion] = useState(false);
  // Initialize imageSrc state with the fallback
  const [imageSrc, setImageSrc] = useState(FALLBACK_IMAGE_URL);

  // This effect runs when the session data is loaded or changes
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

    if (session?.user) {
      setIsPendingDeletion(session.user.pendingDeletion !== false);
    }
  }, [session]); // The dependency array ensures this runs when `session` changes

  // This function will be called by the <Image> component on error
  const handleImageError = () => {
    setImageSrc(FALLBACK_IMAGE_URL);
  };

  if (status === "loading") {
    return <Loading />;
  }

  if (status === "unauthenticated" || !session) {
    return <p>Access Denied. Please sign in to view your profile.</p>;
  }

  // ... (Your date logic and handlers for deletion remain the same) ...
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const tomorrowDateString = tomorrow.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleCancelDeletion = async () => {
    /* ... */
  };
  const handleRequestDeletion = async () => {
    /* ... */
  };

  return (
    <>
      {isPendingDeletion ? <WarningWrapper>{/* ... */}</WarningWrapper> : null}

      <div>
        <h1>Profile</h1>
        {/* The Image component now correctly uses the state */}
        <Image
          src={imageSrc}
          width={100}
          height={100}
          alt={"User image"}
          onError={handleImageError} // This is a great safety net
          style={{ borderRadius: "50%" }}
        />
        <p>Your email: {session.user.email}</p>
        <br />
        <p>Your name: {session.user.name}</p>
        <Divider />
        <p>Subscription stuff</p>
      </div>

      {!isPendingDeletion && (
        <Button onClick={handleRequestDeletion} bgColor={"var(--primary-blue)"}>
          Delete Account
        </Button>
      )}
    </>
  );
}
