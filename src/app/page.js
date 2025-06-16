//keep as server component
import Header from "@/components/Header";
import Link from "next/link";


export default function Home() {
  return (
    <>
    {/* <Header /> */}
      <Link href="/login">
        <button>Go to Login Page</button>
      </Link>
    </>
  );
}
