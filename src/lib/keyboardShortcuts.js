// Shared between the User model default, the settings API route, the
// client-side provider, and the settings UI — one source of truth for what
// "default" means and what each action is called.
export const DEFAULT_KEYBOARD_SHORTCUTS = {
  next: "j",
  prev: "k",
  open: "o",
  save: "s",
  like: "l",
  search: "/",
  help: "?",
};

export const SHORTCUT_LABELS = {
  next: "Next article",
  prev: "Previous article",
  open: "Open selected article",
  save: "Save selected article",
  like: "Like selected article",
  search: "Focus search",
  help: "Show shortcuts",
};

export const SHORTCUT_ACTIONS = Object.keys(DEFAULT_KEYBOARD_SHORTCUTS);
