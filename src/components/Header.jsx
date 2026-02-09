// src/components/Header.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { IconChevronLeft } from '@tabler/icons-react';
import { COLORS } from '../utils/theme';

export default function Header({ onLogoClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isSecondStore = location.pathname.startsWith('/tienda-general');

  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderBottom: `1px solid rgba(232,237,245,0.6)`,
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {!isHome && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            onClick={() => navigate(-1)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 4, display: 'flex', alignItems: 'center', color: COLORS.navy,
            }}
          >
            <IconChevronLeft size={24} />
          </motion.button>
        )}

        <motion.div
          className="admin-trigger"
          onClick={onLogoClick}
          style={{ display: 'flex', alignItems: 'center', gap: 10 }}
          whileTap={{ scale: 0.97 }}
        >
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
        </motion.div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <dotlottie-wc
          src="https://lottie.host/06a5cb66-9cf7-405e-a96c-6b0c20036d5b/cBH3wxPQH3.lottie"
          style={{ width: '36px', height: '36px' }}
          autoplay loop
        />
      </div>
    </motion.header>
  );
}
