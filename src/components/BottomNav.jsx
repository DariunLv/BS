// src/components/BottomNav.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { IconDiamond, IconShoppingBag, IconHome } from '@tabler/icons-react';
import { COLORS } from '../utils/theme';

export default function BottomNav({ currentStore, onStoreChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isHome = location.pathname === '/' || location.pathname === '/tienda-general';
  const isJewelry = !location.pathname.startsWith('/tienda-general');

  const navItems = [
    {
      id: 'jewelry',
      label: 'joyería',
      icon: IconDiamond,
      active: isJewelry && isHome,
      onClick: () => { onStoreChange('jewelry'); navigate('/'); },
    },
    {
      id: 'home',
      label: 'Inicio',
      icon: IconHome,
      active: false,
      onClick: () => { navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); },
    },
    {
      id: 'general',
      label: 'Tienda',
      icon: IconShoppingBag,
      active: !isJewelry && isHome,
      onClick: () => { onStoreChange('general'); navigate('/tienda-general'); },
    },
  ];

  return (
    <div className="store-nav-bottom">
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', maxWidth: 400, margin: '0 auto' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.9 }}
              onClick={item.onClick}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                padding: '4px 16px',
                position: 'relative',
              }}
            >
              <Icon
                size={22}
                stroke={1.8}
                color={item.active ? COLORS.orange : COLORS.textMuted}
              />
              <span
                style={{
                  fontSize: '0.6rem',
                  fontWeight: item.active ? 600 : 400,
                  color: item.active ? COLORS.orange : COLORS.textMuted,
                  fontFamily: '"Outfit", sans-serif',
                  letterSpacing: '0.5px',
                }}
              >
                {item.label}
              </span>
              {item.active && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  style={{
                    position: 'absolute',
                    top: -8,
                    width: 20,
                    height: 2,
                    borderRadius: 1,
                    background: COLORS.orange,
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
