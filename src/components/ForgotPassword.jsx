"use client";

import { useState } from "react";
import Button from "./Button"; 
import styled, { useTheme } from "styled-components";

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
  border: 1px solid ${(props) => props.theme.border};
  border-radius: 4px;
  margin-bottom: 25px;
`;

const Header = styled.div`
  font-size: 2rem;
  font-weight: 600;
  color: ${(props) => props.theme.darkBlue};
  padding: 10px 0;
  text-align: center;
  width: 100%;
`;

export default function ForgotPasswordComponent() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

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

      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
      <p style={{ color: theme.slate, }}>
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
          bgColor={theme.primary}
          clr={theme.text}
          type="submit"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>
        {error && <p style={{ color: theme.warning, marginTop: "20px" }}>{error}</p>}
      </FormWrapper>
    </Wrapper>
  );
}
