export type CameroonOperator = "Orange Money" | "MTN MoMo";

export interface NormalizedCameroonPhone {
  valid: boolean;
  local9: string;
  intl237: string;
  display: string;
  detectedOperator: CameroonOperator | null;
}

/**
 * Normalise un numéro camerounais :
 * - Supprime espaces, tirets, parenthèses, '+'
 * - Enlève '237' ou '0' au début
 * - Vérifie exactement 9 chiffres commençant par 6 (6XX XXX XXX)
 */
export function normalizeCameroonPhone(raw: string): NormalizedCameroonPhone {
  let digits = (raw || "").replace(/\D/g, "");

  if (digits.startsWith("00237")) {
    digits = digits.slice(5);
  } else if (digits.startsWith("237") && digits.length > 9) {
    digits = digits.slice(3);
  }

  if (digits.startsWith("0") && digits.length > 9) {
    digits = digits.replace(/^0+/, "");
  }

  const valid = /^6\d{8}$/.test(digits);
  const local9 = digits;
  const intl237 = valid ? `237${local9}` : "";
  const display = valid ? `+237 ${local9}` : "";

  let detectedOperator: CameroonOperator | null = null;
  if (valid) {
    const p2 = Number(local9.slice(0, 2));
    const p3 = Number(local9.slice(0, 3));
    // MTN Cameroun : 67X, 650-654, 680-684
    if (p2 === 67 || (p3 >= 650 && p3 <= 654) || (p3 >= 680 && p3 <= 684)) {
      detectedOperator = "MTN MoMo";
    }
    // Orange Cameroun : 69X, 655-659, 685-689, 640 (préfixe test/orange)
    else if (
      p2 === 69 ||
      p2 === 64 ||
      (p3 >= 655 && p3 <= 659) ||
      (p3 >= 685 && p3 <= 689)
    ) {
      detectedOperator = "Orange Money";
    }
  }

  return { valid, local9, intl237, display, detectedOperator };
}
