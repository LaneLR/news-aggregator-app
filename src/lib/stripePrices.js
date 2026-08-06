// The two billing options for the single paid ("Subscribed") tier.
// Both unlock the same features — they only differ by billing interval.
export const MONTHLY_PRICE_ID = "price_1Ry0mKFlSQA8kdoEj98uKzPj";
export const ANNUAL_PRICE_ID = "price_1Ry0oNFlSQA8kdoEdZzVvegu";

export function billingIntervalForPrice(priceId) {
  if (priceId === ANNUAL_PRICE_ID) return "annual";
  if (priceId === MONTHLY_PRICE_ID) return "monthly";
  return null;
}
