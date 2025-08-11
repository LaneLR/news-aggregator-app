"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styled from "styled-components";
import { useSession, signIn } from "next-auth/react";
import Button from "@/components/Button";
import LoadingDots from "./Loading";
import Loading from "@/app/loading";

const Wrapper = styled.div`
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  overflow-y: hidden;
  flex-flow: column nowrap;
  background-color: var(--light-white);
`;

const FormWrapper = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
  background-color: inherit;
`;

const LoginFormInput = styled.input`
  width: 300px;
  padding: 10px;
  margin: 10px 0;
  border: 1px solid #ccc;
  border-radius: 4px;

  &:last-of-type {
    margin-bottom: 25px;
  }
`;

const Header = styled.div`
  font-size: 2rem;
  font-weight: 600;
  color: var(--dark-blue);
  padding: 10px 0;
  text-align: center;
  width: 100%;

  @media (max-width: 440px) {
    font-size: 1.8rem;
    font-weight: 700;
  }
`;

export default function LoginPage() {
  const [user, setUser] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  async function handleLoginUser(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email: user.email,
      password: user.password,
      redirect: false,
      callbackUrl: "/",
    });

    setLoading(false);

    if (res.error) {
      setError(`${res.error}`);
    } else {
      setTimeout(() => {
        router.push("/");
        location.reload();
      }, 100);
    }
  }

  if (status === "loading") {
    return <Loading />;
  }

  return (
    <Wrapper>
      <Header>Login</Header>
      <FormWrapper onSubmit={handleLoginUser}>
        <LoginFormInput
          name="email"
          type="email"
          placeholder="Email"
          required
          value={user.email}
          onChange={handleChange}
        />
        <LoginFormInput
          name="password"
          type="password"
          placeholder="Password"
          required
          value={user.password}
          onChange={handleChange}
        />

        <Button
          bgColor={"var(--primary-blue)"}
          clr={"var(--light-white)"}
          type="submit"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Log in"}
        </Button>

        {error && (
          <>
            <br />
            <p style={{ color: "red" }}>{error}</p>
          </>
        )}

        <h4
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <br />
          <div style={{ color: "var(--dark-blue)", textAlign: "center" }}>
            <p>Don&apos;t have an account?</p>
            <Link href="/register">
              <u>Create one!</u>
            </Link>
          </div>
        </h4>
      </FormWrapper>
    </Wrapper>
  );
}
