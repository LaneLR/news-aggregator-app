import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeFetchResponse } from "@/test/fixtures";

const { default: FollowedSources } = await import("./FollowedSources");

describe("FollowedSources", () => {
  beforeEach(() => {
    global.fetch.mockImplementation((url) =>
      Promise.reject(new Error(`Unmocked fetch: ${url}`))
    );
  });

  it("shows an empty-state message when there are no followed sources", () => {
    render(<FollowedSources initialSources={[]} />);
    expect(screen.getByText("You're not following any sources yet.")).toBeInTheDocument();
  });

  it("renders a chip for each followed source", () => {
    render(<FollowedSources initialSources={["Reuters", "BBC"]} />);
    expect(screen.getByText("Reuters")).toBeInTheDocument();
    expect(screen.getByText("BBC")).toBeInTheDocument();
  });

  it("removes a source when its chip's unfollow button is clicked", async () => {
    const user = userEvent.setup();
    global.fetch.mockImplementation((url, opts) => {
      if (url === "/api/users/followed-sources" && opts?.method === "POST") {
        return Promise.resolve(makeFetchResponse({ followedSources: ["BBC"] }));
      }
      return Promise.reject(new Error(`Unmocked fetch: ${url}`));
    });
    render(<FollowedSources initialSources={["Reuters", "BBC"]} />);

    await user.click(screen.getByRole("button", { name: "Unfollow Reuters" }));

    await waitFor(() => expect(screen.queryByText("Reuters")).not.toBeInTheDocument());
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/users/followed-sources",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ sourceName: "Reuters" }),
      })
    );
  });
});
