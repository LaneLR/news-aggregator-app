import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeFetchResponse } from "@/test/fixtures";

let mockSession = null;
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession }),
}));

const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), show: vi.fn(), dismiss: vi.fn() };
vi.mock("./ToastProvider", () => ({ useToast: () => toast }));

const { default: FollowedSourcesProvider, useFollowedSources } = await import(
  "./FollowedSourcesProvider"
);

function Consumer({ sourceName }) {
  const { isFollowing, toggleFollow } = useFollowedSources();
  return (
    <button onClick={() => toggleFollow(sourceName)}>
      {isFollowing(sourceName) ? "following" : "not-following"}
    </button>
  );
}

function mockRoutes(routes) {
  global.fetch.mockImplementation((url, opts) => {
    const urlStr = url.toString();
    for (const [matcher, handler] of routes) {
      const matches = typeof matcher === "string" ? urlStr === matcher : matcher.test(urlStr);
      if (matches) return Promise.resolve(handler(opts));
    }
    return Promise.reject(new Error(`Unmocked fetch: ${urlStr}`));
  });
}

describe("FollowedSourcesProvider", () => {
  beforeEach(() => {
    mockSession = null;
    toast.error.mockClear();
  });

  it("does not fetch when signed out", () => {
    global.fetch.mockImplementation(() => Promise.reject(new Error("Unmocked fetch")));
    render(
      <FollowedSourcesProvider>
        <Consumer sourceName="Reuters" />
      </FollowedSourcesProvider>
    );
    expect(screen.getByRole("button")).toHaveTextContent("not-following");
  });

  it("seeds followed sources from the API when signed in", async () => {
    mockSession = { user: { id: "user-1" } };
    mockRoutes([
      ["/api/users/followed-sources", () => makeFetchResponse({ followedSources: ["Reuters"] })],
    ]);
    render(
      <FollowedSourcesProvider>
        <Consumer sourceName="Reuters" />
      </FollowedSourcesProvider>
    );

    await waitFor(() => expect(screen.getByRole("button")).toHaveTextContent("following"));
  });

  it("optimistically toggles and persists via POST", async () => {
    const user = userEvent.setup();
    mockSession = { user: { id: "user-1" } };
    mockRoutes([
      ["/api/users/followed-sources", () => makeFetchResponse({ followedSources: [] })],
    ]);
    render(
      <FollowedSourcesProvider>
        <Consumer sourceName="Reuters" />
      </FollowedSourcesProvider>
    );
    await waitFor(() => expect(screen.getByRole("button")).toHaveTextContent("not-following"));

    mockRoutes([
      [
        "/api/users/followed-sources",
        (opts) =>
          opts?.method === "POST"
            ? makeFetchResponse({ following: true, followedSources: ["Reuters"] })
            : makeFetchResponse({ followedSources: [] }),
      ],
    ]);

    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveTextContent("following");

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/users/followed-sources",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ sourceName: "Reuters" }),
        })
      )
    );
  });

  it("ignores a slow first response that resolves after a second toggle already superseded it", async () => {
    const user = userEvent.setup();
    mockSession = { user: { id: "user-1" } };
    mockRoutes([
      ["/api/users/followed-sources", () => makeFetchResponse({ followedSources: [] })],
    ]);
    render(
      <FollowedSourcesProvider>
        <Consumer sourceName="Reuters" />
      </FollowedSourcesProvider>
    );
    await waitFor(() => expect(screen.getByRole("button")).toHaveTextContent("not-following"));

    // First POST (the follow) resolves slowly; second POST (the unfollow
    // that supersedes it) resolves fast — the slow response landing last
    // must not clobber the fast one's more recent result.
    let resolveFirstPost;
    const firstPostPromise = new Promise((resolve) => {
      resolveFirstPost = () =>
        resolve(makeFetchResponse({ following: true, followedSources: ["Reuters"] }));
    });
    let postCallCount = 0;
    global.fetch.mockImplementation((url, opts) => {
      if (url === "/api/users/followed-sources" && opts?.method === "POST") {
        postCallCount += 1;
        if (postCallCount === 1) return firstPostPromise;
        return Promise.resolve(makeFetchResponse({ following: false, followedSources: [] }));
      }
      return Promise.reject(new Error(`Unmocked fetch: ${url}`));
    });

    await user.click(screen.getByRole("button")); // fires the slow "follow"
    expect(screen.getByRole("button")).toHaveTextContent("following");

    await user.click(screen.getByRole("button")); // fires the fast "unfollow"
    await waitFor(() => expect(screen.getByRole("button")).toHaveTextContent("not-following"));

    // Now let the slow first response land — it must be ignored.
    resolveFirstPost();
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(screen.getByRole("button")).toHaveTextContent("not-following");
  });

  it("reverts the optimistic toggle and shows a toast when the POST fails", async () => {
    const user = userEvent.setup();
    mockSession = { user: { id: "user-1" } };
    mockRoutes([
      ["/api/users/followed-sources", () => makeFetchResponse({ followedSources: [] })],
    ]);
    render(
      <FollowedSourcesProvider>
        <Consumer sourceName="Reuters" />
      </FollowedSourcesProvider>
    );
    await waitFor(() => expect(screen.getByRole("button")).toHaveTextContent("not-following"));

    mockRoutes([
      [
        "/api/users/followed-sources",
        (opts) =>
          opts?.method === "POST"
            ? makeFetchResponse(null, { ok: false, status: 500 })
            : makeFetchResponse({ followedSources: [] }),
      ],
    ]);

    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveTextContent("following");

    await waitFor(() => expect(screen.getByRole("button")).toHaveTextContent("not-following"));
    expect(toast.error).toHaveBeenCalledWith("Couldn't update follow status. Please try again.");
  });
});
