import { describe, expect, it } from "vitest";
import { themes } from "./themes";

const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

describe("themes", () => {
  it("exports exactly the default and dark themes", () => {
    expect(Object.keys(themes).sort()).toEqual(["dark", "default"]);
  });

  it("both themes define the same set of token keys", () => {
    const defaultKeys = Object.keys(themes.default).sort();
    const darkKeys = Object.keys(themes.dark).sort();
    expect(darkKeys).toEqual(defaultKeys);
  });

  it("every token value is a valid hex color", () => {
    for (const [themeName, tokens] of Object.entries(themes)) {
      for (const [key, value] of Object.entries(tokens)) {
        expect(value, `${themeName}.${key} should be a hex color`).toMatch(HEX_COLOR);
      }
    }
  });

  it("primary/primaryContrast pairs are distinct colors in each theme", () => {
    for (const tokens of Object.values(themes)) {
      expect(tokens.primary).not.toBe(tokens.primaryContrast);
    }
  });
});
