"use client";
import { useState, useEffect } from "react";
import News from "./NewsFeed";
import CreateFeedModal from "./CreateFeedModal";
import Button from "./Button";
import styled from "styled-components";
import { useSession } from "next-auth/react";

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
  background-color: ${(props) => props.theme.cardBackground};
  border: 1px solid ${(props) => props.theme.border};
  border-radius: 8px;
  text-align: center;
  width: fit-content;
  max-width: 400px;
  text-align: left;
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;

  @media (max-width: 440px) {
    width: 100%;
    font-size: 15px;
    margin: auto;
    border: none;
    background-color: ${(props) => props.theme.darkBlue};
    border-radius: 0px;
    color: ${(props) => props.theme.text};
  }
`;

const UpgradePromptText = styled.div`
  padding: 0 30px 10px 0;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 8px;
  right: 12px;
  background: none;
  border: none;
  font-size: 1.5rem;
  font-weight: bold;
  color: ${(props) => props.theme.darkBlue};
  cursor: pointer;
  padding: 0;
  line-height: 1;

  &:hover {
    filter: brightness(0.95);
  }
`;

export default function FeedManager({ sessionData }) {
  const [feeds, setFeeds] = useState([]);
  const [selectedFeedId, setSelectedFeedId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedToEdit, setFeedToEdit] = useState(null);

  const { data: session, status, update } = useSession({ data: sessionData });
  const isSubscribed = session?.user?.tier !== "Free";

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
      {isSubscribed && (
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
      )}

      <CreateFeedModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={onActionSuccess}
        feedToEdit={feedToEdit}
      />

      <News feedId={isSubscribed ? selectedFeedId : null} />
    </>
  );
}
