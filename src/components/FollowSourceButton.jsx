"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useFollowedSources } from "./FollowedSourcesProvider";
import { useToast } from "./ToastProvider";
import styles from "./FollowSourceButton.module.scss";

export default function FollowSourceButton({ sourceName }) {
  const { data: session } = useSession();
  const router = useRouter();
  const toast = useToast();
  const { isFollowing, toggleFollow } = useFollowedSources();

  if (!sourceName || sourceName === "Unknown source" || sourceName === "Unknown") return null;

  const following = isFollowing(sourceName);

  const handleClick = () => {
    if (!session) {
      toast.info("Sign in to follow sources.");
      router.push("/login");
      return;
    }
    toggleFollow(sourceName);
  };

  return (
    <button
      type="button"
      className={`${styles.followButton} ${following ? styles.following : ""}`}
      onClick={handleClick}
      title={following ? `Unfollow ${sourceName}` : `Follow ${sourceName}`}
      aria-label={following ? `Unfollow ${sourceName}` : `Follow ${sourceName}`}
      aria-pressed={following}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
