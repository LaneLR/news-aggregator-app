import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeFetchResponse } from "@/test/fixtures";
import FollowedKeywords from "./FollowedKeywords";

describe("FollowedKeywords", () => {
  it("renders initial keywords as chips", () => {
    render(<FollowedKeywords initialKeywords={["ai", "markets"]} />);
    expect(screen.getByText("ai")).toBeInTheDocument();
    expect(screen.getByText("markets")).toBeInTheDocument();
  });

  it("adds a new keyword and persists it", async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({ followedKeywords: ["ai", "crypto"] })
    );

    render(<FollowedKeywords initialKeywords={["ai"]} />);
    await user.type(screen.getByPlaceholderText(/Add a word, topic, or company/), "crypto");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(await screen.findByText("crypto")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/users/followed-keywords",
      expect.objectContaining({ method: "PATCH" })
    );
  });

  it("does not add a duplicate or blank keyword", async () => {
    const user = userEvent.setup();
    render(<FollowedKeywords initialKeywords={["ai"]} />);
    await user.type(screen.getByPlaceholderText(/Add a word, topic, or company/), "ai");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(global.fetch).not.toHaveBeenCalled();
    expect(screen.getAllByText("ai")).toHaveLength(1);
  });

  it("removes a keyword when its remove button is clicked", async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ followedKeywords: [] }));

    render(<FollowedKeywords initialKeywords={["ai"]} />);
    await user.click(screen.getByRole("button", { name: "Remove ai" }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(screen.queryByText("ai")).not.toBeInTheDocument();
  });
});
