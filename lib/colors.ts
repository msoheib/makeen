export const addAlpha = (color: string, alpha: number = 0.125): string => {
  try {
    if (!color) return `rgba(0,0,0,${alpha})`;
    const trimmed = color.trim();

    // rgba(r,g,b,a)
    if (trimmed.startsWith('rgba')) {
      const parts = trimmed.replace(/^rgba\(|\)$/g, '').split(',').map(p => p.trim());
      const r = parseInt(parts[0], 10) || 0;
      const g = parseInt(parts[1], 10) || 0;
      const b = parseInt(parts[2], 10) || 0;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // rgb(r,g,b)
    if (trimmed.startsWith('rgb')) {
      const parts = trimmed.replace(/^rgb\(|\)$/g, '').split(',').map(p => p.trim());
      const r = parseInt(parts[0], 10) || 0;
      const g = parseInt(parts[1], 10) || 0;
      const b = parseInt(parts[2], 10) || 0;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // #RRGGBB or #RGB
    if (trimmed[0] === '#') {
      let hex = trimmed.slice(1);
      if (hex.length === 3) {
        hex = hex.split('').map((c) => c + c).join('');
      }
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Fallback: return as rgba with alpha 12.5% if unknown format
    return `rgba(0, 0, 0, ${alpha})`;
  } catch {
    return `rgba(0, 0, 0, ${alpha})`;
  }
};


