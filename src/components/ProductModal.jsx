// src/components/ProductModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Modal, Badge } from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconDiamond, IconChevronLeft, IconChevronRight, IconRuler2,
  IconSparkles, IconPackage, IconBrandWhatsapp,
  IconHeart, IconX, IconInfoCircle, IconDroplet,
  IconCategory,
} from '@tabler/icons-react';
import { COLORS } from '../utils/theme';

const WHATSAPP_NUMBER = '51970824366';

export default function ProductModal({ product, open, onClose }) {
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedTalla, setSelectedTalla] = useState(null);
  const [liked, setLiked] = useState(false);
  const [imageZoomed, setImageZoomed] = useState(false);
  const galleryRef = useRef(null);
  const images = product?.images || [];

  useEffect(() => {
    if (open) {
      setCurrentImage(0);
      setSelectedTalla(null);
      setImageZoomed(false);
    }
  }, [open]);

  if (!product) return null;

  const nextImage = (e) => { e?.stopPropagation(); setCurrentImage((p) => (p + 1) % images.length); };
  const prevImage = (e) => { e?.stopPropagation(); setCurrentImage((p) => (p - 1 + images.length) % images.length); };

  const tallas = product.tallas || [];
  const hasSpecs = product.material || (product.platingType && product.plating);

  // Generar mensaje de WhatsApp
  const whatsappMsg = () => {
    let msg = `Hola! Me interesa el producto: *${product.title}*`;
    if (product.price) msg += `\nPrecio: S/.${product.price}`;
    if (selectedTalla) msg += `\nTalla: ${selectedTalla}`;
    msg += `\nQuisiera mas informacion.`;
    return encodeURIComponent(msg);
  };

  // Swipe support
  const [touchStart, setTouchStart] = useState(null);
  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextImage(); else prevImage();
    }
    setTouchStart(null);
  };

  return (
    <Modal
      opened={open}
      onClose={onClose}
      fullScreen
      radius={0}
      padding={0}
      transitionProps={{ transition: 'slide-up', duration: 350 }}
      withCloseButton={false}
      styles={{
        body: { padding: 0, background: COLORS.white },
        content: { background: COLORS.white },
      }}
    >
      <div style={{ maxWidth: 600, margin: '0 auto', position: 'relative' }}>

        {/* ====== HEADER FLOTANTE ====== */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${COLORS.borderLight}`,
          padding: '10px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 10px', borderRadius: 10,
          }}>
            <IconChevronLeft size={18} color={COLORS.navy} />
            <span style={{
              fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem',
              color: COLORS.navy, fontWeight: 500,
            }}>Volver</span>
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
              style={{
                background: liked ? '#fee6e6' : COLORS.offWhite,
                border: `1px solid ${liked ? '#ffb3b3' : COLORS.borderLight}`,
                borderRadius: 10, width: 36, height: 36, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            >
              <IconHeart size={16} color={liked ? '#e11d48' : COLORS.textMuted} fill={liked ? '#e11d48' : 'none'} />
            </motion.button>
          </div>
        </div>

        {/* ====== GALERIA DE IMAGENES ====== */}
        <div style={{ position: 'relative', background: COLORS.offWhite }}
          onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          {images.length > 0 ? (
            <>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentImage}
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setImageZoomed(!imageZoomed)}
                  style={{ cursor: 'zoom-in', position: 'relative' }}
                >
                  <img
                    src={images[currentImage]}
                    alt={product.title}
                    style={{
                      width: '100%',
                      aspectRatio: imageZoomed ? 'auto' : '4/4',
                      objectFit: imageZoomed ? 'contain' : 'cover',
                      display: 'block',
                      maxHeight: imageZoomed ? '80vh' : 'none',
                      background: imageZoomed ? '#f0f0f0' : 'transparent',
                    }}
                  />
                </motion.div>
              </AnimatePresence>

              {/* Navigation arrows */}
              {images.length > 1 && (
                <>
                  <motion.button whileTap={{ scale: 0.85 }} onClick={prevImage} style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
                    border: `1px solid ${COLORS.borderLight}`,
                    borderRadius: 12, width: 40, height: 40, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  }}>
                    <IconChevronLeft size={18} color={COLORS.navy} />
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.85 }} onClick={nextImage} style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
                    border: `1px solid ${COLORS.borderLight}`,
                    borderRadius: 12, width: 40, height: 40, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  }}>
                    <IconChevronRight size={18} color={COLORS.navy} />
                  </motion.button>

                  {/* Progress bar */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    height: 3, background: COLORS.borderLight,
                  }}>
                    <motion.div
                      animate={{ width: `${((currentImage + 1) / images.length) * 100}%` }}
                      transition={{ duration: 0.3 }}
                      style={{
                        height: '100%',
                        background: `linear-gradient(90deg, ${COLORS.orange}, ${COLORS.gold})`,
                        borderRadius: 2,
                      }}
                    />
                  </div>

                  {/* Image counter */}
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    background: 'rgba(26,39,68,0.65)', backdropFilter: 'blur(8px)',
                    padding: '4px 10px', borderRadius: 16,
                    fontFamily: '"Outfit", sans-serif', fontSize: '0.65rem',
                    color: 'white', fontWeight: 500,
                  }}>
                    {currentImage + 1} / {images.length}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="no-image-placeholder" style={{ height: 320 }}>
              <IconDiamond size={48} color={COLORS.borderLight} />
              <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.75rem', color: COLORS.textMuted }}>Sin imagen</span>
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
          <div ref={galleryRef} style={{
            display: 'flex', gap: 8, padding: '12px 16px',
            overflowX: 'auto', scrollbarWidth: 'none',
          }}>
            {images.map((img, i) => (
              <motion.div
                key={i}
                whileTap={{ scale: 0.9 }}
                onClick={() => setCurrentImage(i)}
                style={{
                  width: 60, height: 60, borderRadius: 10, overflow: 'hidden',
                  border: i === currentImage ? `2.5px solid ${COLORS.orange}` : `1.5px solid ${COLORS.borderLight}`,
                  cursor: 'pointer', flexShrink: 0,
                  boxShadow: i === currentImage ? `0 4px 12px rgba(247,103,7,0.25)` : 'none',
                  transition: 'all 0.25s',
                }}
              >
                <img src={img} alt="" style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  opacity: i === currentImage ? 1 : 0.55,
                  transition: 'opacity 0.25s',
                }} />
              </motion.div>
            ))}
          </div>
        )}

        {/* ====== CONTENIDO DEL PRODUCTO ====== */}
        <div style={{ padding: '20px 20px 32px' }}>

          {/* Titulo y precio */}
          <div style={{ marginBottom: 16 }}>
            <h1 style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: '1.55rem', fontWeight: 600,
              color: COLORS.navy, marginBottom: 10, lineHeight: 1.25,
            }}>
              {product.title}
            </h1>

            {/* Precio */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: `linear-gradient(135deg, ${COLORS.orangePale}, #fff4e6)`,
              padding: '10px 20px', borderRadius: 16,
              border: '1px solid rgba(247,103,7,0.12)',
            }}>
              <div>
                <span style={{
                  fontFamily: '"Outfit", sans-serif', fontSize: '0.6rem',
                  color: COLORS.textMuted, fontWeight: 500, textTransform: 'uppercase',
                  letterSpacing: '1px', display: 'block', marginBottom: 1,
                }}>Precio</span>
                <span className="price-tag" style={{ fontSize: '1.5rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 400, marginRight: 2 }}>S/.</span>
                  {product.price || '0.00'}
                </span>
              </div>
              {!product.soldOut && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: '#e6f9e6', padding: '3px 10px', borderRadius: 20,
                  border: '1px solid rgba(45,138,45,0.15)',
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2d8a2d' }} />
                  <span style={{
                    fontFamily: '"Outfit", sans-serif', fontSize: '0.6rem',
                    color: '#2d8a2d', fontWeight: 600, letterSpacing: '0.3px',
                  }}>Disponible</span>
                </div>
              )}
            </div>
          </div>

          {/* Linea decorativa */}
          <div style={{
            height: 2, borderRadius: 1, marginBottom: 20,
            background: `linear-gradient(90deg, ${COLORS.orange}, ${COLORS.gold}, transparent)`,
            width: 80,
          }} />

          {/* ====== ESPECIFICACIONES (solo material y chapado) ====== */}
          {hasSpecs && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(44,74,128,0.1)',
                }}>
                  <IconInfoCircle size={14} color={COLORS.navy} />
                </div>
                <span style={{
                  fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem',
                  color: COLORS.navy, fontWeight: 600,
                }}>Especificaciones</span>
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8,
                marginBottom: tallas.length > 0 ? 16 : 0,
              }}>
                {product.material && (
                  <SpecItem icon={IconSparkles} label="Material" value={product.material} color="#f76707" bg="#fff4e6" />
                )}
                {product.platingType && product.plating && (
                  <SpecItem icon={IconDroplet} label={product.platingType} value={product.plating} color="#2c4a80" bg="#e6f0ff" />
                )}
              </div>
            </div>
          )}

          {/* ====== TALLAS ====== */}
          {tallas.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <IconRuler2 size={14} color={COLORS.navy} />
                <span style={{
                  fontFamily: '"Outfit", sans-serif', fontSize: '0.72rem',
                  color: COLORS.navy, fontWeight: 600,
                }}>Tallas disponibles</span>
                {selectedTalla && (
                  <span style={{
                    fontFamily: '"Outfit", sans-serif', fontSize: '0.6rem',
                    color: COLORS.orange, fontWeight: 500, marginLeft: 'auto',
                  }}>Seleccionada: {selectedTalla}</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {tallas.map((t, i) => {
                  const isSelected = selectedTalla === t;
                  return (
                    <motion.button
                      key={i}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedTalla(isSelected ? null : t)}
                      style={{
                        fontFamily: '"Outfit", sans-serif',
                        fontSize: '0.82rem', fontWeight: 600,
                        padding: '8px 18px', borderRadius: 12,
                        border: isSelected
                          ? `2px solid ${COLORS.orange}`
                          : `1.5px solid ${COLORS.borderLight}`,
                        color: isSelected ? COLORS.white : COLORS.navy,
                        background: isSelected
                          ? `linear-gradient(135deg, ${COLORS.orange}, #ff922b)`
                          : COLORS.white,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? '0 4px 12px rgba(247,103,7,0.3)' : 'none',
                      }}
                    >
                      {t}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ====== DESCRIPCION ====== */}
          {product.description && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: COLORS.orangePale, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(247,103,7,0.1)',
                }}>
                  <IconPackage size={14} color={COLORS.orange} />
                </div>
                <span style={{
                  fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem',
                  color: COLORS.navy, fontWeight: 600,
                }}>Descripcion</span>
              </div>
              <p style={{
                fontFamily: '"Outfit", sans-serif', fontSize: '0.85rem',
                lineHeight: 1.75, color: COLORS.textMuted,
                padding: '14px 16px', borderRadius: 12,
                background: COLORS.offWhite, border: `1px solid ${COLORS.borderLight}`,
              }}>
                {product.description}
              </p>
            </div>
          )}

          {/* ====== BOTON WHATSAPP (solo si showWhatsapp esta activo) ====== */}
          {!product.soldOut && product.showWhatsapp && (
            <motion.a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg()}`}
              target="_blank"
              rel="noopener noreferrer"
              whileTap={{ scale: 0.96 }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                background: 'linear-gradient(135deg, #25D366, #128C7E)',
                color: 'white', padding: '14px 24px', borderRadius: 16,
                fontFamily: '"Outfit", sans-serif', fontSize: '0.9rem', fontWeight: 600,
                textDecoration: 'none', cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(37,211,102,0.35)',
                border: 'none', width: '100%',
                letterSpacing: '0.3px',
              }}
            >
              <IconBrandWhatsapp size={20} />
              Consultar por WhatsApp
            </motion.a>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* ====== COMPONENTE: Spec Item ====== */
function SpecItem({ icon: Icon, label, value, color, bg }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px', borderRadius: 12,
      background: bg, border: `1px solid ${color}15`,
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8,
        background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={14} color={color} />
      </div>
      <div>
        <span style={{
          fontFamily: '"Outfit", sans-serif', fontSize: '0.58rem',
          color: COLORS.textMuted, fontWeight: 500, textTransform: 'uppercase',
          letterSpacing: '0.8px', display: 'block', lineHeight: 1.2,
        }}>{label}</span>
        <span style={{
          fontFamily: '"Outfit", sans-serif', fontSize: '0.78rem',
          color: COLORS.navy, fontWeight: 600, lineHeight: 1.3,
          textTransform: 'capitalize',
        }}>{value}</span>
      </div>
    </div>
  );
}