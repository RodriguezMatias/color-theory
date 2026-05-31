import React, { useState, useEffect, useRef } from 'react';
import './index.css';

// ==========================================
// COMPONENTES PEDAGÓGICOS
// ==========================================

const Tooltip = ({ text, children }) => (
  <div className="tooltip-container">
    {children}
    <div className="tooltip-text">{text}</div>
  </div>
);

const InfoIcon = ({ text }) => (
  <Tooltip text={text}>
    <span className="info-icon">i</span>
  </Tooltip>
);

const getColorPsychology = (h) => {
  if (h >= 345 || h < 15) return { name: 'Rojo', feel: 'Pasión, Energía, Peligro, Urgencia.', industry: 'Comida, Entretenimiento, Deportes.' };
  if (h >= 15 && h < 45) return { name: 'Naranja', feel: 'Creatividad, Juventud, Aventura, Entusiasmo.', industry: 'Arte, Tecnología joven, E-commerce.' };
  if (h >= 45 && h < 75) return { name: 'Amarillo', feel: 'Felicidad, Optimismo, Alerta, Calidez.', industry: 'Viajes, Transporte, Atención infantil.' };
  if (h >= 75 && h < 165) return { name: 'Verde', feel: 'Naturaleza, Crecimiento, Salud, Dinero.', industry: 'Finanzas, Ecología, Salud, Agricultura.' };
  if (h >= 165 && h < 265) return { name: 'Azul', feel: 'Confianza, Calma, Seguridad, Profesionalismo.', industry: 'Bancos, Medicina, Corporativo, Redes Sociales.' };
  if (h >= 265 && h < 315) return { name: 'Violeta', feel: 'Lujo, Realeza, Misterio, Espiritualidad.', industry: 'Belleza, Lujo, Astrología, Creatividad.' };
  if (h >= 315 && h < 345) return { name: 'Rosa', feel: 'Dulzura, Romance, Empatía, Inocencia.', industry: 'Moda, Confitería, Cosmética.' };
  return { name: '', feel: '', industry: '' };
};

// ==========================================
// UTILIDADES DE CONVERSIÓN Y CÁLCULO
// ==========================================

const hexToRgb = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
};

