import RegisterPage from "@/components/RegisterPage";
import { Suspense } from "react";
import Loading from "../../loading";

export const metadata = {
  title: "Sign Up",
  description: "Create a free MochaReads account to start building your personalized news feed.",
};

// The auth()-redirect-if-logged-in check lives in the shared (auth)/layout.jsx
// now, not here — see that file's comment for why.
export default function Register() {
  return (
    <Suspense fallback={<Loading />}>
      <RegisterPage />
    </Suspense>
  );
}
