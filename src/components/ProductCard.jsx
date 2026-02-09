// src/components/ProductCard.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { IconDiamond } from '@tabler/icons-react';
import { COLORS } from '../utils/theme';
import ProductModal from './ProductModal';

export default function ProductCard({ product, index = 0, showOfferTag = false }) {
  const [modalOpen, setModalOpen] = useState(false);
  const mainImage = product.images?.[0] || '';

  return (
    <>
      <motion.div
        className="product-card"
        initial={{ opacity: 0, y: 40, scale: 0.92 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{
          duration: 0.6,
          delay: index * 0.07,
          type: 'spring',
          stiffness: 80,
          damping: 15,
        }}
        whileHover={{
          y: -8,
          boxShadow: '0 24px 48px rgba(26, 39, 68, 0.14)',
          transition: { duration: 0.3 },
        }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setModalOpen(true)}
        style={{
          background: COLORS.white,
          borderRadius: 16,
          overflow: 'hidden',
          border: `1px solid ${COLORS.borderLight}`,
          position: 'relative',
        }}
      >
        {/* Sold Out Overlay */}
        {product.soldOut && (
          <motion.div
            className="sold-out-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              className="sold-out-badge"
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: -5 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              AGOTADO
            </motion.div>
          </motion.div>
        )}

        {/* Offer Tag */}
        {showOfferTag && !product.soldOut && (
          <motion.div
            className="offer-tag"
            initial={{ x: -20, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.07 + 0.3, type: 'spring' }}
          >
            Oferta
          </motion.div>
        )}

        {/* Image */}
        <div className="product-image-container">
          {mainImage ? (
            <motion.img
              src={mainImage}
              alt={product.title}
              loading="lazy"
              style={{ display: 'block' }}
              whileHover={{ scale: 1.08 }}
              transition={{ duration: 0.6 }}
            />
          ) : (
            <div className="no-image-placeholder">
              <IconDiamond size={32} color={COLORS.borderLight} />
              <span style={{ fontSize: '0.7rem' }}>Sin imagen</span>
            </div>
          )}

          {/* Subtle shine overlay on hover */}
          <div className="product-shine-overlay" />
        </div>

        {/* Info */}
        <div style={{ padding: '12px 14px 14px' }}>
          <h3 style={{
            fontFamily: '"Playfair Display", serif', fontSize: '0.85rem',
            fontWeight: 600, color: COLORS.navy, marginBottom: 4, lineHeight: 1.3,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {product.title || 'Sin titulo'}
          </h3>

          {product.material && (
            <p style={{
              fontFamily: '"Outfit", sans-serif', fontSize: '0.62rem',
              color: COLORS.textMuted, marginBottom: 6, letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}>
              {product.material}{product.plating ? ` / ${product.plating}` : ''}
            </p>
          )}

          <div className="price-tag" style={{ fontSize: '1rem', display: 'flex', alignItems: 'baseline', gap: 2 }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 400 }}>S/.</span>
            {product.price || '0.00'}
          </div>
        </div>

        {/* Decorative bottom border */}
        <div style={{
          position: 'absolute', bottom: 0, left: '10%', right: '10%',
          height: 2, background: `linear-gradient(90deg, transparent, ${COLORS.orange}30, transparent)`,
          borderRadius: 1,
        }} />
      </motion.div>

      <ProductModal product={product} open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
