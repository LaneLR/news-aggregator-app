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
  align-items: flex-start;
  justify-content: space-evenly;
  width: 100vw;
  background-color: var(--light-white);
  box-sizing: border-box;
  padding: 80px 0 40px 0;
`;

const FormWrapper = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background-color: inherit;
`;

const InputWrapper = styled.div`
  height: fit-content;
  padding: 10px;
  display: flex;
  flex-direction: column;
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

const CheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px; /* Space between checkbox and text */
  margin: 0 0 25px 0;
  max-width: 320px;
  text-align: left;
  font-size: 0.85rem;
  color: var(--slate);

  /* Style for the links within the checkbox label */
  a {
    color: var(--primary-blue);
    text-decoration: underline;
  }
`;

const StyledInput = styled.input`
  accent-color: var(--primary-blue);
`

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

      router.push("/verification/verify-email"); // or home
    } catch (err) {
      setError("Something went wrong");
      console.error(err);
    }
  }

  return (
    <Wrapper>
      <FormWrapper onSubmit={handleCreateUser}>
        <Header>Create an account!</Header>
        <InputWrapper>
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
        </InputWrapper>

        <CheckboxWrapper>
          <StyledInput type="checkbox" id="tos" name="tos" required />
          <label htmlFor="tos">
            I agree to the{" "}
            <Link
              href="/terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </Link>
            .
          </label>
        </CheckboxWrapper>
        <Button
          bgColor={"var(--primary-blue)"}
          clr={"var(--white)"}
          type="submit"
        >
          Create Account
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
          <div
            style={{
              display: "flex",
              gap: "5px",
              color: "var(--dark-blue)",
              textAlign: "center",
            }}
          >
            <p>Already have an account?</p>
            <Link href="/login">
              <u>Log in!</u>
            </Link>
          </div>
        </h4>
      </FormWrapper>
    </Wrapper>
  );
}
