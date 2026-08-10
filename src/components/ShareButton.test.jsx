import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShareButton from "./ShareButton";

const article = { id: "article-1", title: "Test Article", sourceName: "Example" };

describe("ShareButton", () => {
  afterEach(() => {
    delete navigator.share;
  });

  it("calls navigator.share with title/text/url when the Web Share API is available", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { value: share, configurable: true });
    const user = userEvent.setup();

    render(<ShareButton article={article} />);
    await user.click(screen.getByRole("button", { name: "Share article" }));

    expect(share).toHaveBeenCalledWith({
      title: "Test Article",
      text: "Check out this article from Example:",
      url: "http://localhost:3000/article/article-1",
    });
  });

  it("logs (without throwing) if navigator.share rejects", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const share = vi.fn().mockRejectedValue(new Error("cancelled"));
    Object.defineProperty(navigator, "share", { value: share, configurable: true });
    const user = userEvent.setup();

    render(<ShareButton article={article} />);
    await user.click(screen.getByRole("button", { name: "Share article" }));

    await vi.waitFor(() => expect(consoleError).toHaveBeenCalled());
  });

  describe("without the Web Share API (fallback menu)", () => {
    beforeEach(() => {
      delete navigator.share;
    });

    it("opens a fallback menu with copy/email/text options", async () => {
      const user = userEvent.setup();
      render(<ShareButton article={article} />);

      await user.click(screen.getByRole("button", { name: "Share article" }));

      expect(screen.getByText("Copy Link")).toBeInTheDocument();
      expect(screen.getByText("Share via Email")).toBeInTheDocument();
      expect(screen.getByText("Share via Text")).toBeInTheDocument();
    });

    it("copies the article link to the clipboard and shows a confirmation", async () => {
      // userEvent.setup() installs its own navigator.clipboard stub (for
      // user.copy()/paste()) via a getter — defining our mock BEFORE setup()
      // would just get clobbered, so it must come after.
      const user = userEvent.setup();
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

      render(<ShareButton article={article} />);
      await user.click(screen.getByRole("button", { name: "Share article" }));
      await user.click(screen.getByRole("button", { name: "Copy Link" }));

      expect(writeText).toHaveBeenCalledWith("http://localhost:3000/article/article-1");
      expect(await screen.findByText("Copied!")).toBeInTheDocument();
    });

    it("closes the fallback menu when clicking outside", async () => {
      const user = userEvent.setup();
      render(
        <div>
          <ShareButton article={article} />
          <button type="button">outside</button>
        </div>
      );

      await user.click(screen.getByRole("button", { name: "Share article" }));
      expect(screen.getByText("Copy Link")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "outside" }));

      expect(screen.queryByText("Copy Link")).not.toBeInTheDocument();
    });
  });
});
