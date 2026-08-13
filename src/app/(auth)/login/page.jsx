import LoginPage from "@/components/LoginForm";
import { Suspense } from "react";
import Loading from "../../loading";

export const metadata = {
  title: "Log In",
  description: "Log in to MochaReads to access your personalized news feed.",
};

// The auth()-redirect-if-logged-in check lives in the shared (auth)/layout.jsx
// now, not here — see that file's comment for why.
export default function Login() {
  return (
    <Suspense fallback={<Loading />}>
      <LoginPage />
    </Suspense>
  );
}
