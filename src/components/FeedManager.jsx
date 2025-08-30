"use client";
import { useState, useEffect } from "react";
import News from "./NewsFeed";
import CreateFeedModal from "./CreateFeedModal";
import Button from "./Button";
import styled from "styled-components";
import { useSession } from "next-auth/react";
import Link from "next/link";

const FeedSelectorWrapper = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  margin: 20px 0;
  padding: 0 20px;
`;

const UpgradePrompt = styled.div`
  position: relative;
  padding: 35px 1rem 1rem 1rem;
  background-color: #eef2f9;
  border: 1px solid #d1d9e6;
  border-radius: 8px;
  text-align: center;
  margin: 20px;
	width: fit-content;
`;

const UpgradePromptText = styled.div`
  font-weight: 600;
  padding: 0 0 10px 0;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 8px;
  right: 12px;
  background: none;
  border: none;
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--dark-blue);
  cursor: pointer;
  padding: 0;
  line-height: 1;

  &:hover {
    color: #333;
  }
`;

export default function FeedManager({ sessionData }) {
  const [feeds, setFeeds] = useState([]);
  const [selectedFeedId, setSelectedFeedId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedToEdit, setFeedToEdit] = useState(null);

  const { data: session, status, update } = useSession({ data: sessionData });
  const isSubscribed = session?.user?.tier !== "Free";

  const [isCtaVisible, setIsCtaVisible] = useState(true);

  useEffect(() => {
    const ctaDismissed = sessionStorage.getItem("hideUpgradeCTA");
    if (ctaDismissed === "true") {
      setIsCtaVisible(false);
    }
  }, []);

  const fetchFeeds = async () => {
    if (!isSubscribed) return;
    const res = await fetch("/api/feeds");
    if (res.ok) {
      const data = await res.json();
      setFeeds(data);
    }
  };

  useEffect(() => {
    if (session) {
      fetchFeeds();
    }
  }, [session, isSubscribed]);

  const handleDismissCta = () => {
    setIsCtaVisible(false);
    sessionStorage.setItem("hideUpgradeCTA", "true");
  };

  const handleOpenEditModal = () => {
    const currentFeed = feeds.find((f) => f.id == selectedFeedId);

    if (currentFeed) {
      setFeedToEdit(currentFeed);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFeedToEdit(null);
  };

  const onActionSuccess = () => {
    fetchFeeds();
    setSelectedFeedId(null);
  };

  return (
    <>
      {isSubscribed ? (
        <FeedSelectorWrapper>
          <select
            value={selectedFeedId || ""}
            onChange={(e) => setSelectedFeedId(e.target.value || null)}
            style={{ padding: "10px", borderRadius: "6px" }}
          >
            <option value="">All News</option>
            {feeds.map((feed) => (
              <option key={feed.id} value={feed.id}>
                {feed.title}
              </option>
            ))}
          </select>
          <Button onClick={() => setIsModalOpen(true)}>+ Create Feed</Button>
          {selectedFeedId && (
            <Button onClick={handleOpenEditModal}>Edit Feed</Button>
          )}
        </FeedSelectorWrapper>
      ) : (
        isCtaVisible && (
          <UpgradePrompt>
            <CloseButton onClick={handleDismissCta} aria-label="Dismiss">
              x
            </CloseButton>
            <UpgradePromptText>
              Want to create custom news feeds?
            </UpgradePromptText>
            <Link href="/pricing" passHref>
              <Button bgColor="var(--primary-blue)" clr="white">
                Upgrade to Pro
              </Button>
            </Link>
          </UpgradePrompt>
        )
      )}

      <CreateFeedModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={onActionSuccess}
        feedToEdit={feedToEdit}
      />

      {/* Pass the correct feedId. For free users, it will always be null. */}
      <News feedId={isSubscribed ? selectedFeedId : null} />
    </>
  );
}
