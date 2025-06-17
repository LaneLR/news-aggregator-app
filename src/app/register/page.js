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

export default function RegisterPage() {
  const [error, setError] = useState(null);

  async function handleCreateUser(e) {
    e.preventDefault(); 
    const formData = new FormData(e.target);
    const email = formData.get("email");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create account");
        return;
      }

    } catch (err) {
      setError("Something went wrong");
      console.error(err);
    }
  }

  return (
    <>
      <Link href="/">
        <button>Home Page</button>
      </Link>
      <Wrapper>
        <FormWrapper onSubmit={handleCreateUser}>
          <h1>Create an account!</h1>

          <LoginFormInput
            name="email"
            type="email"
            placeholder="Email"
            required
          />
          <LoginFormInput
            name="password"
            type="password"
            placeholder="Password"
            required
          />
          <LoginFormInput
            name="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            required
          />

          <button type="submit">Register</button>

          {error && <p style={{ color: "red" }}>{error}</p>}

          <br />
          <h4>
            Already have an account?{" "}
            <Link href="/login">
              <u>Login!</u>
            </Link>
          </h4>
        </FormWrapper>
      </Wrapper>
    </>
  );
}
