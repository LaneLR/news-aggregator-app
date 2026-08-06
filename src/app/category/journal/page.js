import CategoryPageComponent from "@/components/CategoryPage";
import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function JournalNewsPage() {
  const session = await getServerSession(authOptions);
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
