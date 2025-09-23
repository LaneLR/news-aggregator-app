"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Button from "./Button";
import styled from "styled-components";

const Wrapper = styled.div`
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  overflow-y: hidden;
  flex-flow: column nowrap;
  background-color: ${(props) => props.theme.background};
  padding: 0 0 10px 0;
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

const InputWrapper = styled.div`
  height: fit-content;
  padding: 10px;
  display: flex;
  flex-direction: column;
`;

const ResetPasswordFormInput = styled.input`
  width: 300px;
  padding: 10px;
  margin: 10px 0;
  border: 1px solid ${(props) => props.theme.border};
  border-radius: 4px;

  &:last-of-type {
    margin-bottom: 25px;
  }
`;

const Header = styled.div`
  font-size: 2rem;
  font-weight: 600;
  color: ${(props) => props.theme.primary};
  padding: 10px 0;
  text-align: center;
  width: 100%;

  @media (max-width: 440px) {
    font-size: 1.8rem;
    font-weight: 700;
  }
`;

export default function ResetPasswordComponent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Missing token. Please request a new reset link.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setSuccess(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Wrapper>
        <Header>Your password has been reset</Header>
        <div style={{ textAlign: "center" }}>
          <p>You can now log in with your new password.</p>
          <br />
          <Link href="/login">
            <Button bgColor={"var(--primary-blue)"} clr={"var(--white)"}>
              Go to Log in
            </Button>
          </Link>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Header>Reset Your Password</Header>
      <FormWrapper onSubmit={handleSubmit}>
        <InputWrapper>
          <ResetPasswordFormInput
            type="password"
            id="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <ResetPasswordFormInput
            type="password"
            id="confirmPassword"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </InputWrapper>
        <Button
          bgColor={"var(--primary-blue)"}
          clr={"var(--white)"}
          type="submit"
          disabled={loading}
        >
          Reset password
        </Button>
        {error && (
          <>
            <br />
            <p style={{ color: "red" }}>{error}</p>
          </>
        )}
      </FormWrapper>
    </Wrapper>
  );
}
