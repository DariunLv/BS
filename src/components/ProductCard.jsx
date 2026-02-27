// src/components/ProductCard.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { IconDiamond, IconSparkles, IconEye, IconDroplet } from '@tabler/icons-react';
import { COLORS } from '../utils/theme';
import ProductModal from './ProductModal';

export default function ProductCard({ product, index = 0, showOfferTag = false }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const mainImage = product.images?.[0] || '';
  const hasMultipleImages = (product.images || []).length > 1;

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
        whileTap={{ scale: 0.96 }}
        onClick={() => setModalOpen(true)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: COLORS.white,
          borderRadius: 18,
          overflow: 'hidden',
          border: `1px solid ${COLORS.borderLight}`,
          position: 'relative',
          boxShadow: '0 4px 20px rgba(26,39,68,0.06)',
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
            OFERTA
          </motion.div>
        )}

        {/* Image counter badge */}
        {hasMultipleImages && (
          <div style={{
            position: 'absolute', top: 10, right: 10, zIndex: 5,
            background: 'rgba(26,39,68,0.65)', backdropFilter: 'blur(8px)',
            padding: '3px 8px', borderRadius: 12,
            display: 'flex', alignItems: 'center', gap: 3,
          }}>
            <IconEye size={10} color="white" />
            <span style={{
              fontFamily: '"Outfit", sans-serif', fontSize: '0.58rem',
              color: 'white', fontWeight: 500,
            }}>{product.images.length}</span>
          </div>
        )}

        {/* Image */}
        <div className="product-image-container" style={{ borderRadius: '18px 18px 0 0' }}>
          {mainImage ? (
            <motion.img
              src={mainImage}
              alt={product.title}
              loading="lazy"
              style={{ display: 'block' }}
              animate={{ scale: hovered ? 1.06 : 1 }}
              transition={{ duration: 0.5 }}
            />
          ) : (
            <div className="no-image-placeholder">
              <IconDiamond size={32} color={COLORS.borderLight} />
              <span style={{ fontSize: '0.7rem' }}>Sin imagen</span>
            </div>
          )}
          <div className="product-shine-overlay" />
        </div>

        {/* ====== INFO SECTION ====== */}
        <div style={{ padding: '12px 12px 14px' }}>
          {/* Titulo */}
          <h3 style={{
            fontFamily: '"Playfair Display", serif', fontSize: '0.88rem',
            fontWeight: 600, color: COLORS.navy, marginBottom: 8, lineHeight: 1.3,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {product.title || 'Sin titulo'}
          </h3>

          {/* Specs card con iconos - Material y Acabado */}
          {(product.material || (product.platingType && product.plating)) && (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 5,
              padding: '8px 10px', borderRadius: 12,
              background: '#fafbff',
              border: `1px solid ${COLORS.borderLight}`,
              marginBottom: 10,
            }}>
              {/* Material */}
              {product.material && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6,
                    background: COLORS.orangePale,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, border: '1px solid rgba(247,103,7,0.12)',
                  }}>
                    <IconSparkles size={11} color={COLORS.orange} />
                  </div>
                  <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.68rem', lineHeight: 1.3 }}>
                    <span style={{ color: COLORS.textMuted, fontWeight: 500 }}>Material: </span>
                    <span style={{ color: COLORS.navy, fontWeight: 700 }}>{product.material}</span>
                  </span>
                </div>
              )}

              {/* Acabado (Enchapado / Laminado / Bañado) */}
              {product.platingType && product.plating && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6,
                    background: '#e6f0ff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, border: '1px solid rgba(44,74,128,0.1)',
                  }}>
                    <IconDroplet size={11} color="#2c4a80" />
                  </div>
                  <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.68rem', lineHeight: 1.3 }}>
                    <span style={{ color: COLORS.textMuted, fontWeight: 500 }}>{product.platingType}: </span>
                    <span style={{ color: COLORS.navy, fontWeight: 700 }}>{product.plating}</span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Precio + Stock */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="price-tag" style={{
              fontSize: '1.1rem', display: 'flex', alignItems: 'baseline', gap: 2,
            }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 400 }}>S/.</span>
              {product.price || '0.00'}
            </div>
            {!product.soldOut && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 3,
                background: '#e6f9e6', padding: '2px 8px', borderRadius: 12,
                border: '1px solid rgba(45,138,45,0.12)',
              }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#2d8a2d' }} />
                <span style={{
                  fontFamily: '"Outfit", sans-serif', fontSize: '0.52rem',
                  color: '#2d8a2d', fontWeight: 600, letterSpacing: '0.3px',
                }}>Stock</span>
              </div>
            )}
          </div>
        </div>

        {/* Decorative bottom accent */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${COLORS.orange}, ${COLORS.gold}, ${COLORS.orange})`,
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }} />
      </motion.div>

      <ProductModal product={product} open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}