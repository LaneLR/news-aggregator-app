"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styled from "styled-components";
import { useSession, signIn } from "next-auth/react";
import Button from "@/components/Button";

const Wrapper = styled.div`
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  background-color: inherit;
  overflow-y: hidden;
  flex-flow: column nowrap;
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
      setError(`Invalid credentials: ${res.error}`);
    } else {
      setTimeout(() => {
        router.push("/");
        location.reload();
      }, 100);
    }
  }

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  return (
    <Wrapper>
      <h1>Login</h1>
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

        <Button bgColor="#9E6532" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </Button>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <h4
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <p>Don&apos;t have an account?</p>
          <Link href="/register">
            <u>Create one!</u>
          </Link>
        </h4>
      </FormWrapper>
    </Wrapper>
  );
}
