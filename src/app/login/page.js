"use client";
import Link from "next/link";
import { useState } from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  height: 100vh;
  width: 100vw;
  background-color: rgb(138, 138, 138);
`;

const FormWrapper = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background-color: inherit;
`;

const LoginFormInput = styled.input`
  width: 300px;
  padding: 10px;
  margin: 10px 0;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

export default function LoginPage() {
  const [error, setError] = useState(null);

  async function handleLoginUser(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      console.log("Login successful:", data);
      // You can redirect or update auth state here
    } catch (err) {
      setError("Something went wrong");
      console.error(err);
    }
  }

  return (
    <>
      <Link href="/">
        <button>home page</button>
      </Link>
      <Wrapper>
        <FormWrapper onSubmit={handleLoginUser}>
          <h1>Login!</h1>

          <LoginFormInput name="email" type="email" placeholder="Email" required />
          <LoginFormInput name="password" type="password" placeholder="Password" required />

          <button type="submit">Login</button>

          {error && <p style={{ color: "red" }}>{error}</p>}

          <br />
          <h4>
            Don't have an account?{" "}
            <Link href="/register">
              <u>Create one!</u>
            </Link>
          </h4>
        </FormWrapper>
      </Wrapper>
    </>
  );
}
