import CategoryPageComponent from "@/components/CategoryPage";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

// Subscriber-only — redirects anonymous/Free visitors to /pricing, so a
// crawler never sees real content here (also disallowed in robots.js).
export const metadata = {
  title: "Journals",
  robots: { index: false, follow: false },
};

export default async function JournalNewsPage() {
  const session = await auth();
  const isNotSubscribed = session?.user?.tier === "Free" || !session;
  if (isNotSubscribed) {
    return redirect("/pricing");
  }
  return (
    <>
      <CategoryPageComponent category={"Journal"} />
    </>
  );
}
