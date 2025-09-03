import CategoryPageComponent from "@/components/CategoryPage";
import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function HealthNewsPage() {
  const session = await getServerSession(authOptions);
  const isNotSubscribed = session?.user?.tier === "Free";
  if (isNotSubscribed) {
    return redirect("/account");
  }
  return (
    <>
      <CategoryPageComponent category={"Journal"} />
    </>
  );
}
