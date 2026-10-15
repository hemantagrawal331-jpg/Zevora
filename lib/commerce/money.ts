export function rupeesToPaise(value: string) {
  const trimmed = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(trimmed)) return null;
  const [whole, fraction = ""] = trimmed.split(".");
  if (!whole || whole.length > 7) return null;
  const paise = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(paise) || paise <= 0 || paise > 100_000_000) return null;
  return paise;
}

export function optionalComparePaise(priceInPaise: number, value: string) {
  const trimmed = value.trim();
  if (!trimmed) return { ok: true as const, paise: null };
  const paise = rupeesToPaise(trimmed);
  if (paise === null) return { ok: false as const, message: "Enter a sale comparison price in rupees, with at most two decimal places." };
  if (paise <= priceInPaise) return { ok: false as const, message: "The comparison price must be higher than the selling price." };
  return { ok: true as const, paise };
}
