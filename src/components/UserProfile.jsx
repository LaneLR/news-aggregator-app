"use client";
import Divider from "./Divider";

export default function ProfilePage({ session }) {
  const handleCancelDeletion = async () => {
    try {
      const res = await fetch("/api/users/cancel-deletion", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to cancel account deletion");

      alert("Account deletion has been canceled.");
      location.reload();
    } catch (err) {
      console.error("Cancellation error:", err);
      alert("Something went wrong while canceling account deletion.");
    }
  };

  const handleRequestDeletion = async () => {
    try {
      const res = await fetch("/api/users/request-deletion", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to request account deletion");

      alert(
        "Account deletion requested. Your account will be deleted in 24 hours unless you cancel."
      );
    } catch (err) {
      console.error("Deletion request error:", err);
      alert("Something went wrong while requesting account deletion.");
    }
  };

  return (
    <>
      {session.user.pendingDeletion !== null ? (
        <div>
          <p>Your account is scheduled to be deleted in 24 hours.</p>
          <button onClick={handleCancelDeletion}>Cancel</button>
        </div>
      ) : ""}
      <div
        style={{
          color: "var(--dark-blue)",
          display: "flex",
          justifyContent: "center",
          width: "100%",
          height: "auto",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        <h1>Profile</h1>
        <p>Your email: {session.user.email}</p>
        <Divider />
        <p>Subscription stuff</p>
      </div>
      <button onClick={handleRequestDeletion}>Request Account Deletion</button>
    </>
  );
}
