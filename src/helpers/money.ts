export function formatMoney(centavos: number): string {
  return (
    '₱' +
    (centavos / 100).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function parseMoney(display: string): number {
  const clean = display.replace(/[₱,\s]/g, '');
  const value = parseFloat(clean);

  if (isNaN(value)) {
    return 0;
  }

  return Math.round(value * 100);
}
