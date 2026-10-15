export type BagDecision = { ok: true; quantity: number } | { ok: false; message: string };

export function decideBagQuantity(input: {
  stock: number;
  already: number;
  requested: number;
  maxPerLine?: number;
}): BagDecision {
  if (!Number.isInteger(input.requested) || input.requested < 1) {
    return { ok: false, message: "Choose a quantity." };
  }
  if (input.stock <= 0) return { ok: false, message: "This selection is out of stock." };
  const cap = Math.min(input.maxPerLine ?? 5, input.stock);
  const next = input.already + input.requested;
  if (next > cap) {
    const limit = Math.max(0, cap - input.already);
    if (limit <= 0) return { ok: false, message: `Only ${cap} can be added.` };
    return { ok: false, message: `Only ${limit} more can be added.` };
  }
  return { ok: true, quantity: next };
}
