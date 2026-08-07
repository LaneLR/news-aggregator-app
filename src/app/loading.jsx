import LoadingDots from "@/components/Loading";

import React from "react";

export default function Loading() {
  return (
    <>
      <LoadingDots
        size={14}
        color="var(--theme-primary)"
        duration={1.0}
        gap={10}
        stagger={0.14}
      />
    </>
  );
};
