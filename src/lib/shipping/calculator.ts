import { eq, inArray } from "drizzle-orm";
import { productVariants, siteSettings } from "../db/schema";
import type { AnyDb } from "../orders/common";
import { getShippingProvider } from "./provider";
import type { ShippingRateQuote } from "./types";

/**
 * Extracts numeric weight in grams from variant record or fallback label parsing.
 * Never trusts any client-submitted weight.
 */
export function extractVariantWeightGrams(variant: { weightGrams?: number | null; label?: string }): number {
  if (typeof variant.weightGrams === "number" && variant.weightGrams > 0) {
    return variant.weightGrams;
  }

  // Parse common Indian e-commerce label formats: "250 g", "500 g", "1 kg", "1.5 kg"
  if (variant.label) {
    const kgMatch = variant.label.match(/([\d.]+)\s*kg/i);
    if (kgMatch) {
      const kg = Number.parseFloat(kgMatch[1]);
      if (!Number.isNaN(kg) && kg > 0) return Math.round(kg * 1000);
    }
    const gMatch = variant.label.match(/(\d+)\s*g/i);
    if (gMatch) {
      const g = Number.parseInt(gMatch[1], 10);
      if (!Number.isNaN(g) && g > 0) return g;
    }
  }

  // Safe default: 500g per unit if unspecified
  return 500;
}

export type CartItemWeight = {
  variantId: string;
  quantity: number;
};

/**
 * Calculates total shipment weight directly from the database variants.
 */
export async function calculateCartWeightGrams(db: AnyDb, items: CartItemWeight[]): Promise<number> {
  if (items.length === 0) return 0;

  const variantIds = items.map((i) => i.variantId);
  const rows = await db
    .select({
      id: productVariants.id,
      weightGrams: productVariants.weightGrams,
      label: productVariants.label,
    })
    .from(productVariants)
    .where(inArray(productVariants.id, variantIds));

  const map = new Map(rows.map((r) => [r.id, extractVariantWeightGrams(r)]));

  let totalWeight = 0;
  for (const item of items) {
    const unitWeight = map.get(item.variantId) ?? 500;
    totalWeight += unitWeight * item.quantity;
  }

  return Math.max(100, totalWeight); // Minimum 100g
}

/**
 * Authoritatively calculates shipping charge and serviceability.
 * Priority:
 * 1. Site settings free-shipping threshold (e.g. Free shipping above ₹1000).
 * 2. Provider serviceability check and live rates (if configured).
 * 3. Fallback to site settings flat rate (e.g. ₹50 flat rate).
 */
export async function calculateAuthoritativeShipping(
  db: AnyDb,
  destinationPincode: string,
  weightGrams: number,
  subtotalPaise: number,
  providerId?: string,
): Promise<ShippingRateQuote> {
  // 1. Fetch site shipping settings
  const [row] = await db.select().from(siteSettings).where(eq(siteSettings.key, "shipping"));
  const v = (row?.value ?? {}) as { flatRatePaise?: number | null; freeShippingAbovePaise?: number | null };
  const flatRatePaise = Number.isInteger(v.flatRatePaise) && v.flatRatePaise! >= 0 ? v.flatRatePaise! : 0;
  const freeAbovePaise = Number.isInteger(v.freeShippingAbovePaise) ? v.freeShippingAbovePaise! : null;

  // 2. Check provider serviceability
  const provider = getShippingProvider(providerId);
  const serviceability = await provider.checkServiceability(destinationPincode, weightGrams);

  if (!serviceability.serviceable) {
    return {
      serviceable: false,
      ratePaise: 0,
      message: serviceability.message || "Delivery is currently unavailable for this pincode.",
    };
  }

  // 3. Free shipping threshold qualification
  if (freeAbovePaise !== null && subtotalPaise >= freeAbovePaise) {
    return {
      serviceable: true,
      ratePaise: 0,
      courierName: serviceability.courierName,
      estimatedDays: serviceability.estimatedDays,
      freeShipping: true,
    };
  }

  // 4. Live provider rate calculation if configured
  if (provider.isConfigured() && provider.id !== "manual") {
    try {
      const quote = await provider.calculateRate(destinationPincode, weightGrams, subtotalPaise);
      if (quote.serviceable && quote.ratePaise > 0) {
        return quote;
      }
    } catch {
      // Fall through to configured flat rate
    }
  }

  // 5. Authoritative business flat rate fallback
  return {
    serviceable: true,
    ratePaise: flatRatePaise,
    courierName: serviceability.courierName,
    estimatedDays: serviceability.estimatedDays,
    freeShipping: flatRatePaise === 0,
  };
}
