export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const subsParam = searchParams.get("subs") || "";
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const subs = subsParam.split(",").filter(Boolean);

  if (subs.length === 0) {
    return new Response(
      JSON.stringify({ error: "No subreddits provided" }),
      { status: 400 }
    );
  }

  try {
    const results = await Promise.all(
      subs.map(async (sub) => {
        const url = `https://www.reddit.com/r/${sub}/top.json?limit=${limit}`;
        const res = await fetch(url, {
          headers: {
            "User-Agent": "MyNewsApp/0.1 (https://yourdomain.com)",
          },
        });

        if (!res.ok) {
          console.error(`❌ Failed to fetch /r/${sub}:`, res.status);
          return [];
        }

        const json = await res.json();
        const posts = json.data?.children || [];

        return posts.map((child) => {
          const post = child.data;

          return {
            id: post.id,
            title: post.title,
            url: post.url_overridden_by_dest || post.url,
            sourceName: post.domain || `/r/${sub}`,
            thumbnail:
              post.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, "&") || null,
          };
        });
      })
    );

    const articles = results.flat();

    return new Response(JSON.stringify({ articles }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("🔥 Reddit API error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to fetch from Reddit." }),
      { status: 500 }
    );
  }
}
