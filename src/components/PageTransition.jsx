// src/components/PageTransition.jsx
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const variants = {
  // Catálogo (home) → siempre fade simple
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit:    { opacity: 0 },
  },
  // Navegando hacia adentro (catálogo → categoría)
  slideLeft: {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit:    { opacity: 0, x: -30 },
  },
  // Volviendo atrás
  slideRight: {
    initial: { opacity: 0, x: -40 },
    animate: { opacity: 1, x: 0 },
    exit:    { opacity: 0, x: 30 },
  },
};

export default function PageTransition({ children, direction = 'fade' }) {
  const v = variants[direction] || variants.fade;
  return (
    <motion.div
      initial={v.initial}
      animate={v.animate}
      exit={v.exit}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      style={{ width: '100%' }}
    >
      {children}
    </motion.div>
  );
}