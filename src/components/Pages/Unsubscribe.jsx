"use client";

import { useRouter } from "next/navigation";

export default function UnsubscribeComponent({ children }) {
    const router = useRouter();
  const handleUnsubscribe = async () => {
    try {
      const res = await fetch("/api/fake-upgrade", {
        method: "PUT",
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        router.push("/account");
        window.location.reload();
      } else {
        console.error("Failed to unsubscribe:", data.message);
      }
    } catch (err) {
      console.error("Unsubscribe error:", err);
    }
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "auto",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer",
        }}
      >
        <u onClick={() => handleUnsubscribe()}>Click here to unsubscribe!</u>
      </div>
    </>
  );
}
