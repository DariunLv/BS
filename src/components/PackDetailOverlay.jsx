// src/components/PackDetailOverlay.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Overlay reutilizable de detalle del Pack.
//
// - Se renderiza en document.body via Portal para escapar transforms de padres
//   (los bottom-sheets con framer-motion rompen position:fixed sino se hace así).
// - Centrado siempre con flexbox.
// - Reutilizable desde ProductModal (carrusel de packs) y AddToCartRingModal.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { IconX, IconCheck, IconPlus, IconPackage } from '@tabler/icons-react';
import { COLORS } from '../utils/theme';
import { formatSoles } from '../utils/cart';
import useImages from '../hooks/useImages';

export default function PackDetailOverlay({
  pack,
  ringProduct,
  isSelected = false,
  onClose,
  onToggle,                 // si se proporciona, muestra botón Añadir/Quitar
  primaryButtonLabel = null, // override del label del botón
  hideAction = false,        // si true, no muestra botón (solo info)
}) {
  const cachedImgs = useImages(pack?.id);
  const images = (cachedImgs && cachedImgs.length > 0) ? cachedImgs : (pack?.images || []);
  const [currentImg, setCurrentImg] = useState(0);
  if (!pack) return null;

  const ringPrice = parseFloat(ringProduct?.price) || 0;
  const packPrice = parseFloat(pack?.price) || 0;
  const combo = ringPrice + packPrice;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,26,46,0.78)',
        backdropFilter: 'blur(6px)',
        zIndex: 10500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        boxSizing: 'border-box',
      }}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        style={{
          width: '100%',
          maxWidth: 440,
          maxHeight: '90vh',
          background: COLORS.white,
          borderRadius: 18,
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${COLORS.borderLight || '#e9ecef'}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <h3 style={{
            margin: 0,
            fontFamily: '"Playfair Display", serif',
            fontSize: '1.05rem', fontWeight: 600, color: COLORS.navy,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            paddingRight: 8,
          }}>{pack.title}</h3>
          <button onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: '50%', border: 'none',
              background: '#f1f3f5', cursor: 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: COLORS.navy,
            }}><IconX size={15} /></button>
        </div>

        <div style={{
          flex: 1, overflowY: 'auto',
          padding: 16, display: 'flex', flexDirection: 'column', gap: 14,
          WebkitOverflowScrolling: 'touch',
        }}>
          {images.length > 0 ? (
            <div style={{
              width: '100%', aspectRatio: '1/1',
              borderRadius: 12, overflow: 'hidden',
              background: COLORS.offWhite || '#f8f9fa',
            }}>
              <img src={images[currentImg]} alt={pack.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ) : (
            <div style={{
              width: '100%', aspectRatio: '1/1', borderRadius: 12,
              background: COLORS.offWhite || '#f8f9fa',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ced4da',
            }}><IconPackage size={48} /></div>
          )}
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
              {images.map((img, i) => (
                <img key={i} src={img} alt="" onClick={() => setCurrentImg(i)}
                  style={{
                    width: 48, height: 48, borderRadius: 8,
                    objectFit: 'cover', cursor: 'pointer', flexShrink: 0,
                    border: `2px solid ${i === currentImg ? COLORS.orange : 'transparent'}`,
                    opacity: i === currentImg ? 1 : 0.6,
                  }} />
              ))}
            </div>
          )}
          {pack.description && (
            <p style={{
              margin: 0,
              fontFamily: '"Outfit", sans-serif',
              fontSize: '0.82rem', color: '#495057',
              lineHeight: 1.5, whiteSpace: 'pre-wrap',
            }}>{pack.description}</p>
          )}

          {ringProduct && (
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{
                flex: 1, padding: '10px 12px',
                background: COLORS.orangePale,
                border: `1px solid rgba(247,103,7,0.18)`,
                borderRadius: 12, textAlign: 'center',
              }}>
                <div style={{
                  fontFamily: '"Outfit",sans-serif',
                  fontSize: '0.55rem', color: '#868e96',
                  textTransform: 'uppercase', letterSpacing: '0.9px',
                  fontWeight: 600, marginBottom: 2,
                }}>Pack</div>
                <div style={{
                  fontFamily: '"Outfit",sans-serif',
                  fontSize: '1.1rem', fontWeight: 800, color: COLORS.orange,
                }}>{formatSoles(packPrice)}</div>
              </div>
              <div style={{
                flex: 1, padding: '10px 12px',
                background: 'rgba(44,74,128,0.06)',
                border: '1px solid rgba(44,74,128,0.15)',
                borderRadius: 12, textAlign: 'center',
              }}>
                <div style={{
                  fontFamily: '"Outfit",sans-serif',
                  fontSize: '0.55rem', color: '#868e96',
                  textTransform: 'uppercase', letterSpacing: '0.9px',
                  fontWeight: 600, marginBottom: 2,
                }}>Anillo</div>
                <div style={{
                  fontFamily: '"Outfit",sans-serif',
                  fontSize: '1.1rem', fontWeight: 800, color: COLORS.navy,
                }}>{formatSoles(ringPrice)}</div>
              </div>
            </div>
          )}
          {ringProduct && (
            <div style={{
              padding: '10px 14px', textAlign: 'center',
              background: `linear-gradient(135deg, ${COLORS.navy}, ${COLORS.navyLight})`,
              color: '#fff', borderRadius: 12,
            }}>
              <div style={{
                fontFamily: '"Outfit",sans-serif',
                fontSize: '0.6rem', opacity: 0.85,
                textTransform: 'uppercase', letterSpacing: '1px',
                marginBottom: 3,
              }}>Combo total</div>
              <div style={{
                fontFamily: '"Playfair Display",serif',
                fontSize: '1.4rem', fontWeight: 700,
              }}>{formatSoles(combo)}</div>
            </div>
          )}
          {!ringProduct && packPrice > 0 && (
            <div style={{
              padding: '10px 14px', textAlign: 'center',
              background: COLORS.orangePale,
              border: `1px solid rgba(247,103,7,0.18)`,
              borderRadius: 12,
            }}>
              <div style={{
                fontFamily: '"Outfit",sans-serif',
                fontSize: '0.6rem', color: '#868e96',
                textTransform: 'uppercase', letterSpacing: '1px',
                marginBottom: 3, fontWeight: 600,
              }}>Precio del pack</div>
              <div style={{
                fontFamily: '"Playfair Display",serif',
                fontSize: '1.4rem', fontWeight: 700, color: COLORS.orange,
              }}>{formatSoles(packPrice)}</div>
            </div>
          )}
        </div>

        {!hideAction && onToggle && (
          <div style={{
            padding: '12px 16px 14px',
            paddingBottom: 'max(14px, env(safe-area-inset-bottom))',
            borderTop: `1px solid ${COLORS.borderLight || '#e9ecef'}`,
            background: COLORS.white,
            flexShrink: 0,
          }}>
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={onToggle}
              style={{
                width: '100%', padding: '13px 16px',
                border: isSelected ? `1.5px solid ${COLORS.orange}` : 'none',
                borderRadius: 999,
                background: isSelected
                  ? 'transparent'
                  : `linear-gradient(135deg, ${COLORS.orange}, #ff8c42)`,
                color: isSelected ? COLORS.orange : '#fff',
                fontFamily: '"Outfit", sans-serif',
                fontWeight: 700, fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: isSelected ? 'none' : '0 6px 18px rgba(247,103,7,0.35)',
              }}>
              {primaryButtonLabel ? (
                <>{primaryButtonLabel}</>
              ) : isSelected ? (
                <><IconCheck size={17} stroke={2.5} /> Pack añadido · Quitar</>
              ) : (
                <><IconPlus size={17} stroke={2.5} /> Añadir este pack</>
              )}
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>,
    document.body
  );
}