const rgbToHex = (r, g, b) => {
  const toHex = (c) => {
    const hex = Math.round(c).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const rgbToCmyk = (r, g, b) => {
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

const rgbToHsl = (r, g, b) => {
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

const hslToHex = (h, s, l) => {
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

const getLuminance = (r, g, b) => {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

const getContrastRatio = (l1, l2) => {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

const simulateColorBlindness = (r, g, b, type) => {
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

// ==========================================
// COMPONENTES DE INTERFAZ
// ==========================================

const ColorDetailsSmall = ({ hex, title, isBase, compact = false }) => {
  const rgb = hexToRgb(hex);
  const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '0.5rem', 
      background: isBase ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0,0,0,0.2)', 
      padding: '0.6rem', 
      borderRadius: '8px', 
      border: isBase ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent'
    }}>
      <div style={{ width: compact ? '24px' : '32px', height: compact ? '24px' : '32px', backgroundColor: hex, borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', flexShrink: 0 }}></div>
      <div style={{ display: 'flex', flexDirection: 'column', fontSize: compact ? '0.7rem' : '0.75rem', fontFamily: 'monospace', lineHeight: '1.3' }}>
        {title && <span style={{color:'#f8fafc', fontWeight:'bold', fontFamily:'Inter, sans-serif', fontSize:'0.75rem', marginBottom:'2px'}}>{title}</span>}
        <span style={{color:'#cbd5e1'}}>{hex.toUpperCase()}</span>
        {!compact && <span style={{color:'#94a3b8'}}>rgb({rgb.r},{rgb.g},{rgb.b})</span>}
        {!compact && <span style={{color:'#64748b'}}>C{cmyk.c} M{cmyk.m} Y{cmyk.y} K{cmyk.k}</span>}
      </div>
    </div>
  );
};

function InteractiveWheel() {
  const [hsl, setHsl] = useState({ h: 0, s: 100, l: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [activeGeometry, setActiveGeometry] = useState('none');
  const wheelRef = useRef(null);
  
  const currentHex = hslToHex(hsl.h, hsl.s, hsl.l);
  const currentRgb = hexToRgb(currentHex);
  const currentCmyk = rgbToCmyk(currentRgb.r, currentRgb.g, currentRgb.b);
  const psychology = getColorPsychology(hsl.h);

  const handleHexChange = (hex) => {
    const rgb = hexToRgb(hex);
    const newHsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    setHsl(newHsl);
  };

  const handleWheelInteraction = (e) => {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    let angle = (Math.atan2(y, x) * 180) / Math.PI + 90;
    if (angle < 0) angle += 360;

    const distance = Math.sqrt(x*x + y*y);
    const radius = rect.width / 2;
    let l = 100 - (distance / radius) * 100;
    l = Math.max(0, Math.min(100, Math.round(l)));

    setHsl(prev => ({ ...prev, h: Math.round(angle), l }));
  };

  const onMouseDown = (e) => {
    setIsDragging(true);
    handleWheelInteraction(e);
  };

  const onMouseMove = (e) => {
    if (isDragging) {
      handleWheelInteraction(e);
    }
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [isDragging]);

  // Coordenadas matemáticas para SVG Geométrico
  const cx = 150;
  const cy = 150;
  const markerRadius = 150 * ((100 - hsl.l) / 100);
  const markerRad = (hsl.h - 90) * Math.PI / 180;
  const markerX = cx + markerRadius * Math.cos(markerRad);
  const markerY = cy + markerRadius * Math.sin(markerRad);

  // Tríadas coordenadas
  const tri1Rad = (hsl.h + 120 - 90) * Math.PI / 180;
  const tri1X = cx + markerRadius * Math.cos(tri1Rad);
  const tri1Y = cy + markerRadius * Math.sin(tri1Rad);
  const tri2Rad = (hsl.h + 240 - 90) * Math.PI / 180;
  const tri2X = cx + markerRadius * Math.cos(tri2Rad);
  const tri2Y = cy + markerRadius * Math.sin(tri2Rad);

  // Análogos coordenadas
  const ana1Rad = (hsl.h + 30 - 90) * Math.PI / 180;
  const ana1X = cx + markerRadius * Math.cos(ana1Rad);
  const ana1Y = cy + markerRadius * Math.sin(ana1Rad);
  const ana2Rad = (hsl.h - 30 - 90) * Math.PI / 180;
  const ana2X = cx + markerRadius * Math.cos(ana2Rad);
  const ana2Y = cy + markerRadius * Math.sin(ana2Rad);

  // Funciones de armonías y variaciones
  const getComplementaryHex = (h, s, l) => hslToHex((h + 180) % 360, s, l);
  const getAnalogousHex = (h, s, l) => [hslToHex((h + 330) % 360, s, l), hslToHex((h + 30) % 360, s, l)];
  const getTriadicHex = (h, s, l) => [hslToHex((h + 120) % 360, s, l), hslToHex((h + 240) % 360, s, l)];
  const getMonochromaticHex = (h, s, l) => [
    hslToHex(h, s, Math.max(5, l - 40)),
    hslToHex(h, s, Math.max(15, l - 20)),
    currentHex,
    hslToHex(h, s, Math.min(85, l + 20)),
    hslToHex(h, s, Math.min(95, l + 40))
  ];

  // Contrast Calculations
  const lumColor = getLuminance(currentRgb.r, currentRgb.g, currentRgb.b);
  const contrastWhite = getContrastRatio(lumColor, getLuminance(255, 255, 255));
  const contrastBlack = getContrastRatio(lumColor, getLuminance(0, 0, 0));

  // Color Blindness Simulations
  const simProtanopia = simulateColorBlindness(currentRgb.r, currentRgb.g, currentRgb.b, 'protanopia');
  const simDeuteranopia = simulateColorBlindness(currentRgb.r, currentRgb.g, currentRgb.b, 'deuteranopia');
  const simTritanopia = simulateColorBlindness(currentRgb.r, currentRgb.g, currentRgb.b, 'tritanopia');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Selector Flotante Inferior Izquierdo */}
      <div style={{
        position: 'fixed',
        bottom: '30px',
        left: '30px',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        background: 'rgba(30, 41, 59, 0.9)',
        padding: '1rem 1.5rem',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        animation: 'fadeInUp 0.5s ease-out'
      }}>
        <label htmlFor="floating-color" style={{ fontWeight: '600', fontSize: '1.1rem', color: '#f8fafc' }}>Color Libre:</label>
        <input 
          type="color" 
          id="floating-color" 
          value={currentHex} 
          onChange={(e) => handleHexChange(e.target.value)}
          style={{
            width: '45px',
            height: '45px',
            padding: 0,
            border: '2px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            cursor: 'pointer',
            background: 'transparent'
          }}
        />
      </div>

      {/* DISEÑO EN 3 COLUMNAS PARA APROVECHAR MEJOR EL ESPACIO */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        
        {/* COLUMNA 1: Rueda y Controles */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <div 
            ref={wheelRef}
            onMouseDown={onMouseDown}
            style={{
              width: '300px', height: '300px', borderRadius: '50%',
              background: 'conic-gradient(from 0deg, red 0deg, yellow 60deg, lime 120deg, aqua 180deg, blue 240deg, magenta 300deg, red 360deg)',
              position: 'relative', cursor: 'crosshair',
              boxShadow: '0 0 40px rgba(255,255,255,0.1)'
            }}
          >
            {/* Overlay de Saturación */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              borderRadius: '50%', background: '#808080',
              opacity: 1 - hsl.s / 100,
              pointerEvents: 'none'
            }}></div>
            
            {/* Overlay de Luminosidad */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              borderRadius: '50%',
              background: 'radial-gradient(circle closest-side, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,1) 100%)',
              pointerEvents: 'none'
            }}></div>
            
            {/* Capa de Geometría Educativa (SVG) */}
            <svg width="300" height="300" viewBox="0 0 300 300" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 5 }}>
              {activeGeometry === 'complementary' && (
                <>
                  <line x1={markerX} y1={markerY} x2={cx - (markerX - cx)} y2={cy - (markerY - cy)} stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeDasharray="5 5" />
                  <circle cx={cx - (markerX - cx)} cy={cy - (markerY - cy)} r={6} fill="white" stroke="rgba(0,0,0,0.5)" strokeWidth="2" />
                </>
              )}
              {activeGeometry === 'triadic' && (
                <>
                  <polygon points={`${markerX},${markerY} ${tri1X},${tri1Y} ${tri2X},${tri2Y}`} fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeDasharray="5 5" />
                  <circle cx={tri1X} cy={tri1Y} r={6} fill="white" stroke="rgba(0,0,0,0.5)" strokeWidth="2" />
                  <circle cx={tri2X} cy={tri2Y} r={6} fill="white" stroke="rgba(0,0,0,0.5)" strokeWidth="2" />
                </>
              )}
              {activeGeometry === 'analogous' && (
                <>
                  <path d={`M ${cx} ${cy} L ${ana1X} ${ana1Y} A ${markerRadius} ${markerRadius} 0 0 0 ${ana2X} ${ana2Y} Z`} fill="rgba(255,255,255,0.15)" stroke="none" />
                  <line x1={cx} y1={cy} x2={markerX} y2={markerY} stroke="rgba(255,255,255,0.8)" strokeWidth="2" />
                  <line x1={cx} y1={cy} x2={ana1X} y2={ana1Y} stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1={cx} y1={cy} x2={ana2X} y2={ana2Y} stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeDasharray="4 4" />
                  <circle cx={ana1X} cy={ana1Y} r={6} fill="white" stroke="rgba(0,0,0,0.5)" strokeWidth="2" />
                  <circle cx={ana2X} cy={ana2Y} r={6} fill="white" stroke="rgba(0,0,0,0.5)" strokeWidth="2" />
                </>
              )}
            </svg>

            {/* Marker Principal */}
            <div style={{
              position: 'absolute', left: markerX - 10, top: markerY - 10,
              width: '20px', height: '20px', borderRadius: '50%', background: currentHex,
              border: '2px solid white', boxShadow: '0 0 8px rgba(0,0,0,0.8)',
              pointerEvents: 'none', zIndex: 10, transition: isDragging ? 'none' : 'all 0.1s ease-out'
            }}></div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {['none', 'complementary', 'triadic', 'analogous'].map(mode => (
              <button key={mode} onClick={() => setActiveGeometry(mode)} style={{
                padding: '0.4rem 0.8rem', borderRadius: '20px',
                border: '1px solid ' + (activeGeometry === mode ? '#3b82f6' : 'rgba(255,255,255,0.2)'),
                background: activeGeometry === mode ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                color: '#f8fafc', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s'
              }}>
                {mode === 'none' ? 'Ocultar Geometría' : mode === 'complementary' ? 'Complementario' : mode === 'triadic' ? 'Tríada' : 'Análogos'}
              </button>
            ))}
          </div>
          
          <div style={{ width: '100%', maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '1.5rem', background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 'bold' }}>
                <span style={{display: 'flex', alignItems: 'center'}}>Tono <InfoIcon text="Es la posición del color en el arcoíris (0-360°)." /></span>
                <span>{hsl.h}°</span>
              </div>
              <input type="range" min="0" max="360" value={hsl.h} onChange={(e) => setHsl({...hsl, h: parseInt(e.target.value)})} style={{ width: '100%', cursor: 'pointer' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 'bold' }}>
                <span style={{display: 'flex', alignItems: 'center'}}>Saturación <InfoIcon text="Pureza del color (0-100%)." /></span>
                <span>{hsl.s}%</span>
              </div>
              <input type="range" min="0" max="100" value={hsl.s} onChange={(e) => setHsl({...hsl, s: parseInt(e.target.value)})} style={{ width: '100%', cursor: 'pointer' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 'bold' }}>
                <span style={{display: 'flex', alignItems: 'center'}}>Brillo/Luz <InfoIcon text="Blanco o negro en el color (0-100%)." /></span>
                <span>{hsl.l}%</span>
              </div>
              <input type="range" min="0" max="100" value={hsl.l} onChange={(e) => setHsl({...hsl, l: parseInt(e.target.value)})} style={{ width: '100%', cursor: 'pointer' }} />
            </div>
          </div>
        </div>

        {/* COLUMNA 2: Info Base, Psicología y Armonías */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="card">
            <h3 style={{textAlign: 'center', marginBottom: '1rem'}}>Color Base</h3>
            <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
              <div className="color-swatch" style={{ width: '60px', height: '60px', marginBottom: 0, backgroundColor: currentHex, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)' }}></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                <div><strong style={{color:'#94a3b8'}}>HEX:</strong> {currentHex.toUpperCase()}</div>
                <div><strong style={{color:'#94a3b8'}}>RGB:</strong> {currentRgb.r}, {currentRgb.g}, {currentRgb.b}</div>
                <div><strong style={{color:'#94a3b8'}}>CMYK:</strong> {currentCmyk.c}%, {currentCmyk.m}%, {currentCmyk.y}%, {currentCmyk.k}%</div>
              </div>
            </div>
            
            <div style={{ marginTop: '1rem', padding: '0.8rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', color: '#60a5fa', fontSize: '0.9rem' }}>
                Psicología ({psychology.name}) <InfoIcon text="Asociaciones emocionales." />
              </h4>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                <strong style={{color:'#f8fafc'}}>Emoción:</strong> {psychology.feel}<br/>
                <strong style={{color:'#f8fafc'}}>Uso:</strong> {psychology.industry}
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{marginBottom: '1rem', fontSize: '1.1rem'}}>Armonías & Escalas</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
              <ColorDetailsSmall hex={currentHex} title="Base" isBase={true} />
              <ColorDetailsSmall hex={getComplementaryHex(hsl.h, hsl.s, hsl.l)} title="Complementario" />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
              <ColorDetailsSmall hex={getTriadicHex(hsl.h, hsl.s, hsl.l)[0]} title="Tríada 1" />
              <ColorDetailsSmall hex={getTriadicHex(hsl.h, hsl.s, hsl.l)[1]} title="Tríada 2" />
            </div>

            <p style={{marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'bold'}}>Escala Monocromática:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {getMonochromaticHex(hsl.h, hsl.s, hsl.l).map((mHex, i) => (
                <ColorDetailsSmall key={i} hex={mHex} isBase={i===2} compact={true} />
              ))}
            </div>
          </div>

        </div>

        {/* COLUMNA 3: Accesibilidad y Daltonismo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="card">
            <h3 style={{marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem'}}>
              Accesibilidad WCAG <InfoIcon text="Contraste mayor a 4.5:1." />
            </h3>
            <p style={{fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem'}}>
              Mockup de interfaz para comprobar la legibilidad.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Mockup Blanco */}
              <div style={{ backgroundColor: currentHex, color: '#FFFFFF', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)'}}>
                <h4 style={{fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.2rem'}}>Texto Blanco</h4>
                <p style={{fontSize: '0.75rem', lineHeight: '1.4', marginBottom: '0.8rem', opacity: 0.9}}>Ejemplo de legibilidad en UI.</p>
                
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '0.5rem'}}>
                  <span style={{fontSize: '0.75rem', fontWeight: 'bold'}}>Ratio: {contrastWhite.toFixed(2)}</span>
                  <span style={{ padding: '0.2rem 0.4rem', borderRadius: '4px', backgroundColor: contrastWhite >= 4.5 ? '#22c55e' : '#ef4444', color: '#fff', fontWeight: 'bold', fontSize: '0.65rem' }}>
                    {contrastWhite >= 4.5 ? '✓ APROBADO' : '✗ FALLA'}
                  </span>
                </div>
              </div>
              
              {/* Mockup Negro */}
              <div style={{ backgroundColor: currentHex, color: '#000000', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.2)' }}>
                <h4 style={{fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.2rem'}}>Texto Negro</h4>
                <p style={{fontSize: '0.75rem', lineHeight: '1.4', marginBottom: '0.8rem', opacity: 0.9}}>Ejemplo de legibilidad en UI.</p>
                
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(0,0,0,0.2)', paddingTop: '0.5rem'}}>
                  <span style={{fontSize: '0.75rem', fontWeight: 'bold'}}>Ratio: {contrastBlack.toFixed(2)}</span>
                  <span style={{ padding: '0.2rem 0.4rem', borderRadius: '4px', backgroundColor: contrastBlack >= 4.5 ? '#22c55e' : '#ef4444', color: '#fff', fontWeight: 'bold', fontSize: '0.65rem' }}>
                    {contrastBlack >= 4.5 ? '✓ APROBADO' : '✗ FALLA'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem'}}>
              Daltonismo <InfoIcon text="Simulación de pérdida de conos oculares." />
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.8rem' }}>
              {[
                { name: 'Visión Normal', hex: currentHex, desc: 'Percepción estándar.' },
                { name: 'Protanopía', hex: rgbToHex(simProtanopia.r, simProtanopia.g, simProtanopia.b), desc: 'Dificultad con Rojos.' },
                { name: 'Deuteranopía', hex: rgbToHex(simDeuteranopia.r, simDeuteranopia.g, simDeuteranopia.b), desc: 'Dificultad con Verdes.' },
                { name: 'Tritanopía', hex: rgbToHex(simTritanopia.r, simTritanopia.g, simTritanopia.b), desc: 'Dificultad con Azules.' }
              ].map((sim, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'rgba(0,0,0,0.2)', padding: '0.6rem', borderRadius: '8px' }}>
                  <div style={{ width: '40px', height: '40px', backgroundColor: sim.hex, borderRadius: '50%', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }}></div>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{sim.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{sim.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

function App() {
  return (
    <div className="container">
      <header>
        <h1>Laboratorio de Color Avanzado</h1>
        <p>Herramienta pedagógica para entender la composición física, matemática y psicológica del color.</p>
      </header>

      <section className="section">
        <InteractiveWheel />
      </section>
      
      <footer style={{textAlign: 'center', padding: '2rem 0', color: '#64748b', borderTop: '1px solid var(--border-color)', marginTop: '4rem'}}>
        <p>Aplicación interactiva diseñada para la enseñanza visual profunda.</p>
      </footer>
    </div>
  );
}

export default App;
