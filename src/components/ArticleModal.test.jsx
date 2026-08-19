import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { makeArticle } from "@/test/fixtures";

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null }),
}));

const backMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: backMock }),
}));

const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), show: vi.fn(), dismiss: vi.fn() };
vi.mock("./ToastProvider", () => ({ useToast: () => toast }));

vi.mock("./ArchiveToggleButton", () => ({ default: () => <div>ArchiveToggle</div> }));
vi.mock("./ShareButton", () => ({ default: () => <div>Share</div> }));
vi.mock("./ReaderCustomizationPanel", () => ({ default: () => <div>ReaderCustomization</div> }));
vi.mock("./TextToSpeechButton", () => ({ default: () => <div>TextToSpeech</div> }));

const { default: ArticleModal } = await import("./ArticleModal");

describe("ArticleModal", () => {
  const article = makeArticle({ id: "article-1", title: "Big Story", sourceName: "BBC" });

  beforeEach(() => {
    backMock.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the article inside the modal shell", () => {
    render(
      <ArticleModal article={article} sanitizedContent="<p>Body</p>" relatedCoverage={[]} readingTime={2} />
    );
    expect(screen.getByRole("heading", { name: "Big Story" })).toBeInTheDocument();
  });

  it("shows a Close button (ArticleReader's onClose affordance), not the standalone-page Back button", () => {
    render(
      <ArticleModal article={article} sanitizedContent="<p>Body</p>" relatedCoverage={[]} readingTime={2} />
    );
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
  });

  it("plays the exit animation before popping browser history, not instantly", () => {
    const { container } = render(
      <ArticleModal article={article} sanitizedContent="<p>Body</p>" relatedCoverage={[]} readingTime={2} />
    );

    act(() => fireEvent.click(screen.getByRole("button", { name: "Close" })));

    // Closing class applied immediately (the animation starts)...
    expect(container.firstChild.className).toMatch(/closing/);
    // ...but router.back() hasn't fired yet — it waits for the animation.
    expect(backMock).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(250));
    expect(backMock).toHaveBeenCalledTimes(1);
  });
});
