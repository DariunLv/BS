// src/components/ProductCard.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { IconDiamond, IconSparkles, IconEye, IconDroplet, IconRuler2, IconBrush } from '@tabler/icons-react';
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

const ProductCard = React.memo(function ProductCard({ product, index = 0, showOfferTag = false, storeData = null, hidePacks = false, comboPrice = null, packPrice = null, packData = null, siblingProducts = null, siblingIndex = null }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const mainImage = product.images?.[0] || '';

  const isNew = !!product.isNew;

  const handlePreloadImages = () => {
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
        initial={{ opacity: 0, y: 22, scale: 0.96 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: '-20px', amount: 0.1 }}
        transition={{
          duration: 0.35,
          delay: Math.min(index * 0.04, 0.25),
          type: 'spring',
          stiffness: 180,
          damping: 22,
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
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 8 }}>
            <h3
              className={hovered ? 'product-title-shimmer' : ''}
              style={{
                fontFamily: '"Playfair Display", serif', fontSize: '0.88rem',
                fontWeight: 600, color: COLORS.navy, marginBottom: 0, lineHeight: 1.3,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                transition: 'color 0.3s ease', flex: 1, minWidth: 0,
              }}
            >
              {product.title || 'Sin titulo'}
            </h3>
            {isNew && !product.soldOut && (
              <span style={{
                flexShrink: 0,
                background: 'linear-gradient(135deg, #2d8a2d, #3aab3a)',
                color: 'white', fontSize: '0.48rem', fontWeight: 700,
                fontFamily: '"Outfit", sans-serif', letterSpacing: '1px',
                padding: '3px 7px', borderRadius: 8,
                textTransform: 'uppercase', marginTop: 2,
              }}>
                Nuevo
              </span>
            )}
          </div>

          {/* Specs card con iconos - Material, Acabado, Piedra y Acabado de anillo */}
          {(product.material || (product.platingType && product.plating) || product.tipoPiedra || product.acabado) && (
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

              {/* Enchapado / Laminado / Bañado */}
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

              {/* Acabado */}
              {product.acabado && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6,
                    background: '#f0fdfa',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, border: '1px solid rgba(15,118,110,0.12)',
                  }}>
                    <IconBrush size={11} color="#0f766e" />
                  </div>
                  <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.68rem', lineHeight: 1.3 }}>
                    <span style={{ color: COLORS.textMuted, fontWeight: 500 }}>Acabado: </span>
                    <span style={{ color: '#0f766e', fontWeight: 700 }}>{product.acabado}</span>
                  </span>
                </div>
              )}

              {/* Tipo de piedra */}
              {product.tipoPiedra && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6,
                    background: '#f3f0ff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, border: '1px solid rgba(124,58,237,0.12)',
                  }}>
                    <IconDiamond size={11} color="#7c3aed" />
                  </div>
                  <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.68rem', lineHeight: 1.3 }}>
                    <span style={{ color: COLORS.textMuted, fontWeight: 500 }}>Piedra: </span>
                    <span style={{ color: '#6d28d9', fontWeight: 700 }}>
                      {product.tipoPiedra}{product.colorPiedra ? ` · ${product.colorPiedra}` : ''}
                    </span>
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
              {comboPrice !== null && packPrice !== null && (
                <div style={{ marginTop: 8 }}>
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
                  <div style={{
                    position: 'relative', overflow: 'hidden',
                    background: `linear-gradient(135deg, ${COLORS.navy} 0%, #2c4a80 100%)`,
                    borderRadius: 10, padding: '7px 10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
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
});

export default ProductCard;