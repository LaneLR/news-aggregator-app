import LoadingComponent from "@/components/Global/Loading";
import LoginPage from "@/components/Pages/LoginForm";
import { Suspense } from "react";

export default function Login() {
  return (
    <>
      <Suspense fallback={<LoadingComponent />}>
        <LoginPage />
      </Suspense>
    </>
  );
}
