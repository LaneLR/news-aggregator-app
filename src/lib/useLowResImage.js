"use client";
import { useCallback, useState } from "react";

// Some sources' RSS feeds only ever offer a tiny image (CBS News's <image>
// tag, for one, is always exactly 60x60 — see extractImage() in
// rss-fetch-app). Every card in this app renders images well above that —
// the smallest is ~200px, the widest carousel card is 320px — so a source
// image below THRESHOLD is guaranteed to be scaled up several times over,
// which looks like blown-up, blocky pixelation rather than a soft photo.
//
// Detected at render time from the image's own decoded pixel size (not
// stored per-source), so this catches any undersized image regardless of
// which feed it came from, without needing per-source metadata that most
// feeds don't provide in the first place.
const THRESHOLD = 150;

export function useLowResImage(threshold = THRESHOLD) {
  const [isLowRes, setIsLowRes] = useState(false);

  const handleImageLoad = useCallback(
    (event) => {
      const img = event.target;
      if (img.naturalWidth > 0 && img.naturalWidth < threshold) {
        setIsLowRes(true);
      } else if (img.naturalHeight > 0 && img.naturalHeight < threshold) {
        setIsLowRes(true);
      }
    },
    [threshold]
  );

  return { isLowRes, handleImageLoad };
}
