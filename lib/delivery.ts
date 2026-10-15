export type DeliveryQuote = {
  serviceable: boolean | null;
  eta: string | null;
  message: string;
  source: "unconfigured";
};

/**
 * Delivery PIN check.
 * Replace the body of this function with the shipping provider call.
 * Keep the DeliveryQuote return so the product page does not need to change.
 * This function must not invent a delivery date.
 */
export async function checkDeliveryPin(pin: string): Promise<DeliveryQuote> {
  const normalized = pin.trim();
  if (!/^[1-9][0-9]{5}$/.test(normalized)) {
    return {
      serviceable: false,
      eta: null,
      message: "Enter a 6-digit PIN code.",
      source: "unconfigured",
    };
  }

  return {
    serviceable: null,
    eta: null,
    message: `PIN ${normalized} is valid. Delivery estimates are not connected yet, so no date is shown.`,
    source: "unconfigured",
  };
}
