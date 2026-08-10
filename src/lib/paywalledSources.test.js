import { describe, expect, it } from "vitest";
import { PAYWALLED_SOURCES } from "./paywalledSources";

describe("PAYWALLED_SOURCES", () => {
  it("flags a known paywalled source", () => {
    expect(PAYWALLED_SOURCES.has("New York Times")).toBe(true);
  });

  it("does not flag an unlisted source", () => {
    expect(PAYWALLED_SOURCES.has("Associated Press")).toBe(false);
  });

  it("does not match a source name with a leading 'The' that isn't stored that way", () => {
    // Sources are stored without a leading "The" except where explicitly listed.
    expect(PAYWALLED_SOURCES.has("The New York Times")).toBe(false);
  });
});
