"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { loginUser } from "@/app/slices/manageLoggedIn";
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
  const [user, setUser] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState(null);
  const dispatch = useDispatch();
  const router = useRouter();

  const handleChange = (e) => {
    setUser({
      ...user,
      [e.target.name]: e.target.value,
    });
  };

  async function handleLoginUser(e) {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      dispatch(loginUser({ user: data.user, status: "active" }));
      setUser({ email: "", password: "" });

      router.push("/");
    } catch (err) {
      setError("Something went wrong");
      console.error(err);
    }
  }

  return (
    <>
      <Wrapper>
        <h1>Login!</h1>
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

          <Button bgColor="#9E6532" type="submit">
            Login
          </Button>
          <br />
          {error && <p style={{ color: "red" }}>{error}</p>}

          <h4
            style={{
              display: "flex",
              flexFlow: "column nowrap",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <p>Don&apos;t have an account?</p>{" "}
            <Link href="/register">
              <u>Create one!</u>
            </Link>
          </h4>
        </FormWrapper>
      </Wrapper>
    </>
  );
}
