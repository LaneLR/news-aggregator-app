import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeArticle, makeFetchResponse } from "@/test/fixtures";

const mockAuth = { data: null, status: "unauthenticated" };
vi.mock("next-auth/react", () => ({
  useSession: () => mockAuth,
}));

vi.mock("./NewsCardFour", () => ({
  default: ({ article }) => <div>Card:{article.title}</div>,
}));

const { default: FollowingPage } = await import("./FollowingPage");

describe("FollowingPage", () => {
  beforeEach(() => {
    mockAuth.data = null;
    mockAuth.status = "unauthenticated";
  });

  it("prompts sign-in when unauthenticated", () => {
    render(<FollowingPage />);
    expect(screen.getByText("Please sign in to see articles you follow.")).toBeInTheDocument();
  });

  it("shows loading skeletons while authenticating", () => {
    mockAuth.status = "loading";
    mockAuth.data = null;
    const { container } = render(<FollowingPage />);
    expect(container.querySelectorAll('[class*="wrapper"]').length).toBeGreaterThan(0);
    expect(screen.queryByText("Please sign in to see articles you follow.")).not.toBeInTheDocument();
  });

  it("shows an empty state prompting the user to follow sources or topics when they have none", async () => {
    mockAuth.status = "authenticated";
    mockAuth.data = { user: { id: "user-1" } };
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ articles: [], hasFollows: false }));

    render(<FollowingPage />);
    expect(
      await screen.findByText("You're not following any sources or topics yet.")
    ).toBeInTheDocument();
  });

  it("shows a different empty state when following topics but nothing matches yet", async () => {
    mockAuth.status = "authenticated";
    mockAuth.data = { user: { id: "user-1" } };
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ articles: [], hasFollows: true }));

    render(<FollowingPage />);
    expect(await screen.findByText("No recent articles match what you're following.")).toBeInTheDocument();
  });

  it("renders matched articles", async () => {
    mockAuth.status = "authenticated";
    mockAuth.data = { user: { id: "user-1" } };
    const article = makeArticle({ title: "Followed Story" });
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ articles: [article], hasFollows: true }));

    render(<FollowingPage />);
    expect(await screen.findByText("Card:Followed Story")).toBeInTheDocument();
  });
});
