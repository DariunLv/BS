// src/components/FloatingHearts.jsx
import { useEffect, useRef } from 'react';

export default function FloatingHearts({ count = 12, opacity = 0.06 }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width, height;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    resize();
    window.addEventListener('resize', resize);

    const hearts = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: height + Math.random() * 200,
      size: 8 + Math.random() * 16,
      speed: 0.3 + Math.random() * 0.6,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.01 + Math.random() * 0.02,
      wobbleAmount: 20 + Math.random() * 40,
      alpha: 0.3 + Math.random() * 0.7,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.01,
      color: Math.random() > 0.5 ? '#f76707' : '#d4a574',
    }));

    const drawHeart = (cx, cy, size, rotation, color, alpha) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      ctx.globalAlpha = alpha * opacity;
      ctx.beginPath();
      const s = size * 0.5;
      ctx.moveTo(0, s * 0.4);
      ctx.bezierCurveTo(-s, -s * 0.4, -s * 2, s * 0.6, 0, s * 2);
      ctx.bezierCurveTo(s * 2, s * 0.6, s, -s * 0.4, 0, s * 0.4);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      hearts.forEach((h) => {
        h.y -= h.speed;
        h.wobble += h.wobbleSpeed;
        h.rotation += h.rotSpeed;
        const wx = h.x + Math.sin(h.wobble) * h.wobbleAmount;

        if (h.y < -50) {
          h.y = height + 50;
          h.x = Math.random() * width;
        }

        drawHeart(wx, h.y, h.size, h.rotation, h.color, h.alpha);
      });
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [count, opacity]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
