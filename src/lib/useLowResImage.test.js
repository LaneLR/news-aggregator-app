import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLowResImage } from "./useLowResImage";

function makeLoadEvent({ naturalWidth = 0, naturalHeight = 0 } = {}) {
  return { target: { naturalWidth, naturalHeight } };
}

describe("useLowResImage", () => {
  it("starts as not low-res", () => {
    const { result } = renderHook(() => useLowResImage());
    expect(result.current.isLowRes).toBe(false);
  });

  it("flags an image as low-res when its natural width is below the threshold", () => {
    const { result } = renderHook(() => useLowResImage(150));
    act(() => result.current.handleImageLoad(makeLoadEvent({ naturalWidth: 60, naturalHeight: 60 })));
    expect(result.current.isLowRes).toBe(true);
  });

  it("flags an image as low-res when only its natural height is below the threshold", () => {
    const { result } = renderHook(() => useLowResImage(150));
    act(() => result.current.handleImageLoad(makeLoadEvent({ naturalWidth: 600, naturalHeight: 90 })));
    expect(result.current.isLowRes).toBe(true);
  });

  it("does not flag an image at or above the threshold in both dimensions", () => {
    const { result } = renderHook(() => useLowResImage(150));
    act(() => result.current.handleImageLoad(makeLoadEvent({ naturalWidth: 400, naturalHeight: 250 })));
    expect(result.current.isLowRes).toBe(false);
  });

  it("does not flag when naturalWidth/naturalHeight are both 0 (not yet decoded)", () => {
    const { result } = renderHook(() => useLowResImage(150));
    act(() => result.current.handleImageLoad(makeLoadEvent({ naturalWidth: 0, naturalHeight: 0 })));
    expect(result.current.isLowRes).toBe(false);
  });

  it("respects a custom threshold", () => {
    const { result } = renderHook(() => useLowResImage(500));
    act(() => result.current.handleImageLoad(makeLoadEvent({ naturalWidth: 320, naturalHeight: 240 })));
    expect(result.current.isLowRes).toBe(true);
  });

  it("uses the default threshold when none is provided", () => {
    const { result } = renderHook(() => useLowResImage());
    act(() => result.current.handleImageLoad(makeLoadEvent({ naturalWidth: 60, naturalHeight: 60 })));
    expect(result.current.isLowRes).toBe(true);
  });
});
