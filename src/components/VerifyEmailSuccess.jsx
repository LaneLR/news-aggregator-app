"use client";
import Loading from "@/app/loading";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styled from "styled-components";

const TextWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30px 20px;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  width: 100vw;
`;

const Text = styled.p`
  color: var(--dark-blue);
  font-weight: 600;
  font-size: 1.1rem;
  text-align: left;
  width: 100%;
`;

export default function VerifyEmailSuccessComponent() {
  const router = useRouter();
  const { data: session, status, update } = useSession();

  if (status === "loading") {
    return <Loading />;
  }

  if (session && session.user.emailIsVerified) {
    router.push("/news");
  }

  return (
    <>
      <TextWrapper>
        <Image
          style={{ margin: "20px 0 40px 0" }}
          src={"/images/send-email.png"}
          width={277}
          height={112}
          alt={"Image of an email being sent"}
        />
        <Text>A verification email has been sent to your email.</Text>
        <Text>
          Check your spam folder if you don&apos;t see the email in your inbox.
        </Text>
      </TextWrapper>
    </>
  );
}
