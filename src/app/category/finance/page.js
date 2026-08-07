import CategoryPageComponent from "@/components/CategoryPage";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function FinanceNewsPage() {
  const session = await auth();
  const isNotSubscribed = session?.user?.tier === "Free" || !session;
  if (isNotSubscribed) {
    return redirect("/pricing");
  }

  return (
    <>
      <CategoryPageComponent category={"Finance"} />
    </>
  );
}
