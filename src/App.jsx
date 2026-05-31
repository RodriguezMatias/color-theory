import React, { useState, useEffect, useRef } from 'react';
import { getColorPsychology, hexToRgb, rgbToHex, rgbToCmyk, rgbToHsl, hslToHex, getLuminance, getContrastRatio, simulateColorBlindness } from './utils/colorUtils';
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
  const psychology = getColorPsychology(hsl.h, hsl.s, hsl.l);

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
    
    // Ahora mapeamos la distancia al centro hacia la Saturación (0 al centro, 100 al borde)
    let s = (distance / radius) * 100;
    s = Math.max(0, Math.min(100, Math.round(s)));

    setHsl(prev => ({ ...prev, h: Math.round(angle), s }));
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
  // El radio del marcador ahora depende de la SATURACIÓN
  const markerRadius = 150 * (hsl.s / 100);
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
            {/* Capa de Saturación (Radial): Centro Gris (S=0), Borde Transparente (S=100) */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              borderRadius: '50%',
              background: 'radial-gradient(circle closest-side, #808080 0%, transparent 100%)',
              pointerEvents: 'none'
            }}></div>
            
            {/* Capa de Luminosidad (Sólida): Controlada por el slider */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              borderRadius: '50%',
              background: hsl.l > 50 ? 'white' : 'black',
              opacity: Math.abs(hsl.l - 50) / 50,
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(59, 130, 246, 0.15)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.4)', marginTop: '0.5rem', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-10px', right: '15px', background: '#3b82f6', color: 'white', fontSize: '0.65rem', padding: '0.1rem 0.5rem', borderRadius: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Global</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#f8fafc', fontWeight: 'bold' }}>
                <span style={{display: 'flex', alignItems: 'center'}}>Brillo / Luz <InfoIcon text="Controla la luz de toda la rueda. 50% = Colores puros. 100% = Blanco. 0% = Negro." /></span>
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
      
      <footer style={{textAlign: 'center', padding: '2rem 0', color: '#64748b', borderTop: '1px solid var(--border-color)', marginTop: '4rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center'}}>
        <p>Aplicación interactiva diseñada para la enseñanza visual profunda de la Teoría del Color.</p>
        <a 
          href="https://github.com/RodriguezMatias/color-theory" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.6rem 1.2rem', background: 'rgba(255,255,255,0.05)', 
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
            color: '#cbd5e1', textDecoration: 'none', fontWeight: 'bold',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#cbd5e1'; }}
        >
          <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
          </svg>
          Sugerencias y Mejoras en GitHub
        </a>
      </footer>
    </div>
  );
}

export default App;
