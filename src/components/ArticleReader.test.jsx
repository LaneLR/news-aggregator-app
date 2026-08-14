import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeArticle, makeFetchResponse } from "@/test/fixtures";

const mockSession = { value: null };
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession.value, status: mockSession.value ? "authenticated" : "unauthenticated" }),
}));

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
}));

const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), show: vi.fn(), dismiss: vi.fn() };
vi.mock("./ToastProvider", () => ({ useToast: () => toast }));

// These four each have their own dedicated coverage elsewhere (or are out
// of scope for this batch) — stub them so ArticleReader's own logic (header
// actions, like button, progress bar, related coverage) is what's exercised.
vi.mock("./ArchiveToggleButton", () => ({ default: () => <div>ArchiveToggle</div> }));
vi.mock("./ShareButton", () => ({ default: () => <div>Share</div> }));
vi.mock("./ReaderCustomizationPanel", () => ({ default: () => <div>ReaderCustomization</div> }));
vi.mock("./TextToSpeechButton", () => ({ default: () => <div>TextToSpeech</div> }));

const { default: ArticleReader } = await import("./ArticleReader");

describe("ArticleReader", () => {
  beforeEach(() => {
    mockSession.value = null;
    pushMock.mockClear();
    toast.info.mockClear();
  });

  const article = makeArticle({
    id: "article-1",
    title: "Big Story",
    sourceName: "BBC",
    category: ["Tech"],
    likeCount: 4,
  });

  it("preloads the hero image — it's the reader's own LCP element", () => {
    render(
      <ArticleReader article={article} sanitizedContent="<p>Body text</p>" relatedCoverage={[]} readingTime={3} />
    );
    // A preloaded next/image omits the `loading` attribute entirely rather
    // than setting loading="eager".
    expect(screen.getByAltText("Big Story")).not.toHaveAttribute("loading");
  });

  it("renders title, source, and category badge", () => {
    render(
      <ArticleReader article={article} sanitizedContent="<p>Body text</p>" relatedCoverage={[]} readingTime={3} />
    );
    expect(screen.getByRole("heading", { name: "Big Story" })).toBeInTheDocument();
    expect(screen.getByText("BBC")).toBeInTheDocument();
    expect(screen.getByText("Tech")).toBeInTheDocument();
    expect(screen.getByText("3 min read")).toBeInTheDocument();
  });

  it("renders sanitized content when provided", () => {
    render(
      <ArticleReader article={article} sanitizedContent="<p>Body text</p>" relatedCoverage={[]} readingTime={3} />
    );
    expect(screen.getByText("Body text")).toBeInTheDocument();
  });

  it("shows a fallback message when there is no article content", () => {
    render(<ArticleReader article={article} sanitizedContent="" relatedCoverage={[]} readingTime={null} />);
    expect(screen.getByText(/doesn't include full article text/)).toBeInTheDocument();
  });

  it("renders related coverage links", () => {
    const relatedCoverage = [{ id: "r1", title: "Related piece", sourceName: "CNN" }];
    render(
      <ArticleReader
        article={article}
        sanitizedContent="<p>x</p>"
        relatedCoverage={relatedCoverage}
        readingTime={2}
      />
    );
    expect(screen.getByText("Also covered by other sources")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /Related piece/ });
    expect(link).toHaveAttribute("href", "/article/r1");
  });

  it("shows close and full-screen buttons only when their handlers are provided", () => {
    const onClose = vi.fn();
    const onToggleFullScreen = vi.fn();
    render(
      <ArticleReader
        article={article}
        sanitizedContent="<p>x</p>"
        relatedCoverage={[]}
        readingTime={1}
        onClose={onClose}
        onToggleFullScreen={onToggleFullScreen}
      />
    );
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Full screen" })).toBeInTheDocument();
  });

  it("calls onClose and onToggleFullScreen when clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onToggleFullScreen = vi.fn();
    render(
      <ArticleReader
        article={article}
        sanitizedContent="<p>x</p>"
        relatedCoverage={[]}
        readingTime={1}
        onClose={onClose}
        onToggleFullScreen={onToggleFullScreen}
      />
    );
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Full screen" }));
    expect(onToggleFullScreen).toHaveBeenCalledTimes(1);
  });

  it("redirects to login when liking while signed out", async () => {
    const user = userEvent.setup();
    render(<ArticleReader article={article} sanitizedContent="<p>x</p>" relatedCoverage={[]} readingTime={1} />);
    await user.click(screen.getByRole("button", { name: /4/ }));
    expect(toast.info).toHaveBeenCalledWith("Sign in to like articles.");
    expect(pushMock).toHaveBeenCalledWith("/login");
  });

  it("optimistically likes the article when signed in", async () => {
    const user = userEvent.setup();
    mockSession.value = { user: { id: "user-1" } };
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ success: true }));

    render(<ArticleReader article={article} sanitizedContent="<p>x</p>" relatedCoverage={[]} readingTime={1} />);
    const likeButton = screen.getByRole("button", { name: /4/ });
    await user.click(likeButton);

    await waitFor(() => expect(screen.getByRole("button", { name: /5/ })).toBeInTheDocument());
  });

  it("reverts the like on request failure", async () => {
    const user = userEvent.setup();
    mockSession.value = { user: { id: "user-1" } };
    global.fetch.mockResolvedValueOnce(makeFetchResponse(null, { ok: false, status: 500 }));

    render(<ArticleReader article={article} sanitizedContent="<p>x</p>" relatedCoverage={[]} readingTime={1} />);
    await user.click(screen.getByRole("button", { name: /4/ }));

    await waitFor(() => expect(screen.getByRole("button", { name: /4/ })).toBeInTheDocument());
  });

  it("shows a paywall lock icon for a known paywalled source", () => {
    const paywalled = makeArticle({ sourceName: "Bloomberg" });
    render(<ArticleReader article={paywalled} sanitizedContent="" relatedCoverage={[]} readingTime={1} />);
    expect(screen.getByTitle("This source could be behind a paywall.")).toBeInTheDocument();
  });
});
