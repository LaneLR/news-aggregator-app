"use client";
import Button from "@/components/Button";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { signIn } from "next-auth/react";

const Wrapper = styled.div`
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  width: 100vw;
  background-color: inherit;
  box-sizing: border-box;
`;

const FormWrapper = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background-color: inherit;
`;

const RegisterFormInput = styled.input`
  width: 300px;
  padding: 10px;
  margin: 10px 0;
  border: 1px solid #ccc;
  border-radius: 4px;

  &:last-of-type {
    margin-bottom: 25px;
  }
`;

export default function RegisterPage() {
  const [error, setError] = useState(null);
  const router = useRouter();

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

      const loginRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (loginRes?.error) {
        setError("Account created but login failed");
      } else {
        router.push("/account"); // or home
      }
    } catch (err) {
      setError("Something went wrong");
      console.error(err);
    }
  }

  return (
    <Wrapper>
      <FormWrapper onSubmit={handleCreateUser}>
        <h1>Create an account!</h1>

        <RegisterFormInput
          name="email"
          type="email"
          placeholder="Email"
          required
        />
        <RegisterFormInput
          name="password"
          type="password"
          placeholder="Password"
          required
        />
        <RegisterFormInput
          name="confirmPassword"
          type="password"
          placeholder="Confirm Password"
          required
        />

        <Button bgColor="#9E6532" type="submit">
          Create Account
        </Button>

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
  );
}
