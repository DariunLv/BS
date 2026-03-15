// src/components/BottomNav.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IconDiamond, IconShoppingBag, IconHome } from '@tabler/icons-react';
import { COLORS } from '../utils/theme';

export default function BottomNav({ onStoreChange }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isJewelry  = !location.pathname.startsWith('/tienda-general');
  const isGeneral  = location.pathname.startsWith('/tienda-general');
  const isHome     = location.pathname === '/' || location.pathname === '/tienda-general';

  const navItems = [
    {
      id: 'jewelry',
      label: 'Joyería',
      icon: IconDiamond,
      active: isJewelry,
      onClick: () => { onStoreChange('jewelry'); navigate('/'); },
    },
    {
      id: 'home',
      label: 'Inicio',
      icon: IconHome,
      active: isHome && false,
      onClick: () => { navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); },
    },
    {
      id: 'general',
      label: 'Tienda',
      icon: IconShoppingBag,
      active: isGeneral,
      onClick: () => { onStoreChange('general'); navigate('/tienda-general'); },
    },
  ];

  return (
    <div className="store-nav-bottom">
      <div style={{
        display: 'flex', justifyContent: 'space-around',
        alignItems: 'center', maxWidth: 400, margin: '0 auto',
      }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.82 }}
              onClick={item.onClick}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 3,
                padding: '2px 20px',
                position: 'relative',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {/* Ícono */}
              <motion.div
                animate={item.active ? { y: [-3, 0], scale: [1.15, 1] } : { y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                style={{ position: 'relative', zIndex: 1 }}
              >
                <Icon
                  size={22}
                  stroke={item.active ? 2.2 : 1.6}
                  color={item.active ? COLORS.orange : COLORS.textMuted}
                />
              </motion.div>

              {/* Label */}
              <motion.span
                animate={{ color: item.active ? COLORS.orange : COLORS.textMuted }}
                transition={{ duration: 0.2 }}
                style={{
                  fontSize: '0.58rem',
                  fontWeight: item.active ? 700 : 400,
                  fontFamily: '"Outfit", sans-serif',
                  letterSpacing: '0.4px',
                  position: 'relative', zIndex: 1,
                }}
              >
                {item.label}
              </motion.span>

              {/* Línea naranja debajo del label — indica sección activa */}
              <AnimatePresence>
                {item.active && (
                  <motion.div
                    layoutId="navIndicator"
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    exit={{ scaleX: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    style={{
                      position: 'absolute', bottom: -6,
                      width: 24, height: 3,
                      borderRadius: 2,
                      background: `linear-gradient(90deg, ${COLORS.orange}, ${COLORS.gold})`,
                      transformOrigin: 'center',
                    }}
                  />
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}