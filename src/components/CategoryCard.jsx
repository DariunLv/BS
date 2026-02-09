// src/components/CategoryCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { IconChevronRight } from '@tabler/icons-react';
import { COLORS } from '../utils/theme';

export default function CategoryCard({ category, onClick, index = 0, productCount = 0 }) {
  const hasImage = !!category.image;

  return (
    <motion.div
      className="category-card-wrapper"
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.6, delay: index * 0.12, type: 'spring', stiffness: 100 }}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
        background: COLORS.white,
        border: `1px solid ${COLORS.borderLight}`,
        boxShadow: '0 4px 16px rgba(26, 39, 68, 0.05)',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: '100%',
          height: 200,
          position: 'relative',
          overflow: 'hidden',
          background: hasImage ? '#111' : `linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.navyLight} 100%)`,
        }}
      >
        {/* Background Photo - CLEAR and visible */}
        {hasImage && (
          <motion.img
            src={category.image}
            alt={category.name}
            initial={{ scale: 1.05 }}
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              position: 'absolute',
              inset: 0,
              opacity: 0.92,
            }}
          />
        )}

        {/* No-image placeholder */}
        {!hasImage && (
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.08,
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)`,
            backgroundSize: '16px 16px',
          }} />
        )}

        {/* Only a subtle bottom gradient so text is readable - NO heavy dark overlay */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: hasImage
            ? 'linear-gradient(0deg, rgba(26,39,68,0.75) 0%, rgba(26,39,68,0.15) 45%, transparent 100%)'
            : 'linear-gradient(0deg, rgba(26,39,68,0.6) 0%, transparent 50%)',
        }} />

        {/* Category info at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 4,
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <motion.h3
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 + 0.2 }}
              style={{
                fontFamily: '"Playfair Display", serif',
                fontSize: '1.15rem',
                fontWeight: 600,
                color: COLORS.white,
                marginBottom: 3,
                textShadow: '0 1px 6px rgba(0,0,0,0.4)',
              }}
            >
              {category.name}
            </motion.h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 24, height: 1.5,
                background: 'linear-gradient(90deg, #f76707, transparent)',
                borderRadius: 1,
              }} />
              <span
                style={{
                  fontFamily: '"Outfit", sans-serif',
                  fontSize: '0.62rem',
                  color: 'rgba(255,255,255,0.75)',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  textShadow: '0 1px 4px rgba(0,0,0,0.3)',
                }}
              >
                {productCount} {productCount === 1 ? 'producto' : 'productos'}
              </span>
            </div>
          </div>

          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(247,103,7,0.25)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(247,103,7,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconChevronRight size={16} color={COLORS.orange} />
          </motion.div>
        </div>

        {/* Small decorative corner accents */}
        <div style={{
          position: 'absolute', top: 12, right: 12, zIndex: 3,
          width: 20, height: 20,
          borderTop: '2px solid rgba(247,103,7,0.3)',
          borderRight: '2px solid rgba(247,103,7,0.3)',
          borderRadius: '0 5px 0 0',
        }} />
        <div style={{
          position: 'absolute', top: 12, left: 12, zIndex: 3,
          width: 20, height: 20,
          borderTop: '2px solid rgba(247,103,7,0.3)',
          borderLeft: '2px solid rgba(247,103,7,0.3)',
          borderRadius: '5px 0 0 0',
        }} />
      </div>
    </motion.div>
  );
}
