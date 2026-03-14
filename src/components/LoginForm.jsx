"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styled, { useTheme } from "styled-components";
import { useSession, signIn } from "next-auth/react";
import Button from "@/components/Button";
import Loading from "@/app/loading";
import GoogleSignInButton from "./GoogleSignInButton";

const PageWrapper = styled.div`
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: left;
  width: 100vw;
  overflow-y: hidden;
  flex-flow: column nowrap;
  background-color: ${(props) => props.theme.background};
  padding: 0 0 10px 0;

  @media (min-width: 955px) {
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    align-items: center;
  }
`;

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: auto;
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

const LoginFormInput = styled.input`
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
  color: ${(props) => props.theme.darkBlue};
  padding: 10px 0;
  text-align: center;
  width: 100%;

  @media (max-width: 440px) {
    font-size: 1.8rem;
    font-weight: 700;
  }
`;

const SignInButtonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  row-gap: 8px;
  padding: 20px;
  // background-color: ${(props) => props.theme.cardBackground};
  border-radius: 8px;
  height: auto;
  margin-bottom: 220px;

  @media (max-width: 955px) {
    margin-bottom: 0;
    margin: 20px;
  }
`;

const SSOText = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${(props) => props.theme.darkBlue};
  text-align: center;
  margin-bottom: 20px;
  width: 100%;

  @media (max-width: 440px) {
    font-size: 1.8rem;
    font-weight: 700;
  }
`;

export default function LoginPage({ sessionData }) {
  const [user, setUser] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const router = useRouter();
  const { data: session, status, update } = useSession({ data: sessionData });

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
    <PageWrapper>
      <SignInButtonWrapper>
        {/* <SSOText>Sign in with</SSOText> */}
        <GoogleSignInButton
          onClick={() => signIn("google", { callbackUrl: "/" })}
        />
      </SignInButtonWrapper>
      <Wrapper>
        <Header>Login</Header>
        <FormWrapper onSubmit={handleLoginUser}>
          <InputWrapper>
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
          </InputWrapper>
          <Button
            bgColor={theme.primary}
            clr={theme.primaryContrast}
            type="submit"
            disabled={loading}
          >
            Log in
          </Button>

          {error && (
            <>
              <br />
              <p style={{ color: theme.error }}>{error}</p>
            </>
          )}

          <h5
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: "20px",
            }}
          >
            <br />
            <div
              style={{
                color: theme.text,
                textAlign: "center",
                display: "flex",
                gap: "5px",
              }}
            >
              <p>Don&apos;t have an account?</p>
              <Link href="/register">
                <u>Create one!</u>
              </Link>
            </div>
          </h5>
          <h5
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: "20px",
            }}
          >
            <br />
            <div
              style={{
                color: theme.text,
                textAlign: "center",
                display: "flex",
                gap: "5px",
              }}
            >
              <p>Forgot your password?</p>
              <Link href="/forgot-password">
                <u>Reset password</u>
              </Link>
            </div>
          </h5>
        </FormWrapper>
        <br />
        <br />
      </Wrapper>
    </PageWrapper>
  );
}
