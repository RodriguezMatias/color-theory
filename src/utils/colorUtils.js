export const getColorPsychology = (h, s, l) => {
  if (l <= 5) return { name: 'Negro', feel: 'Elegancia, Poder, Sofisticación, Misterio.', industry: 'Lujo, Moda, Tecnología premium.' };
  if (l >= 95) return { name: 'Blanco', feel: 'Pureza, Limpieza, Simplicidad, Paz.', industry: 'Salud, Bodas, Tecnología minimalista.' };
  if (s <= 10) return { name: 'Gris', feel: 'Neutralidad, Equilibrio, Profesionalismo, Calma.', industry: 'Corporativo, Automotriz, Diseño.' };

  if (h >= 345 || h < 15) return { name: 'Rojo', feel: 'Pasión, Energía, Peligro, Urgencia.', industry: 'Comida, Entretenimiento, Deportes.' };
  if (h >= 15 && h < 45) return { name: 'Naranja', feel: 'Creatividad, Juventud, Aventura, Entusiasmo.', industry: 'Arte, Tecnología joven, E-commerce.' };
  if (h >= 45 && h < 75) return { name: 'Amarillo', feel: 'Felicidad, Optimismo, Alerta, Calidez.', industry: 'Viajes, Transporte, Atención infantil.' };
  if (h >= 75 && h < 165) return { name: 'Verde', feel: 'Naturaleza, Crecimiento, Salud, Dinero.', industry: 'Finanzas, Ecología, Salud, Agricultura.' };
  if (h >= 165 && h < 265) return { name: 'Azul', feel: 'Confianza, Calma, Seguridad, Profesionalismo.', industry: 'Bancos, Medicina, Corporativo, Redes Sociales.' };
  if (h >= 265 && h < 315) return { name: 'Violeta', feel: 'Lujo, Realeza, Misterio, Espiritualidad.', industry: 'Belleza, Lujo, Astrología, Creatividad.' };
  if (h >= 315 && h < 345) return { name: 'Rosa', feel: 'Dulzura, Romance, Empatía, Inocencia.', industry: 'Moda, Confitería, Cosmética.' };
  return { name: '', feel: '', industry: '' };
};

export const hexToRgb = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
};

export const rgbToHex = (r, g, b) => {
  const toHex = (c) => {
    const hex = Math.round(c).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const rgbToCmyk = (r, g, b) => {
  let c = 1 - (r / 255);
  let m = 1 - (g / 255);
  let y = 1 - (b / 255);
  let k = Math.min(c, Math.min(m, y));
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  c = (c - k) / (1 - k);
  m = (m - k) / (1 - k);
  y = (y - k) / (1 - k);
  return { 
    c: Math.round(c * 100), 
    m: Math.round(m * 100), 
    y: Math.round(y * 100), 
    k: Math.round(k * 100) 
  };
};

export const rgbToHsl = (r, g, b) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

export const hslToHex = (h, s, l) => {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l; 
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return rgbToHex(r * 255, g * 255, b * 255);
};

export const getLuminance = (r, g, b) => {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

export const getContrastRatio = (l1, l2) => {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

export const simulateColorBlindness = (r, g, b, type) => {
  const linearR = r / 255;
  const linearG = g / 255;
  const linearB = b / 255;
  let outR, outG, outB;

  switch (type) {
    case 'protanopia':
      outR = 0.567 * linearR + 0.433 * linearG + 0.0 * linearB;
      outG = 0.558 * linearR + 0.442 * linearG + 0.0 * linearB;
      outB = 0.0 * linearR + 0.242 * linearG + 0.758 * linearB;
      break;
    case 'deuteranopia':
      outR = 0.625 * linearR + 0.375 * linearG + 0.0 * linearB;
      outG = 0.700 * linearR + 0.300 * linearG + 0.0 * linearB;
      outB = 0.0 * linearR + 0.300 * linearG + 0.700 * linearB;
      break;
    case 'tritanopia':
      outR = 0.950 * linearR + 0.050 * linearG + 0.0 * linearB;
      outG = 0.0 * linearR + 0.433 * linearG + 0.567 * linearB;
      outB = 0.0 * linearR + 0.475 * linearG + 0.525 * linearB;
      break;
    default:
      return { r, g, b };
  }
  return {
    r: Math.min(255, Math.max(0, Math.round(outR * 255))),
    g: Math.min(255, Math.max(0, Math.round(outG * 255))),
    b: Math.min(255, Math.max(0, Math.round(outB * 255)))
  };
};
