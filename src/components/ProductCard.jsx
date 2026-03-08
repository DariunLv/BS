// src/components/ProductCard.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { IconDiamond, IconSparkles, IconEye, IconDroplet, IconRuler2 } from '@tabler/icons-react';
import { COLORS } from '../utils/theme';
import ProductModal from './ProductModal';
import { trackProductView } from '../utils/store';

// Skeleton de una sola card
function ProductCardSkeleton() {
  return (
    <div style={{
      background: COLORS.white, borderRadius: 18, overflow: 'hidden',
      border: `1px solid ${COLORS.borderLight}`,
    }}>
      <div className="skeleton-shimmer" style={{ width: '100%', aspectRatio: '1/1' }} />
      <div style={{ padding: '12px 12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="skeleton-shimmer" style={{ height: 14, borderRadius: 6, width: '70%' }} />
        <div className="skeleton-shimmer" style={{ height: 10, borderRadius: 6, width: '50%' }} />
        <div className="skeleton-shimmer" style={{ height: 18, borderRadius: 6, width: '40%' }} />
      </div>
    </div>
  );
}

export { ProductCardSkeleton };

// Formatea precio siempre con 2 decimales: 40 → "40.00", 40.5 → "40.50"
const fmt = (n) => parseFloat(n || 0).toFixed(2);

export default function ProductCard({ product, index = 0, showOfferTag = false, storeData = null, hidePacks = false, comboPrice = null, packPrice = null, packData = null, siblingProducts = null, siblingIndex = null }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const mainImage = product.images?.[0] || '';

  // Badge "Nuevo" — auto si fue creado en los últimos 7 días
  const isNew = (() => {
    if (!product.createdAt) return false;
    const created = new Date(product.createdAt + 'T00:00:00');
    const diff = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  })();

  const handlePreloadImages = () => {
    // Precarga imágenes al tocar/hover — antes de que abra el modal
    const imgs = product.images || (product.image ? [product.image] : []);
    imgs.forEach(src => { if (src) { const i = new Image(); i.src = src; } });
  };

  const handleOpenModal = () => {
    trackProductView(product.id);
    setModalOpen(true);
  };
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
        onClick={handleOpenModal}
        onTouchStart={handlePreloadImages}
        onMouseEnter={() => { setHovered(true); handlePreloadImages(); }}
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

        {/* Badge NUEVO */}
        {isNew && !product.soldOut && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
            style={{
              position: 'absolute', top: 10, left: 10, zIndex: 6,
              background: 'linear-gradient(135deg, #2d8a2d, #3aab3a)',
              color: 'white', fontSize: '0.52rem', fontWeight: 700,
              fontFamily: '"Outfit", sans-serif', letterSpacing: '1px',
              padding: '3px 8px', borderRadius: 10,
              boxShadow: '0 2px 8px rgba(45,138,45,0.4)',
              textTransform: 'uppercase',
            }}
          >
            ✦ Nuevo
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
        <div className="product-image-container" style={{ borderRadius: '18px 18px 0 0', position: 'relative' }}>
          {mainImage ? (
            <>
              {/* Skeleton mientras carga la imagen */}
              {!imgLoaded && (
                <div className="skeleton-shimmer" style={{ position: 'absolute', inset: 0 }} />
              )}
              <motion.img
                src={mainImage}
                alt={product.title}
                loading="lazy"
                onLoad={() => setImgLoaded(true)}
                style={{
                  display: 'block',
                  filter: imgLoaded ? 'none' : 'blur(10px)',
                  transform: imgLoaded ? (hovered ? 'scale(1.06)' : 'scale(1)') : 'scale(1.05)',
                  transition: 'filter 0.5s ease, transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94)',
                  opacity: imgLoaded ? 1 : 0.6,
                }}
              />
              {/* Hover overlay con título */}
              <motion.div
                animate={{ opacity: hovered ? 1 : 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  position: 'absolute', inset: 0, zIndex: 3,
                  background: 'linear-gradient(0deg, rgba(26,39,68,0.82) 0%, rgba(26,39,68,0.2) 55%, transparent 100%)',
                  display: 'flex', alignItems: 'flex-end', padding: '12px',
                  pointerEvents: 'none',
                }}
              >
                <span style={{
                  fontFamily: '"Playfair Display", serif', fontSize: '0.82rem',
                  fontWeight: 600, color: 'white', lineHeight: 1.3,
                  textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                }}>
                  {product.title}
                </span>
              </motion.div>
            </>
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
          {/* Titulo con shimmer dorado en hover */}
          <h3
            className={hovered ? 'product-title-shimmer' : ''}
            style={{
              fontFamily: '"Playfair Display", serif', fontSize: '0.88rem',
              fontWeight: 600, color: COLORS.navy, marginBottom: 8, lineHeight: 1.3,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              transition: 'color 0.3s ease',
            }}
          >
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
            <div>
              <div className="price-tag" style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'baseline', gap: 2 }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 400 }}>S/.</span>
                {fmt(product.price)}
              </div>
              {/* Desglose combo (cuando se muestra desde categoría pack) */}
              {comboPrice !== null && packPrice !== null && (
                <div style={{ marginTop: 8 }}>
                  {/* Fila pack sutil */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    marginBottom: 6, padding: '0 2px',
                  }}>
                    <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.55rem', color: COLORS.textMuted }}>
                      + Pack
                    </span>
                    <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.55rem', color: COLORS.textMuted }}>
                      S/.{fmt(packPrice)}
                    </span>
                  </div>

                  {/* Total — diseño navy premium */}
                  <div style={{
                    position: 'relative', overflow: 'hidden',
                    background: `linear-gradient(135deg, ${COLORS.navy} 0%, #2c4a80 100%)`,
                    borderRadius: 10, padding: '7px 10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    {/* Brillo decorativo */}
                    <div style={{
                      position: 'absolute', top: -10, right: -10,
                      width: 40, height: 40, borderRadius: '50%',
                      background: 'rgba(212,165,116,0.15)',
                      pointerEvents: 'none',
                    }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{
                        width: 14, height: 14, borderRadius: 4,
                        background: `rgba(212,165,116,0.25)`,
                        border: '1px solid rgba(212,165,116,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ fontSize: '0.5rem', lineHeight: 1 }}>✦</span>
                      </div>
                      <span style={{
                        fontFamily: '"Outfit", sans-serif', fontSize: '0.58rem',
                        color: COLORS.goldLight, fontWeight: 600,
                        letterSpacing: '0.8px', textTransform: 'uppercase',
                      }}>Total</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                      <span style={{
                        fontFamily: '"Outfit", sans-serif', fontSize: '0.6rem',
                        color: COLORS.goldLight, fontWeight: 500,
                      }}>S/.</span>
                      <span style={{
                        fontFamily: '"Playfair Display", serif', fontSize: '1.1rem',
                        color: 'white', fontWeight: 700, lineHeight: 1,
                      }}>{fmt(comboPrice)}</span>
                    </div>
                  </div>
                </div>
              )}
              {product.categoryId?.includes('pack') && product.extraPrice && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 3,
                  background: 'linear-gradient(90deg, rgba(247,103,7,0.1), rgba(247,103,7,0.05))',
                  padding: '2px 7px', borderRadius: 6,
                  border: '1px solid rgba(247,103,7,0.2)',
                }}>
                  <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.55rem', color: COLORS.orange, fontWeight: 700 }}>
                    + S/.{fmt(product.extraPrice)} con tu anillo
                  </span>
                </div>
              )}
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

          {/* Tallas — solo para anillos */}
          {product.categoryId?.includes('anillo') &&
           ((product.tallasVaron?.length > 0) || (product.tallasDama?.length > 0)) && (
            <div style={{
              marginTop: 8,
              paddingTop: 8,
              borderTop: `1px solid ${COLORS.borderLight}`,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <IconRuler2 size={12} color={COLORS.textMuted} style={{ flexShrink: 0 }} />
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {product.tallasVaron?.length > 0 && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: '#eef2ff',
                    padding: '3px 8px',
                    borderRadius: 6,
                    border: '1px solid rgba(44,74,128,0.12)',
                  }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#2c4a80', flexShrink: 0 }} />
                    <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.58rem', color: '#2c4a80', fontWeight: 600, letterSpacing: '0.2px' }}>
                      Varón · {product.tallasVaron.length}
                    </span>
                  </div>
                )}
                {product.tallasDama?.length > 0 && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: '#fff0f6',
                    padding: '3px 8px',
                    borderRadius: 6,
                    border: '1px solid rgba(194,37,92,0.12)',
                  }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#c2255c', flexShrink: 0 }} />
                    <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.58rem', color: '#c2255c', fontWeight: 600, letterSpacing: '0.2px' }}>
                      Dama · {product.tallasDama.length}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
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

      <ProductModal product={product} open={modalOpen} onClose={() => setModalOpen(false)} storeData={storeData} hidePacks={hidePacks} comboPrice={comboPrice} packPrice={packPrice} packData={packData} siblingProducts={siblingProducts} siblingIndex={siblingIndex} />
    </>
  );
}