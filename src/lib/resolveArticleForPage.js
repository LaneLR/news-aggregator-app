import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getArticleReaderData } from "@/lib/articleReaderData";

// Shared by the standalone /article/[id] page and its intercepted modal
// counterpart (@modal/(.)article/[id]) so both render from the exact same
// auth/gating rules — a Free viewer hitting the modal route directly (or a
// stale cached link) can't end up seeing a premium article the real page
// would have redirected away from.
export async function resolveArticleForPage(id) {
  const session = await auth();
  const data = await getArticleReaderData(id, session);
  if (!data) notFound();
  if (data.gated) redirect("/pricing");
  return data;
}
