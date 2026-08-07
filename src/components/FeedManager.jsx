"use client";
import { useState, useEffect } from "react";
import { Rss, Plus, SquarePen } from "lucide-react";
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
      <div className={styles.pageHeader}>
        <h1 className={`${styles.pageTitle} headline`}>
          <Rss size={28} strokeWidth={2} />
          My Feeds
        </h1>
        <p className={styles.pageSubtitle}>
          Build a feed from specific sources or categories — pick a feed
          below or create a new one.
        </p>
      </div>

      {isSubscribed && (
        <div className={styles.toolbar}>
          <select
            className={styles.feedSelect}
            value={selectedFeedId || ""}
            onChange={(e) => setSelectedFeedId(e.target.value || null)}
          >
            <option value="">All News</option>
            {feeds.map((feed) => (
              <option key={feed.id} value={feed.id}>
                {feed.title}
              </option>
            ))}
          </select>
          <div className={styles.toolbarActions}>
            {selectedFeedId && (
              <Button
                bgColor={"var(--theme-layout-background)"}
                clr={"var(--theme-text)"}
                onClick={handleOpenEditModal}
              >
                <span className={styles.buttonContent}>
                  <SquarePen size={15} strokeWidth={2} />
                  Edit Feed
                </span>
              </Button>
            )}
            <Button
              bgColor={"var(--theme-primary)"}
              clr={"var(--theme-primary-contrast)"}
              onClick={() => setIsModalOpen(true)}
            >
              <span className={styles.buttonContent}>
                <Plus size={15} strokeWidth={2} />
                Create Feed
              </span>
            </Button>
          </div>
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
