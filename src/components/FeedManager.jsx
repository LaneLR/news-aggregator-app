"use client";
import { useState, useEffect } from "react";
import News from "./NewsFeed";
import CreateFeedModal from "./CreateFeedModal";
import Button from "./Button";
import { useSession } from "next-auth/react";
import styles from "./FeedManager.module.scss";

export default function FeedManager() {
  const [feeds, setFeeds] = useState([]);
  const [selectedFeedId, setSelectedFeedId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedToEdit, setFeedToEdit] = useState(null);

  const { data: session } = useSession();
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
        <div className={styles.feedSelectorWrapper}>
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
        </div>
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
