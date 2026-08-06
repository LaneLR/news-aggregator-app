// Category slugs that require an active ("Subscribed") tier to view.
// Matched case-insensitively against the [category] route param.
export const SUBSCRIBER_ONLY_CATEGORIES = new Set(["market", "finance", "journal"]);
