"use client";
import { useState, useEffect, useRef } from "react";
import { Rss, Plus, SquarePen, Download, Upload } from "lucide-react";
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
  const [importStatus, setImportStatus] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setImporting(true);
    setImportStatus(null);
    try {
      const opmlText = await file.text();
      const res = await fetch("/api/feeds/import/opml", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opmlText, title: file.name.replace(/\.opml$/i, "") }),
      });
      const data = await res.json();

      if (!res.ok) {
        setImportStatus({ type: "error", text: data.error || "Import failed." });
        return;
      }

      setImportStatus({
        type: "success",
        text: `Imported "${data.feed.title}" — matched ${data.matchedCount} source${
          data.matchedCount === 1 ? "" : "s"
        }${data.skippedCount > 0 ? `, skipped ${data.skippedCount} we don't carry` : ""}.`,
      });
      fetchFeeds();
    } catch (err) {
      console.error("OPML import failed:", err);
      setImportStatus({ type: "error", text: "Something went wrong reading that file." });
    } finally {
      setImporting(false);
    }
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
            <Button
              bgColor={"var(--theme-layout-background)"}
              clr={"var(--theme-text)"}
              onClick={handleImportClick}
              disabled={importing}
            >
              <span className={styles.buttonContent}>
                <Upload size={15} strokeWidth={2} />
                {importing ? "Importing…" : "Import OPML"}
              </span>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".opml,.xml,text/x-opml,text/xml"
              hidden
              onChange={handleImportFile}
            />
            {/* File-download API route, not a page — next/link's client-side
                routing doesn't apply here, so a plain <a> is correct. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/api/feeds/opml" className={styles.exportLink}>
              <Download size={15} strokeWidth={2} />
              Export OPML
            </a>
          </div>
        </div>
      )}

      {importStatus && (
        <p
          className={`${styles.importStatus} ${
            importStatus.type === "error" ? styles.importError : ""
          }`}
        >
          {importStatus.text}
        </p>
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
