import { describe, expect, it } from "vitest";
import {
  DEFAULT_KEYBOARD_SHORTCUTS,
  SHORTCUT_LABELS,
  SHORTCUT_ACTIONS,
} from "./keyboardShortcuts";

describe("keyboardShortcuts constants", () => {
  it("has a label for every default shortcut action", () => {
    for (const action of Object.keys(DEFAULT_KEYBOARD_SHORTCUTS)) {
      expect(SHORTCUT_LABELS[action]).toBeTruthy();
    }
  });

  it("derives SHORTCUT_ACTIONS from the default shortcuts' keys", () => {
    expect(SHORTCUT_ACTIONS).toEqual(Object.keys(DEFAULT_KEYBOARD_SHORTCUTS));
  });

  it("has no duplicate key bindings among the defaults", () => {
    const values = Object.values(DEFAULT_KEYBOARD_SHORTCUTS);
    expect(new Set(values).size).toBe(values.length);
  });
});
