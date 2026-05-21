const PALETTE = [
  { bg: 'bg-cerulean', text: 'text-white' },
  { bg: 'bg-strong-amber', text: 'text-white' },
  { bg: 'bg-blaze-red', text: 'text-white' },
  { bg: 'bg-dark-green-turquoise', text: 'text-white' },
  { bg: 'bg-casual-navy', text: 'text-white' },
  { bg: 'bg-bondi-blue', text: 'text-white' },
];

function hashStr(s: string): number {
  let h = 0;

  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }

  return h;
}

export function avatarColor(seed: string): { bg: string; text: string } {
  if (!seed) {
    return PALETTE[0]!;
  }

  return PALETTE[hashStr(seed) % PALETTE.length]!;
}

export function initials(name: string | null | undefined, max = 2): string {
  if (!name) {
    return '—';
  }

  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, max);

  return parts.map((p) => p.charAt(0).toUpperCase()).join('') || name.charAt(0).toUpperCase();
}
