"use client";
import { useSession } from "next-auth/react";
import styled from "styled-components";
import Loading from "@/app/loading";
import Image from "next/image";
import Button from "./Button";
import { useEffect, useState } from "react";
import CopyButton from "./CopyButton";

const ProfileWrapper = styled.div`
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const Card = styled.div`
  background-color: var(--white);
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  border: 1px solid #e0e0e0;
  overflow: hidden;
`;

const ProfileHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem;
  background-color: #f9f9f9;
`;

const Avatar = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 1rem;
  border: 4px solid var(--white);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  user-select: none;
`;

const UserName = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const UserEmail = styled.p`
  font-size: 1rem;
  color: #666;
  margin: 0.25rem 0 0 0;
`;

const TierBadge = styled.span`
  font-size: 1rem;
  font-weight: bold;
  padding: 4px 12px;
  border-radius: 16px;
  color: white;
  background-color: ${(props) =>
    props.tier === "Free" ? "#6c757d" : "var(--primary-blue)"};
`;

const CardHeader = styled.h2`
  font-size: 1.25rem;
  padding: 1rem 1.5rem;
  margin: 0;
  border-bottom: 1px solid #e0e0e0;
`;

const CardContent = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1rem;
  color: #333;

  & span:first-child {
    color: #555;
  }
`;

const CardFooter = styled.div`
  padding: 1rem 1.5rem;
  background-color: #f9f9f9;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
`;

const DangerCardHeader = styled(CardHeader)`
  background-color: #fff5f5;
  color: #c53030;
  border-bottom-color: #fed7d7;
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
      const rawUrl = session.user.image;
      const proxiedUrl = `/api/image-proxy?url=${encodeURIComponent(rawUrl)}`;
      setImageSrc(proxiedUrl);
    } else {
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

  const { user } = session;

  const handleManageSubscription = async () => {
    const response = await fetch("/api/stripe/manage-subscription", {
      method: "POST",
    });
    const { url } = await response.json();
    window.location.href = url;
  };

  const handleRequestDeletion = async () => {
    await fetch("/api/users/request-deletion", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    await update();
  };

  const handleCancelDeletion = async () => {
    await fetch("/api/users/cancel-deletion", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    await update();
  };

  const getScheduledDeletionDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 0, 0);
    return tomorrow;
  };

  const scheduledDeletionDate = getScheduledDeletionDate();
  const formattedDate = scheduledDeletionDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = scheduledDeletionDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <ProfileWrapper>
      <ProfileHeader>
        <Avatar>
          <Image
            src={imageSrc}
            width={120}
            height={120}
            alt={"User profile image"}
            onError={handleImageError}
          />
        </Avatar>
        <UserName>
          {user.name}
          <TierBadge tier={user.tier}>
            {user.tier === "Free"
              ? "Free Tier"
              : user.tier === "Pro"
              ? "Pro Tier"
              : "Pro Annual Tier"}
          </TierBadge>
        </UserName>
        <UserEmail>{user.email}</UserEmail>
      </ProfileHeader>

      <Card>
        <CardHeader>Subscription</CardHeader>
        <CardContent>
          {user.tier === "Free" ? (
            <p>You are currently on the Free plan.</p>
          ) : (
            <>
              <InfoRow>
                <span>Current Plan</span>
                <strong>{user.tier}</strong>
              </InfoRow>
              <InfoRow>
                <span>Status</span>
                <strong style={{ textTransform: "capitalize" }}>
                  {user.stripeSubscriptionStatus}
                </strong>
              </InfoRow>
              {user.stripeSubscriptionEndsAt && (
                <InfoRow>
                  <span>
                    {user.subscriptionWillCancel ? (
                      <b>Cancels on</b>
                    ) : (
                      <b>Renews on</b>
                    )}
                  </span>
                  <strong>
                    {new Date(
                      user.stripeSubscriptionEndsAt
                    ).toLocaleDateString()}
                  </strong>
                </InfoRow>
              )}
            </>
          )}
        </CardContent>
        <CardFooter>
          {user.tier === "Free" ? (
            <Button
              bgColor="var(--primary-blue)"
              clr="white"
              onClick={() => (window.location.href = "/pricing")}
            >
              Upgrade to Pro
            </Button>
          ) : (
            <Button
              bgColor={"var(--primary-blue"}
              clr={"var(--white)"}
              onClick={handleManageSubscription}
            >
              Manage Subscription
            </Button>
          )}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>Your Referral Code</CardHeader>
        <CardContent>
          <p>
            Share this code with your friends! They&apos;ll get a discount on
            their first subscription, and you&apos;ll get a credit on your next
            bill.
          </p>
          <div>
            {user.referralCount > 0 && (
              <p>Users referred: {user.referralCount} </p>
            )}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              height: '47px',
            }}
          >
            <p
              style={{
                fontSize: "1.6rem",
                fontWeight: "500",
                letterSpacing: "2px",
                background: "#f0f0f0",
                padding: "9px",
                borderTopLeftRadius: "10px",
                borderBottomLeftRadius: "10px",
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {user.referralCode}
            </p>
            <CopyButton textToCopy={user.referralCode} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <DangerCardHeader>Account Settings</DangerCardHeader>
        <CardContent>
          {user.isPendingDeletion ? (
            <p>
              Your account is scheduled for deletion on <b>{formattedDate}</b>{" "}
              at <b>{formattedTime}</b>. You can cancel this You can request to
              cancel this at any time before.
            </p>
          ) : (
            <p>
              Deactivate your account and all of your content. This action is
              irreversible.
            </p>
          )}
        </CardContent>
        <CardFooter>
          {user.isPendingDeletion ? (
            <Button bgColor="#333" clr="white" onClick={handleCancelDeletion}>
              Cancel Deletion
            </Button>
          ) : (
            <Button
              bgColor="#c53030"
              clr="white"
              onClick={handleRequestDeletion}
            >
              Delete Account
            </Button>
          )}
        </CardFooter>
      </Card>
    </ProfileWrapper>
  );
}
