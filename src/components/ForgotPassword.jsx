"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "./Button"; // Adjust path to your Button component
import styled from "styled-components";

// --- Reuse the same styled-components from your other page ---
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

const FormInput = styled.input`
  width: 300px;
  padding: 10px;
  margin: 10px 0;
  border: 1px solid ${(props) => props.theme.textSecondary};
  border-radius: 4px;
  margin-bottom: 25px;
`;

const Header = styled.div`
  font-size: 2rem;
  font-weight: 600;
  color: ${(props) => props.theme.text};
  padding: 10px 0;
  text-align: center;
  width: 100%;
`;
// --- End of reused styles ---

export default function ForgotPasswordComponent() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      // Show the confirmation message from the API
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // If a message is set (on success), hide the form and show the message.
  if (message) {
    return (
      <Wrapper>
        <Header>Check Your Email</Header>
        <p style={{ textAlign: "center", maxWidth: "350px" }}>{message}</p>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Header>Forgot Your Password?</Header>
      <p style={{ color: "var(--slate)" }}>
        Enter the email address of the account
      </p>

      <FormWrapper onSubmit={handleSubmit}>
        <InputWrapper>
          <FormInput
            type="email"
            id="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </InputWrapper>
        <Button
          bgColor={"var(--primary-blue)"}
          clr={"var(--white)"}
          type="submit"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>
        {error && <p style={{ color: "red", marginTop: "20px" }}>{error}</p>}
      </FormWrapper>
    </Wrapper>
  );
}
