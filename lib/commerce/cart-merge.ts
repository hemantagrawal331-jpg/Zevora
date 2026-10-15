export type CartMergeLine = {
  variantId: string;
  quantity: number;
  stockQuantity: number;
};

export function mergeCartLines(server: CartMergeLine[], guest: CartMergeLine[], maxQuantity = 5) {
  const combined = new Map<string, { quantity: number; stockQuantity: number }>();
  for (const line of server) {
    if (!line.variantId || !Number.isInteger(line.quantity) || line.quantity <= 0 || line.stockQuantity <= 0) continue;
    const cap = Math.min(maxQuantity, line.stockQuantity);
    combined.set(line.variantId, { quantity: Math.min(line.quantity, cap), stockQuantity: line.stockQuantity });
  }
  for (const line of guest) {
    if (!line.variantId || !Number.isInteger(line.quantity) || line.quantity <= 0) continue;
    const current = combined.get(line.variantId);
    const stockQuantity = line.stockQuantity;
    const cap = Math.min(maxQuantity, Math.max(0, stockQuantity));
    const quantity = Math.min(cap, (current?.quantity ?? 0) + line.quantity);
    if (quantity <= 0) combined.delete(line.variantId);
    else combined.set(line.variantId, { quantity, stockQuantity });
  }
  return [...combined.entries()].map(([variantId, value]) => ({
    variantId,
    quantity: value.quantity,
  }));
}

export function applyMergedCart<T extends { variantId: string | null }>(local: T[], remote: T[]) {
  return [...remote, ...local.filter((line) => !line.variantId)];
}

export function sameCheckout(existingKey: string | null, incomingKey: string) {
  return Boolean(existingKey) && existingKey === incomingKey;
}
