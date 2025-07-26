import LoadingComponent from "@/components/Loading";
import LoginPage from "@/components/LoginForm";
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
