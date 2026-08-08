"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Volume2, Pause, Square, Lock } from "lucide-react";
import styles from "./TextToSpeechButton.module.scss";

// Browser-native (Web Speech API) read-aloud — no server cost, so gating
// this is purely a product decision, not a cost one. Historically a Pocket
// Premium ("Listen") style perk rather than a strict accessibility need
// (screen readers already cover that at the OS level), so it's the
// subscriber-only counterpart to the free-tier ReaderCustomizationPanel.
export default function TextToSpeechButton({ text, isSubscribed }) {
  const router = useRouter();
  const [status, setStatus] = useState("idle"); // idle | playing | paused
  const [supported, setSupported] = useState(true);
  const utteranceRef = useRef(null);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!supported || !text) return null;

  if (!isSubscribed) {
    return (
      <button
        type="button"
        className={styles.button}
        onClick={() => router.push("/pricing")}
        title="Listen to this article — Subscribed feature"
      >
        <Lock size={15} strokeWidth={2} />
        Listen
      </button>
    );
  }

  const handlePlay = () => {
    if (status === "paused") {
      window.speechSynthesis.resume();
      setStatus("playing");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setStatus("idle");
    utterance.onerror = () => setStatus("idle");
    utteranceRef.current = utterance;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setStatus("playing");
  };

  const handlePause = () => {
    window.speechSynthesis.pause();
    setStatus("paused");
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setStatus("idle");
  };

  return (
    <div className={styles.group}>
      {status === "playing" ? (
        <button type="button" className={styles.button} onClick={handlePause} title="Pause">
          <Pause size={16} strokeWidth={2} />
          Pause
        </button>
      ) : (
        <button type="button" className={styles.button} onClick={handlePlay} title="Listen to this article">
          <Volume2 size={16} strokeWidth={2} />
          {status === "paused" ? "Resume" : "Listen"}
        </button>
      )}
      {status !== "idle" && (
        <button type="button" className={styles.stopButton} onClick={handleStop} title="Stop">
          <Square size={13} strokeWidth={2} fill="currentColor" />
        </button>
      )}
    </div>
  );
}
