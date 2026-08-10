import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, renderHook } from "@testing-library/react";
import { useArticleShortcuts } from "./useArticleShortcuts";

// useKeyboardShortcuts falls back to KeyboardShortcutsContext's default value
// (DEFAULT_KEYBOARD_SHORTCUTS) when no Provider wraps the tree, so no mock
// is needed for it — only next/navigation's router needs one.
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

function makeArticles(n) {
  return Array.from({ length: n }, (_, i) => ({ id: `a${i}` }));
}

describe("useArticleShortcuts", () => {
  beforeEach(() => {
    pushMock.mockReset();
  });

  it("moves selection forward with 'j', capped at the last index", () => {
    const { result } = renderHook(() => useArticleShortcuts(makeArticles(2)));

    act(() => fireEvent.keyDown(document, { key: "j" }));
    expect(result.current.selectedIndex).toBe(0);

    act(() => fireEvent.keyDown(document, { key: "j" }));
    expect(result.current.selectedIndex).toBe(1);

    act(() => fireEvent.keyDown(document, { key: "j" }));
    expect(result.current.selectedIndex).toBe(1);
  });

  it("moves selection backward with 'k', capped at 0", () => {
    const { result } = renderHook(() => useArticleShortcuts(makeArticles(3)));

    act(() => {
      fireEvent.keyDown(document, { key: "j" });
      fireEvent.keyDown(document, { key: "j" });
    });
    expect(result.current.selectedIndex).toBe(1);

    act(() => fireEvent.keyDown(document, { key: "k" }));
    expect(result.current.selectedIndex).toBe(0);

    act(() => fireEvent.keyDown(document, { key: "k" }));
    expect(result.current.selectedIndex).toBe(0);
  });

  it("calls onOpen with the selected article on 'o' instead of navigating", () => {
    const articles = makeArticles(2);
    const onOpen = vi.fn();
    renderHook(() => useArticleShortcuts(articles, onOpen));

    act(() => fireEvent.keyDown(document, { key: "j" }));
    act(() => fireEvent.keyDown(document, { key: "o" }));

    expect(onOpen).toHaveBeenCalledWith(articles[0]);
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("falls back to router.push on Enter when no onOpen is provided", () => {
    const articles = makeArticles(1);
    renderHook(() => useArticleShortcuts(articles));

    act(() => fireEvent.keyDown(document, { key: "j" }));
    act(() => fireEvent.keyDown(document, { key: "Enter" }));

    expect(pushMock).toHaveBeenCalledWith(`/article/${articles[0].id}`);
  });

  it("focuses the search input on '/' even with an empty article list", () => {
    const input = document.createElement("input");
    input.setAttribute("data-search-input", "");
    document.body.appendChild(input);

    renderHook(() => useArticleShortcuts([]));
    act(() => fireEvent.keyDown(document, { key: "/" }));

    expect(document.activeElement).toBe(input);
    document.body.removeChild(input);
  });

  it("ignores navigation shortcuts while focus is inside an input", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    const { result } = renderHook(() => useArticleShortcuts(makeArticles(2)));
    act(() => fireEvent.keyDown(input, { key: "j" }));

    expect(result.current.selectedIndex).toBe(-1);
    document.body.removeChild(input);
  });

  it("ignores shortcuts combined with a modifier key", () => {
    const { result } = renderHook(() => useArticleShortcuts(makeArticles(2)));

    act(() => fireEvent.keyDown(document, { key: "j", ctrlKey: true }));
    expect(result.current.selectedIndex).toBe(-1);

    act(() => fireEvent.keyDown(document, { key: "j", metaKey: true }));
    expect(result.current.selectedIndex).toBe(-1);
  });

  it("clicks the save/like action buttons on the selected card via cardRefs", () => {
    const { result } = renderHook(() => useArticleShortcuts(makeArticles(1)));
    const saveClick = vi.fn();
    const likeClick = vi.fn();
    const fakeCard = {
      scrollIntoView: vi.fn(),
      querySelector: (selector) => {
        if (selector === '[data-action="save"]') return { click: saveClick };
        if (selector === '[data-action="like"]') return { click: likeClick };
        return null;
      },
    };

    act(() => {
      result.current.cardRefs.current[0] = fakeCard;
      fireEvent.keyDown(document, { key: "j" });
    });
    act(() => fireEvent.keyDown(document, { key: "s" }));
    expect(saveClick).toHaveBeenCalled();

    act(() => fireEvent.keyDown(document, { key: "l" }));
    expect(likeClick).toHaveBeenCalled();
  });
});
