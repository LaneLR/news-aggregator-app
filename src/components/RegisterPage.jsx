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
  background-color: var(--light-white);
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
        <Header>Create an account!</Header>

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

        <Button
          bgColor={"var(--primary-blue)"}
          clr={"var(--light-white)"}
          type="submit"
        >
          Create Account
        </Button>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <h4
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <br />
          <div style={{ color: "var(--dark-blue)", textAlign: "center" }}>
            <p>Already have an account?</p>
            <Link href="/login">
              <u>Login!</u>
            </Link>
          </div>
        </h4>
      </FormWrapper>
    </Wrapper>
  );
}
