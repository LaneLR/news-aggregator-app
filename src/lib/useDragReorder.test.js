import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useDragReorder } from "./useDragReorder";

function makeDragEvent(overrides = {}) {
  return {
    preventDefault: vi.fn(),
    dataTransfer: {},
    ...overrides,
  };
}

describe("useDragReorder", () => {
  it("starts with no dragged/drag-over index", () => {
    const { result } = renderHook(() => useDragReorder(["a", "b", "c"], vi.fn()));
    expect(result.current.draggedIndex).toBeNull();
    expect(result.current.dragOverIndex).toBeNull();
  });

  it("onDragStart records the dragged index and sets the drop effect", () => {
    const { result } = renderHook(() => useDragReorder(["a", "b", "c"], vi.fn()));
    const event = makeDragEvent();

    act(() => result.current.getHandlers(1).onDragStart(event));

    expect(result.current.draggedIndex).toBe(1);
    expect(event.dataTransfer.effectAllowed).toBe("move");
  });

  it("onDragOver sets dragOverIndex only once a drag is in progress and target differs", () => {
    const { result } = renderHook(() => useDragReorder(["a", "b", "c"], vi.fn()));

    // No drag started yet — dragOverIndex should not change.
    act(() => result.current.getHandlers(1).onDragOver(makeDragEvent()));
    expect(result.current.dragOverIndex).toBeNull();

    act(() => result.current.getHandlers(0).onDragStart(makeDragEvent()));
    act(() => result.current.getHandlers(0).onDragOver(makeDragEvent()));
    // Same index as the dragged item — no-op.
    expect(result.current.dragOverIndex).toBeNull();

    act(() => result.current.getHandlers(2).onDragOver(makeDragEvent()));
    expect(result.current.dragOverIndex).toBe(2);
  });

  it("onDrop reorders the items array and calls onReorder, then resets state", () => {
    const onReorder = vi.fn();
    const { result } = renderHook(() => useDragReorder(["a", "b", "c"], onReorder));

    act(() => result.current.getHandlers(0).onDragStart(makeDragEvent()));
    act(() => result.current.getHandlers(2).onDrop(makeDragEvent()));

    expect(onReorder).toHaveBeenCalledWith(["b", "c", "a"]);
    expect(result.current.draggedIndex).toBeNull();
    expect(result.current.dragOverIndex).toBeNull();
  });

  it("onDrop is a no-op when dropped on the same index that started the drag", () => {
    const onReorder = vi.fn();
    const { result } = renderHook(() => useDragReorder(["a", "b", "c"], onReorder));

    act(() => result.current.getHandlers(1).onDragStart(makeDragEvent()));
    act(() => result.current.getHandlers(1).onDrop(makeDragEvent()));

    expect(onReorder).not.toHaveBeenCalled();
  });

  it("onDragEnd clears dragged/drag-over state", () => {
    const { result } = renderHook(() => useDragReorder(["a", "b", "c"], vi.fn()));

    act(() => result.current.getHandlers(0).onDragStart(makeDragEvent()));
    act(() => result.current.getHandlers(2).onDragOver(makeDragEvent()));
    act(() => result.current.getHandlers(0).onDragEnd());

    expect(result.current.draggedIndex).toBeNull();
    expect(result.current.dragOverIndex).toBeNull();
  });
});
