import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        textAlign: "center",
        gap: "0.5rem",
        padding: "1rem",
      }}
    >
      <p>
        See our{" "}
        <Link href="/privacy">
          <u>Privacy Policy</u>
        </Link>{" "}
        for details on what data we collect and how it&apos;s used.
      </p>
      <p>
        You can request deletion of your account and all associated data
        from the{" "}
        <Link href="/account">
          <u>Manage Account</u>
        </Link>{" "}
        page at any time.
      </p>
    </div>
  );
}
