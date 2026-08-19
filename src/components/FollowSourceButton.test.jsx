import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

let mockSession = null;
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession }),
}));

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), show: vi.fn(), dismiss: vi.fn() };
vi.mock("./ToastProvider", () => ({ useToast: () => toast }));

let mockFollowing = false;
const toggleFollow = vi.fn();
vi.mock("./FollowedSourcesProvider", () => ({
  useFollowedSources: () => ({ isFollowing: () => mockFollowing, toggleFollow }),
}));

const { default: FollowSourceButton } = await import("./FollowSourceButton");

describe("FollowSourceButton", () => {
  beforeEach(() => {
    mockSession = null;
    mockFollowing = false;
    push.mockClear();
    toast.info.mockClear();
    toggleFollow.mockClear();
  });

  it("renders nothing when there's no real source name", () => {
    const { container } = render(<FollowSourceButton sourceName="Unknown source" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a 'Follow' label and unpressed state when not following", () => {
    render(<FollowSourceButton sourceName="Reuters" />);
    const button = screen.getByRole("button", { name: "Follow Reuters" });
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("shows an 'Unfollow' label and pressed state when already following", () => {
    mockFollowing = true;
    render(<FollowSourceButton sourceName="Reuters" />);
    const button = screen.getByRole("button", { name: "Unfollow Reuters" });
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("shows a readable 'Follow'/'Following' text label instead of an icon-only button", () => {
    const { rerender } = render(<FollowSourceButton sourceName="Reuters" />);
    expect(screen.getByRole("button", { name: "Follow Reuters" })).toHaveTextContent("Follow");

    mockFollowing = true;
    rerender(<FollowSourceButton sourceName="Reuters" />);
    expect(screen.getByRole("button", { name: "Unfollow Reuters" })).toHaveTextContent("Following");
  });

  it("redirects to login and shows a toast when clicked while signed out", async () => {
    const user = userEvent.setup();
    render(<FollowSourceButton sourceName="Reuters" />);

    await user.click(screen.getByRole("button", { name: "Follow Reuters" }));

    expect(toast.info).toHaveBeenCalledWith("Sign in to follow sources.");
    expect(push).toHaveBeenCalledWith("/login");
    expect(toggleFollow).not.toHaveBeenCalled();
  });

  it("toggles follow state when clicked while signed in", async () => {
    const user = userEvent.setup();
    mockSession = { user: { id: "user-1" } };
    render(<FollowSourceButton sourceName="Reuters" />);

    await user.click(screen.getByRole("button", { name: "Follow Reuters" }));

    expect(toggleFollow).toHaveBeenCalledWith("Reuters");
    expect(push).not.toHaveBeenCalled();
  });
});
