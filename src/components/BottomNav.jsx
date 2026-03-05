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
      active: isHome && false, // nunca activo, solo acción
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
              {/* Burbuja de fondo activa */}
              <AnimatePresence>
                {item.active && (
                  <motion.div
                    layoutId="navBubble"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                    style={{
                      position: 'absolute',
                      top: -2, left: '50%',
                      transform: 'translateX(-50%)',
                      width: 44, height: 44,
                      borderRadius: '50%',
                      background: `radial-gradient(circle, rgba(247,103,7,0.14) 0%, rgba(247,103,7,0.05) 100%)`,
                      border: '1px solid rgba(247,103,7,0.18)',
                      zIndex: 0,
                    }}
                  />
                )}
              </AnimatePresence>

              {/* Ícono con rebote al activarse */}
              <motion.div
                animate={item.active ? { y: [-3, 0], scale: [1.2, 1] } : { y: 0, scale: 1 }}
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

              {/* Punto indicador arriba */}
              <AnimatePresence>
                {item.active && (
                  <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    exit={{ scaleX: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    style={{
                      position: 'absolute', top: -8,
                      width: 18, height: 2.5,
                      borderRadius: 2,
                      background: `linear-gradient(90deg, ${COLORS.orange}, ${COLORS.gold})`,
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