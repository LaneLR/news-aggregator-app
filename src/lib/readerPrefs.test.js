import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
  DEFAULT_READER_PREFS,
  FONT_SIZE_STEPS,
  LINE_HEIGHT_STEPS,
  CONTENT_WIDTH_STEPS,
  FONT_FAMILY_STEPS,
  readerPrefsToCssVars,
  useReaderPrefs,
} from "./readerPrefs";

describe("readerPrefsToCssVars", () => {
  it("maps each pref field to its corresponding CSS var step", () => {
    const vars = readerPrefsToCssVars(DEFAULT_READER_PREFS);
    expect(vars["--reader-font-size"]).toBe(FONT_SIZE_STEPS.medium);
    expect(vars["--reader-line-height"]).toBe(LINE_HEIGHT_STEPS.normal);
    expect(vars["--reader-content-width"]).toBe(CONTENT_WIDTH_STEPS.normal);
    expect(vars["--reader-font-family"]).toBe(FONT_FAMILY_STEPS.default);
  });

  it("falls back to the default step for an unrecognized value", () => {
    const vars = readerPrefsToCssVars({
      fontSize: "huge",
      lineHeight: "tight",
      contentWidth: "full",
      fontFamily: "comic-sans",
    });
    expect(vars["--reader-font-size"]).toBe(FONT_SIZE_STEPS.medium);
    expect(vars["--reader-line-height"]).toBe(LINE_HEIGHT_STEPS.normal);
    expect(vars["--reader-content-width"]).toBe(CONTENT_WIDTH_STEPS.normal);
    expect(vars["--reader-font-family"]).toBe(FONT_FAMILY_STEPS.default);
  });
});

describe("useReaderPrefs", () => {
  it("starts with the default prefs when nothing is saved", () => {
    const { result } = renderHook(() => useReaderPrefs());
    expect(result.current.prefs).toEqual(DEFAULT_READER_PREFS);
  });

  it("reads previously saved prefs from localStorage on mount", () => {
    localStorage.setItem(
      "morningfeeds:readerPrefs",
      JSON.stringify({ fontSize: "large" })
    );
    const { result } = renderHook(() => useReaderPrefs());
    expect(result.current.prefs).toEqual({ ...DEFAULT_READER_PREFS, fontSize: "large" });
  });

  it("falls back to defaults for malformed stored JSON", () => {
    localStorage.setItem("morningfeeds:readerPrefs", "{not valid");
    const { result } = renderHook(() => useReaderPrefs());
    expect(result.current.prefs).toEqual(DEFAULT_READER_PREFS);
  });

  it("updatePrefs merges a partial update and persists it", () => {
    const { result } = renderHook(() => useReaderPrefs());

    act(() => {
      result.current.updatePrefs({ fontSize: "xlarge" });
    });

    expect(result.current.prefs).toEqual({ ...DEFAULT_READER_PREFS, fontSize: "xlarge" });
    expect(JSON.parse(localStorage.getItem("morningfeeds:readerPrefs"))).toEqual({
      ...DEFAULT_READER_PREFS,
      fontSize: "xlarge",
    });
  });

  it("resetPrefs restores the defaults", () => {
    const { result } = renderHook(() => useReaderPrefs());

    act(() => {
      result.current.updatePrefs({ fontSize: "xlarge", lineHeight: "compact" });
    });
    act(() => {
      result.current.resetPrefs();
    });

    expect(result.current.prefs).toEqual(DEFAULT_READER_PREFS);
  });
});
