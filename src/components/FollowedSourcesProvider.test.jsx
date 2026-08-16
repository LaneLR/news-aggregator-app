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

  it("does not use the default no-op context when rendered outside the provider", async () => {
    const user = userEvent.setup();
    render(<Consumer sourceName="Reuters" />);

    expect(screen.getByRole("button")).toHaveTextContent("not-following");
    // Clicking calls the default context's toggleFollow no-op — this must
    // not throw even though there's no provider backing it.
    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveTextContent("not-following");
  });

  it("does not update state when the initial fetch fails", async () => {
    mockSession = { user: { id: "user-1" } };
    mockRoutes([
      ["/api/users/followed-sources", () => makeFetchResponse(null, { ok: false, status: 500 })],
    ]);
    render(
      <FollowedSourcesProvider>
        <Consumer sourceName="Reuters" />
      </FollowedSourcesProvider>
    );

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(screen.getByRole("button")).toHaveTextContent("not-following");
  });

  it("silently swallows a network error from the initial fetch", async () => {
    mockSession = { user: { id: "user-1" } };
    global.fetch.mockImplementation(() => Promise.reject(new Error("Network down")));
    render(
      <FollowedSourcesProvider>
        <Consumer sourceName="Reuters" />
      </FollowedSourcesProvider>
    );

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(screen.getByRole("button")).toHaveTextContent("not-following");
  });

  it("cleans up and ignores the initial fetch's result after unmounting", async () => {
    mockSession = { user: { id: "user-1" } };
    let resolveGet;
    global.fetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveGet = () => resolve(makeFetchResponse({ followedSources: ["Reuters"] }));
        })
    );
    const { unmount } = render(
      <FollowedSourcesProvider>
        <Consumer sourceName="Reuters" />
      </FollowedSourcesProvider>
    );

    unmount();
    resolveGet();
    await new Promise((resolve) => setTimeout(resolve, 10));
    // No assertion possible on unmounted DOM — this exercises the effect's
    // cleanup path (the `cancelled` flag) without React warning about a
    // state update on an unmounted component.
  });

  it("leaves state unchanged when a successful toggle response has no followedSources", async () => {
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
        (opts) => (opts?.method === "POST" ? makeFetchResponse({}) : makeFetchResponse({ followedSources: [] })),
      ],
    ]);

    await user.click(screen.getByRole("button"));
    // Optimistic update still applies immediately...
    expect(screen.getByRole("button")).toHaveTextContent("following");

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/users/followed-sources",
        expect.objectContaining({ method: "POST" })
      )
    );
    // ...and a response without followedSources doesn't clobber it either.
    expect(screen.getByRole("button")).toHaveTextContent("following");
  });

  it("reverts by re-adding a source when unfollowing it fails", async () => {
    const user = userEvent.setup();
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

    mockRoutes([
      [
        "/api/users/followed-sources",
        (opts) =>
          opts?.method === "POST"
            ? makeFetchResponse(null, { ok: false, status: 500 })
            : makeFetchResponse({ followedSources: ["Reuters"] }),
      ],
    ]);

    // The optimistic "not-following" state is applied and then reverted
    // within the same click's fetch chain (the mock resolves near-instantly),
    // so only the settled end state — reverted back to "following" plus the
    // error toast — is reliably observable here.
    await user.click(screen.getByRole("button"));

    await waitFor(() => expect(screen.getByRole("button")).toHaveTextContent("following"));
    expect(toast.error).toHaveBeenCalledWith("Couldn't update follow status. Please try again.");
  });

  it("ignores a stale failed POST response when a newer toggle already superseded it", async () => {
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

    // First POST (the follow) fails slowly; second POST (the unfollow that
    // supersedes it) succeeds fast — the slow failure landing last must not
    // revert the fast, more recent result or show a toast.
    let rejectFirstPost;
    const firstPostPromise = new Promise((_resolve, reject) => {
      rejectFirstPost = () => reject(new Error("Request failed"));
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

    await user.click(screen.getByRole("button")); // fires the slow, failing "follow"
    expect(screen.getByRole("button")).toHaveTextContent("following");

    await user.click(screen.getByRole("button")); // fires the fast "unfollow"
    await waitFor(() => expect(screen.getByRole("button")).toHaveTextContent("not-following"));

    rejectFirstPost();
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(screen.getByRole("button")).toHaveTextContent("not-following");
    expect(toast.error).not.toHaveBeenCalled();
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
