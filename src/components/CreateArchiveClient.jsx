"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateArchiveClient() {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const theme = useTheme();

  const handleCreate = async () => {
    if (!name.trim()) return;

    const res = await fetch("/api/archives", {
      method: "POST",
      body: JSON.stringify({ name }),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      setName("");
      setError("");
      router.refresh(); // re-fetch server component
    } else {
      const data = await res.json();
      setError(data.error || "Failed to create archive.");
    }
  };

  return (
    <div style={{ marginBottom: "1rem" }}>
      <input
        placeholder="New archive name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ padding: "4px 8px", marginRight: "6px" }}
      />
      <button onClick={handleCreate}>Create</button>
      {error && <p style={{ color: theme.warning, marginTop: "4px" }}>{error}</p>}
    </div>
  );
}
