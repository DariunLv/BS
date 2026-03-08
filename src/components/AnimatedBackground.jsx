// src/components/AnimatedBackground.jsx
import { useEffect, useRef } from 'react';

export default function AnimatedBackground() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width, height, t = 0;

    // Orbes muy suaves — paleta de la marca
    const orbs = [
      { x: 0.10, y: 0.08, r: 0.50, hue: 26,  sat: 90, lit: 70, alpha: 0.07 },
      { x: 0.90, y: 0.15, r: 0.42, hue: 214, sat: 60, lit: 65, alpha: 0.05 },
      { x: 0.55, y: 0.55, r: 0.55, hue: 35,  sat: 85, lit: 72, alpha: 0.06 },
      { x: 0.85, y: 0.75, r: 0.38, hue: 220, sat: 55, lit: 68, alpha: 0.04 },
      { x: 0.20, y: 0.88, r: 0.40, hue: 42,  sat: 80, lit: 74, alpha: 0.05 },
    ];

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    resize();
    window.addEventListener('resize', resize);

    let frameCount = 0;
    const draw = () => {
      frameCount++;
      // Solo redibujar cada 2 frames → 30fps en vez de 60fps (ahorra batería y CPU)
      if (frameCount % 2 !== 0) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      t++;
      ctx.clearRect(0, 0, width, height);

      // Fondo base: blanco cálido
      ctx.fillStyle = '#fefcf9';
      ctx.fillRect(0, 0, width, height);

      // Orbes suavísimos con movimiento casi imperceptible
      orbs.forEach((orb, i) => {
        const ox = orb.x + Math.sin(t * 0.00015 * (i + 1) + i * 1.8) * 0.08;
        const oy = orb.y + Math.cos(t * 0.00012 * (i + 1) + i * 2.3) * 0.06;
        const cx = ox * width;
        const cy = oy * height;
        const r  = orb.r * Math.min(width, height);

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0,   `hsla(${orb.hue}, ${orb.sat}%, ${orb.lit}%, ${orb.alpha})`);
        grad.addColorStop(0.5, `hsla(${orb.hue}, ${orb.sat}%, ${orb.lit}%, ${orb.alpha * 0.3})`);
        grad.addColorStop(1,   `hsla(${orb.hue}, ${orb.sat}%, ${orb.lit}%, 0)`);

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100%', height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}