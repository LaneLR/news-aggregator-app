import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeFetchResponse } from "@/test/fixtures";
import KeywordFilters from "./KeywordFilters";

function mockPatch(responseKeywords) {
  global.fetch.mockImplementation((url, opts) => {
    if (url === "/api/users/keyword-filters" && opts?.method === "PATCH") {
      return Promise.resolve(makeFetchResponse({ mutedKeywords: responseKeywords }));
    }
    return Promise.reject(new Error(`Unmocked fetch: ${url}`));
  });
}

describe("KeywordFilters", () => {
  it("renders with no chips when there are no initial keywords", () => {
    render(<KeywordFilters initialKeywords={[]} />);
    expect(screen.queryByRole("button", { name: /remove/i })).not.toBeInTheDocument();
  });

  it("renders existing keywords as chips", () => {
    render(<KeywordFilters initialKeywords={["election", "crypto"]} />);
    expect(screen.getByText("election")).toBeInTheDocument();
    expect(screen.getByText("crypto")).toBeInTheDocument();
  });

  it("adds a new keyword on submit", async () => {
    const user = userEvent.setup();
    mockPatch(["election"]);
    render(<KeywordFilters initialKeywords={[]} />);

    await user.type(screen.getByPlaceholderText(/add a word or phrase/i), "election");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(await screen.findByText("election")).toBeInTheDocument();
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/users/keyword-filters",
        expect.objectContaining({ method: "PATCH" })
      )
    );
  });

  it("does not add a duplicate keyword", async () => {
    const user = userEvent.setup();
    render(<KeywordFilters initialKeywords={["election"]} />);

    await user.type(screen.getByPlaceholderText(/add a word or phrase/i), "election");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getAllByText("election")).toHaveLength(1);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("removes a keyword when its remove button is clicked", async () => {
    const user = userEvent.setup();
    mockPatch([]);
    render(<KeywordFilters initialKeywords={["election"]} />);

    await user.click(screen.getByRole("button", { name: "Remove election" }));

    await waitFor(() => expect(screen.queryByText("election")).not.toBeInTheDocument());
  });
});
