import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const { default: TextToSpeechButton } = await import("./TextToSpeechButton");

function stubSpeechSynthesis() {
  window.speechSynthesis = {
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
  };
  window.SpeechSynthesisUtterance = vi.fn(function SpeechSynthesisUtterance(text) {
    this.text = text;
  });
}

describe("TextToSpeechButton", () => {
  beforeEach(() => {
    push.mockClear();
    stubSpeechSynthesis();
  });

  afterEach(() => {
    delete window.speechSynthesis;
    delete window.SpeechSynthesisUtterance;
  });

  it("renders nothing when there is no text", () => {
    const { container } = render(<TextToSpeechButton text="" isSubscribed />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the Web Speech API isn't supported", () => {
    delete window.speechSynthesis;
    const { container } = render(<TextToSpeechButton text="Some article text" isSubscribed />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a locked 'Listen' button for non-subscribers that routes to /pricing", async () => {
    const user = userEvent.setup();
    render(<TextToSpeechButton text="Some article text" isSubscribed={false} />);

    const button = screen.getByRole("button", { name: /Listen/ });
    await user.click(button);

    expect(push).toHaveBeenCalledWith("/pricing");
    expect(window.speechSynthesis.speak).not.toHaveBeenCalled();
  });

  it("starts speaking when a subscriber clicks Listen", async () => {
    const user = userEvent.setup();
    render(<TextToSpeechButton text="Some article text" isSubscribed />);

    await user.click(screen.getByRole("button", { name: "Listen" }));

    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
    expect(screen.getByTitle("Stop")).toBeInTheDocument();
  });

  it("pauses and resumes playback", async () => {
    const user = userEvent.setup();
    render(<TextToSpeechButton text="Some article text" isSubscribed />);

    await user.click(screen.getByRole("button", { name: "Listen" }));
    await user.click(screen.getByRole("button", { name: "Pause" }));

    expect(window.speechSynthesis.pause).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Resume" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Resume" }));
    expect(window.speechSynthesis.resume).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
  });

  it("stops playback and returns to idle, hiding the stop button", async () => {
    const user = userEvent.setup();
    render(<TextToSpeechButton text="Some article text" isSubscribed />);

    await user.click(screen.getByRole("button", { name: "Listen" }));
    await user.click(screen.getByTitle("Stop"));

    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Listen" })).toBeInTheDocument();
    expect(screen.queryByTitle("Stop")).not.toBeInTheDocument();
  });
});
