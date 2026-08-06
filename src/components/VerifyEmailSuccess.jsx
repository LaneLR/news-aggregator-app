"use client";
import Loading from "@/app/loading";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect } from "react";
import styles from "./VerifyEmailSuccess.module.scss";

export default function VerifyEmailSuccessComponent() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (session && session.user.emailIsVerified) {
      window.location.replace("/account");
    }
  }, [session]);

  if (status === "loading") {
    return <Loading />;
  }

  return (
    <>
      <div className={styles.textWrapper}>
        <Image
          style={{ margin: "20px 0 40px 0" }}
          src={"/images/send-email.png"}
          width={277}
          height={112}
          alt={"Image of an email being sent"}
        />
        <p className={styles.text}>Your email has been verified.</p>
        <p className={styles.text}>You will be redirected in a moment... </p>
      </div>
    </>
  );
}
