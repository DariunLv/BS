// src/components/ProductModal.jsx
import React, { useState } from 'react';
import { Modal, Badge } from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import { IconDiamond, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { COLORS } from '../utils/theme';

export default function ProductModal({ product, open, onClose }) {
  const [currentImage, setCurrentImage] = useState(0);
  const images = product?.images || [];

  if (!product) return null;

  const nextImage = () => setCurrentImage((p) => (p + 1) % images.length);
  const prevImage = () => setCurrentImage((p) => (p - 1 + images.length) % images.length);

  return (
    <Modal
      opened={open}
      onClose={onClose}
      fullScreen
      radius={0}
      transitionProps={{ transition: 'slide-up', duration: 300 }}
      styles={{
        header: {
          background: COLORS.white,
          borderBottom: `1px solid ${COLORS.borderLight}`,
          padding: '12px 16px',
        },
        title: {
          fontFamily: '"Playfair Display", serif',
          fontWeight: 600,
          fontSize: '1rem',
          color: COLORS.navy,
        },
        body: { padding: 0, background: COLORS.white },
        close: { color: COLORS.navy },
      }}
      title={product.title}
    >
      <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 60 }}>
        {/* Image Gallery */}
        <div style={{ position: 'relative', background: COLORS.offWhite }}>
          {images.length > 0 ? (
            <>
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImage}
                  src={images[currentImage]}
                  alt={product.title}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    width: '100%',
                    aspectRatio: '1/1',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </AnimatePresence>

              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    style={{
                      position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                      background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%',
                      width: 36, height: 36, cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                  >
                    <IconChevronLeft size={18} color={COLORS.navy} />
                  </button>
                  <button
                    onClick={nextImage}
                    style={{
                      position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                      background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%',
                      width: 36, height: 36, cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                  >
                    <IconChevronRight size={18} color={COLORS.navy} />
                  </button>

                  {/* Dots */}
                  <div style={{
                    position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
                    display: 'flex', gap: 6,
                  }}>
                    {images.map((_, i) => (
                      <div
                        key={i}
                        onClick={() => setCurrentImage(i)}
                        style={{
                          width: i === currentImage ? 20 : 6,
                          height: 6,
                          borderRadius: 3,
                          background: i === currentImage ? COLORS.orange : 'rgba(255,255,255,0.7)',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="no-image-placeholder" style={{ height: 300 }}>
              <IconDiamond size={48} color={COLORS.borderLight} />
            </div>
          )}

          {product.soldOut && (
            <div className="sold-out-overlay" style={{ borderRadius: 0 }}>
              <div className="sold-out-badge" style={{ fontSize: '1rem', padding: '10px 32px' }}>AGOTADO</div>
            </div>
          )}
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div style={{ display: 'flex', gap: 8, padding: '12px 16px', overflowX: 'auto' }}>
            {images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt=""
                onClick={() => setCurrentImage(i)}
                style={{
                  width: 56, height: 56, objectFit: 'cover', borderRadius: 8,
                  border: i === currentImage ? `2px solid ${COLORS.orange}` : `1px solid ${COLORS.borderLight}`,
                  cursor: 'pointer', opacity: i === currentImage ? 1 : 0.6,
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        )}

        {/* Product Info */}
        <div style={{ padding: '20px 20px 32px' }}>
          <h1
            style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: '1.5rem',
              fontWeight: 600,
              color: COLORS.navy,
              marginBottom: 8,
              lineHeight: 1.3,
            }}
          >
            {product.title}
          </h1>

          <div
            className="price-tag"
            style={{ fontSize: '1.4rem', marginBottom: 16 }}
          >
            <span style={{ fontSize: '0.85rem', fontWeight: 400 }}>S/.</span>
            {product.price || '0.00'}
          </div>

          <div className="elegant-divider elegant-divider-left" style={{ marginBottom: 20 }} />

          {/* Material & Plating */}
          {(product.material || product.plating) && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {product.material && (
                <Badge
                  variant="light"
                  radius="xl"
                  style={{
                    background: COLORS.orangePale,
                    color: COLORS.orange,
                    fontFamily: '"Outfit", sans-serif',
                    fontWeight: 500,
                    fontSize: '0.7rem',
                    textTransform: 'none',
                    letterSpacing: '0.3px',
                  }}
                >
                  {product.material}
                </Badge>
              )}
              {product.plating && (
                <Badge
                  variant="light"
                  radius="xl"
                  style={{
                    background: '#e8edf5',
                    color: COLORS.navy,
                    fontFamily: '"Outfit", sans-serif',
                    fontWeight: 500,
                    fontSize: '0.7rem',
                    textTransform: 'none',
                    letterSpacing: '0.3px',
                  }}
                >
                  {product.plating}
                </Badge>
              )}
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div style={{ marginBottom: 20 }}>
              <h4
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: COLORS.navy,
                  marginBottom: 8,
                }}
              >
                Descripcion
              </h4>
              <p
                style={{
                  fontFamily: '"Outfit", sans-serif',
                  fontSize: '0.85rem',
                  lineHeight: 1.7,
                  color: COLORS.textMuted,
                }}
              >
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
