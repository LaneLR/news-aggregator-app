import LoadingComponent from "@/components/Loading";
import RegisterPage from "@/components/RegisterPage";
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
