// src/components/Header.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { IconChevronLeft, IconShoppingBag } from '@tabler/icons-react';
import { COLORS } from '../utils/theme';
import { useCart } from '../utils/CartContext';
import { cartUnitCount } from '../utils/cart';

export default function Header({ onLogoClick, onBack }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === '/' || location.pathname === '';
  const isSecondStore = location.pathname.startsWith('/tienda-general');
  const isAdmin = location.pathname.startsWith('/admin');

  // Calcula la ruta padre lógica según donde estés
  const parentRoute = (() => {
    if (isSecondStore) return '/tienda-general';
    return '/';
  })();

  const handleBack = () => {
    onBack?.();
    navigate(parentRoute);
  };

  const handleLogoClick = () => {
    // Triple click → admin (lógica manejada en App via onLogoClick)
    onLogoClick?.();
    // Single click → ir al inicio de la tienda actual
    navigate(parentRoute);
  };

  if (isHome || isAdmin) {
    // En home y admin solo se muestra el logo sin botón atrás
    return (
      <motion.header
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderBottom: '1px solid rgba(232,237,245,0.6)',
          padding: '10px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <motion.div
          className="admin-trigger"
          onClick={onLogoClick}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          whileTap={{ scale: 0.97 }}
        >
          <LogoContent isSecondStore={isSecondStore} />
        </motion.div>
        <Lottie />
      </motion.header>
    );
  }

  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderBottom: '1px solid rgba(232,237,245,0.6)',
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Botón atrás */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          whileTap={{ scale: 0.85 }}
          onClick={handleBack}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '6px 4px', display: 'flex', alignItems: 'center',
            color: COLORS.navy, flexShrink: 0,
          }}
        >
          <IconChevronLeft size={26} />
        </motion.button>

        {/* Logo — click va al inicio */}
        <motion.div
          className="admin-trigger"
          onClick={handleLogoClick}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          whileTap={{ scale: 0.97 }}
        >
          <LogoContent isSecondStore={isSecondStore} />
        </motion.div>
      </div>

      <Lottie />
    </motion.header>
  );
}

function LogoContent({ isSecondStore }) {
  return (
    <>
      <motion.img
        src="/logo.png"
        alt="Benito Store"
        style={{ height: 42, width: 'auto', objectFit: 'contain' }}
        onError={(e) => { e.target.style.display = 'none'; }}
        whileHover={{ rotate: [0, -3, 3, 0], transition: { duration: 0.4 } }}
      />
      <div style={{ lineHeight: 1.1 }}>
        <div style={{
          fontFamily: '"Playfair Display", serif', fontWeight: 700,
          fontSize: '1.05rem', color: COLORS.navy, letterSpacing: '0.5px',
        }}>
          BENITO
        </div>
        <div style={{
          fontFamily: '"Outfit", sans-serif', fontSize: '0.52rem', fontWeight: 500,
          color: COLORS.orange, letterSpacing: '3px', textTransform: 'uppercase',
        }}>
          {isSecondStore ? 'TIENDA GENERAL' : 'VIRTUAL STORE'}
        </div>
      </div>
    </>
  );
}

function Lottie() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {!isAdmin && <CartIconButton />}
      <dotlottie-wc
        src="https://lottie.host/06a5cb66-9cf7-405e-a96c-6b0c20036d5b/cBH3wxPQH3.lottie"
        style={{ width: '36px', height: '36px' }}
        autoplay loop
      />
    </div>
  );
}

/** Botón sutil del carrito integrado en el header, junto al sticker. */
function CartIconButton() {
  const { items, setCartOpen } = useCart();
  const count = cartUnitCount(items);
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.06 }}
      onClick={() => setCartOpen(true)}
      style={{
        position: 'relative',
        width: 36, height: 36,
        borderRadius: '50%',
        border: 'none',
        background: 'rgba(26, 39, 68, 0.06)',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: COLORS.navy,
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(26, 39, 68, 0.12)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(26, 39, 68, 0.06)'; }}
      aria-label="Ver carrito"
    >
      <IconShoppingBag size={18} stroke={1.8} />
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 600, damping: 22 }}
            style={{
              position: 'absolute',
              top: -2, right: -2,
              minWidth: 17, height: 17,
              borderRadius: 999,
              background: COLORS.orange,
              color: '#fff',
              fontSize: 9.5,
              fontWeight: 700,
              fontFamily: '"Outfit", sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 2px 4px rgba(247,103,7,0.45)',
              border: '1.5px solid #fff',
              lineHeight: 1,
            }}
          >
            {count > 99 ? '99' : count}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}