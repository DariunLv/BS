// src/components/SparkleTrail.jsx
import { useEffect, useRef } from 'react';

export default function SparkleTrail({ color = '#f76707', size = 4, density = 0.3 }) {
  const canvasRef = useRef(null);
  const sparksRef = useRef([]);
  const animRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999, lastX: -9999, lastY: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMove = (e) => {
      mouseRef.current.lastX = mouseRef.current.x;
      mouseRef.current.lastY = mouseRef.current.y;
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;

      const dx = mouseRef.current.x - mouseRef.current.lastX;
      const dy = mouseRef.current.y - mouseRef.current.lastY;
      const speed = Math.sqrt(dx * dx + dy * dy);

      if (speed > 2 && Math.random() < density) {
        const count = Math.min(3, Math.floor(speed / 10) + 1);
        for (let i = 0; i < count; i++) {
          sparksRef.current.push({
            x: mouseRef.current.x + (Math.random() - 0.5) * 10,
            y: mouseRef.current.y + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 2,
            vy: -Math.random() * 2 - 0.5,
            life: 1,
            decay: 0.015 + Math.random() * 0.02,
            size: size * (0.5 + Math.random() * 0.5),
            color: Math.random() > 0.4 ? color : '#d4a574',
            type: Math.random() > 0.6 ? 'star' : 'circle',
          });
        }
      }
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', (e) => {
      handleMove({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
    });

    const drawStar = (cx, cy, r, alpha, clr) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = clr;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        const outerX = cx + Math.cos(angle) * r;
        const outerY = cy + Math.sin(angle) * r;
        const innerAngle = angle + Math.PI / 4;
        const innerX = cx + Math.cos(innerAngle) * r * 0.35;
        const innerY = cy + Math.sin(innerAngle) * r * 0.35;
        if (i === 0) ctx.moveTo(outerX, outerY);
        else ctx.lineTo(outerX, outerY);
        ctx.lineTo(innerX, innerY);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      sparksRef.current = sparksRef.current.filter((s) => {
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.03; // gravity
        s.life -= s.decay;
        s.vx *= 0.99;

        if (s.life <= 0) return false;

        const alpha = s.life * 0.6;
        const currentSize = s.size * s.life;

        if (s.type === 'star') {
          drawStar(s.x, s.y, currentSize, alpha, s.color);
        } else {
          ctx.beginPath();
          ctx.arc(s.x, s.y, currentSize, 0, Math.PI * 2);
          ctx.fillStyle = s.color;
          ctx.globalAlpha = alpha;
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        return true;
      });

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMove);
    };
  }, [color, size, density]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        pointerEvents: 'none',
      }}
    />
  );
}
