export function formatMoney(centavos: number): string {
  return (
    '₱' +
    (centavos / 100).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

/**
 * Parse a money display value into centavos. Accepts a string (`"₱1,234.50"`)
 * or a number — currency inputs render as `<input type="number">`, so Vue's
 * v-model yields a number once edited.
 */
export function parseMoney(display: string | number): number {
  const clean = String(display).replace(/[₱,\s]/g, '');
  const value = parseFloat(clean);

  if (isNaN(value)) {
    return 0;
  }

  return Math.round(value * 100);
}
