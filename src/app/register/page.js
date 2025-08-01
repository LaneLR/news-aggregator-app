import LoadingComponent from "@/components/Global/Loading";
import RegisterPage from "@/components/Pages/RegisterPage";
import { Suspense } from "react";

export default function Register() {
  return (
    <>
      <Suspense fallback={<LoadingComponent />}>
        <RegisterPage />
      </Suspense>
    </>
  );
}
