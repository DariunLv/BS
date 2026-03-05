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
import { getWhatsappNumber } from '../utils/store';

const fmt = (n) => parseFloat(n || 0).toFixed(2);

export default function ProductModal({ product, open, onClose, storeData = null, hidePacks = false }) {
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedTalla, setSelectedTalla] = useState(null);
  const [liked, setLiked] = useState(false);
  const [imageZoomed, setImageZoomed] = useState(false);
  const [modalImgLoaded, setModalImgLoaded] = useState(false);
  const [selectedPackDetail, setSelectedPackDetail] = useState(null); // pack abierto en detalle
  const galleryRef = useRef(null);
  const images = product?.images || [];

  useEffect(() => {
    if (open) {
      setCurrentImage(0);
      setSelectedTalla(null);
      setImageZoomed(false);
      setModalImgLoaded(false);
    }
  }, [open]);

  if (!product) return null;

  const nextImage = (e) => { e?.stopPropagation(); setModalImgLoaded(false); setCurrentImage((p) => (p + 1) % images.length); };
  const prevImage = (e) => { e?.stopPropagation(); setModalImgLoaded(false); setCurrentImage((p) => (p - 1 + images.length) % images.length); };

  const tallas = product.tallas || [];
  const tallasVaron = product.tallasVaron || [];
  const tallasDama = product.tallasDama || [];
  const isAnillos = product.categoryId?.includes('anillo');
  const isPack = product.categoryId?.includes('pack');
  const hasTallas = isAnillos && (tallas.length > 0 || tallasVaron.length > 0 || tallasDama.length > 0);
  const hasSpecs = product.material || (product.platingType && product.plating);

  // Todos los anillos registrados (para mostrar combos dentro de un pack)
  const allRings = storeData
    ? (storeData.products || []).filter(p => p.categoryId?.includes('anillo')).sort((a,b) => (a.sortOrder??9999)-(b.sortOrder??9999))
    : [];

  // Todos los packs disponibles (para mostrar dentro de un anillo)
  const allPacks = storeData
    ? (storeData.products || []).filter(p => p.categoryId?.includes('pack')).sort((a,b) => (a.sortOrder??9999)-(b.sortOrder??9999))
    : [];

  // Generar mensaje de WhatsApp
  const whatsappMsg = () => {
    const number = getWhatsappNumber();
    let msg = `Hola, buen día! Vi el catálogo y me interesa el siguiente producto:\n\n*${product.title}*`;
    if (product.price) msg += `\nPrecio: S/.${product.price}`;
    if (product.material) msg += `\nMaterial: ${product.material}`;
    if (product.platingType && product.plating) msg += `\n${product.platingType}: ${product.plating}`;
    if (selectedTalla) {
      const label = selectedTalla.startsWith('V-') ? `Talla Varón: ${selectedTalla.slice(2)}` :
                    selectedTalla.startsWith('D-') ? `Talla Dama: ${selectedTalla.slice(2)}` :
                    `Talla: ${selectedTalla}`;
      msg += `\n${label}`;
    }
    msg += `\n\n¿Podría darme más información sobre disponibilidad y formas de pago? Gracias.`;
    return { number, encoded: encodeURIComponent(msg) };
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
    <>
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
                  {!modalImgLoaded && (
                    <div className="skeleton-shimmer" style={{
                      position: 'absolute', inset: 0, zIndex: 1,
                      aspectRatio: '1/1',
                    }} />
                  )}
                  <img
                    src={images[currentImage]}
                    alt={product.title}
                    onLoad={() => setModalImgLoaded(true)}
                    style={{
                      width: '100%',
                      aspectRatio: imageZoomed ? 'auto' : '4/4',
                      objectFit: imageZoomed ? 'contain' : 'cover',
                      display: 'block',
                      maxHeight: imageZoomed ? '80vh' : 'none',
                      background: imageZoomed ? '#f0f0f0' : 'transparent',
                      filter: modalImgLoaded ? 'none' : 'blur(12px)',
                      transform: modalImgLoaded ? 'scale(1)' : 'scale(1.03)',
                      transition: 'filter 0.5s ease, transform 0.5s ease',
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
                  {fmt(product.price)}
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

            {/* Extra price para packs */}
            {product.categoryId?.includes('pack') && product.extraPrice && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 10,
                background: 'linear-gradient(135deg, rgba(247,103,7,0.08), rgba(247,103,7,0.03))',
                padding: '8px 16px', borderRadius: 12,
                border: '1px solid rgba(247,103,7,0.2)',
              }}>
                <span style={{ fontSize: '1.2rem' }}>💍</span>
                <div>
                  <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.58rem', color: COLORS.textMuted, display: 'block' }}>
                    Al llevarlo con tu anillo
                  </span>
                  <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.9rem', color: COLORS.orange, fontWeight: 800 }}>
                    + S/.{product.extraPrice}
                  </span>
                </div>
              </div>
            )}
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
                marginBottom: hasTallas ? 16 : 0,
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
          {hasTallas && (
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
                  }}>Seleccionada: {selectedTalla?.startsWith('V-') ? `Varon ${selectedTalla.slice(2)}` : selectedTalla?.startsWith('D-') ? `Dama ${selectedTalla.slice(2)}` : selectedTalla}</span>
                )}
              </div>

              {/* Tallas Varon */}
              {tallasVaron.length > 0 && (
                <div style={{ marginBottom: tallasDama.length > 0 ? 12 : 0 }}>
                  <span style={{
                    fontFamily: '"Outfit", sans-serif', fontSize: '0.62rem',
                    color: '#2c4a80', fontWeight: 600, display: 'block', marginBottom: 6,
                  }}>Varon</span>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {tallasVaron.map((t, i) => {
                      const val = `V-${t}`;
                      const isSelected = selectedTalla === val;
                      return (
                        <motion.button key={i} whileTap={{ scale: 0.9 }}
                          onClick={() => setSelectedTalla(isSelected ? null : val)}
                          style={{
                            fontFamily: '"Outfit", sans-serif', fontSize: '0.82rem', fontWeight: 600,
                            padding: '8px 18px', borderRadius: 12,
                            border: isSelected ? '2px solid #2c4a80' : `1.5px solid ${COLORS.borderLight}`,
                            color: isSelected ? COLORS.white : '#2c4a80',
                            background: isSelected ? 'linear-gradient(135deg, #2c4a80, #3d6098)' : COLORS.white,
                            cursor: 'pointer', transition: 'all 0.2s ease',
                            boxShadow: isSelected ? '0 4px 12px rgba(44,74,128,0.3)' : 'none',
                          }}>
                          {t}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tallas Dama */}
              {tallasDama.length > 0 && (
                <div>
                  <span style={{
                    fontFamily: '"Outfit", sans-serif', fontSize: '0.62rem',
                    color: '#c2255c', fontWeight: 600, display: 'block', marginBottom: 6,
                  }}>Dama</span>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {tallasDama.map((t, i) => {
                      const val = `D-${t}`;
                      const isSelected = selectedTalla === val;
                      return (
                        <motion.button key={i} whileTap={{ scale: 0.9 }}
                          onClick={() => setSelectedTalla(isSelected ? null : val)}
                          style={{
                            fontFamily: '"Outfit", sans-serif', fontSize: '0.82rem', fontWeight: 600,
                            padding: '8px 18px', borderRadius: 12,
                            border: isSelected ? '2px solid #c2255c' : `1.5px solid ${COLORS.borderLight}`,
                            color: isSelected ? COLORS.white : '#c2255c',
                            background: isSelected ? 'linear-gradient(135deg, #c2255c, #e64980)' : COLORS.white,
                            cursor: 'pointer', transition: 'all 0.2s ease',
                            boxShadow: isSelected ? '0 4px 12px rgba(194,37,92,0.3)' : 'none',
                          }}>
                          {t}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tallas antiguas (compatibilidad) */}
              {tallas.length > 0 && tallasVaron.length === 0 && tallasDama.length === 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {tallas.map((t, i) => {
                    const isSelected = selectedTalla === t;
                    return (
                      <motion.button key={i} whileTap={{ scale: 0.9 }}
                        onClick={() => setSelectedTalla(isSelected ? null : t)}
                        style={{
                          fontFamily: '"Outfit", sans-serif', fontSize: '0.82rem', fontWeight: 600,
                          padding: '8px 18px', borderRadius: 12,
                          border: isSelected ? `2px solid ${COLORS.orange}` : `1.5px solid ${COLORS.borderLight}`,
                          color: isSelected ? COLORS.white : COLORS.navy,
                          background: isSelected ? `linear-gradient(135deg, ${COLORS.orange}, #ff922b)` : COLORS.white,
                          cursor: 'pointer', transition: 'all 0.2s ease',
                          boxShadow: isSelected ? '0 4px 12px rgba(247,103,7,0.3)' : 'none',
                        }}>
                        {t}
                      </motion.button>
                    );
                  })}
                </div>
              )}
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

          {/* ====== CONTENIDOS DEL PACK ====== */}
          {product.categoryId?.includes('pack') && product.contenidos?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: '#fff4e6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(247,103,7,0.15)',
                }}>
                  <IconPackage size={14} color={COLORS.orange} />
                </div>
                <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem', color: COLORS.navy, fontWeight: 600 }}>
                  ¿Qué incluye este pack?
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {product.contenidos.map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 10,
                    background: '#fffaf5', border: '1px solid rgba(247,103,7,0.1)',
                  }}>
                    {item.imagen ? (
                      <img src={item.imagen} alt={item.nombre} style={{
                        width: 42, height: 42, borderRadius: 8, objectFit: 'cover',
                        border: '1px solid rgba(247,103,7,0.15)', flexShrink: 0,
                      }} />
                    ) : (
                      <div style={{
                        width: 42, height: 42, borderRadius: 8, flexShrink: 0,
                        background: '#fff4e6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid rgba(247,103,7,0.15)',
                      }}>
                        <span style={{ fontSize: '1.1rem' }}>📦</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS.orange, flexShrink: 0 }} />
                      <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.82rem', color: COLORS.navy, fontWeight: 500 }}>
                        {item.nombre}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ====== PRECIO CON CADA ANILLO — solo dentro de un pack ====== */}
          {isPack && allRings.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(44,74,128,0.1)' }}>
                  <IconDiamond size={14} color={COLORS.navy} />
                </div>
                <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem', color: COLORS.navy, fontWeight: 600 }}>
                  Precio total con cada anillo
                </span>
              </div>
              <p style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.68rem', color: COLORS.textMuted, marginBottom: 10, lineHeight: 1.5 }}>
                Al llevarlo con uno de nuestros anillos, el precio total sería:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {allRings.map((ring) => {
                  const combo = (parseFloat(ring.price)||0) + (parseFloat(product.price)||0);
                  return (
                    <div key={ring.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 12px', borderRadius: 12,
                      background: ring.soldOut ? '#f8f8f8' : 'white',
                      border: `1px solid ${COLORS.borderLight}`,
                      opacity: ring.soldOut ? 0.7 : 1,
                      boxShadow: ring.soldOut ? 'none' : '0 1px 5px rgba(0,0,0,0.04)',
                    }}>
                      {ring.images?.[0] ? (
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <img src={ring.images[0]} alt={ring.title} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', filter: ring.soldOut ? 'grayscale(0.6)' : 'none' }} />
                          {ring.soldOut && (
                            <div style={{ position: 'absolute', inset: 0, borderRadius: 8, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.4rem', fontWeight: 700, color: 'white', textAlign: 'center' }}>AGOTADO</span>
                            </div>
                          )}
                        </div>
                      ) : <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f0f0f0', flexShrink: 0 }} />}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.75rem', fontWeight: 600, color: ring.soldOut ? COLORS.textMuted : COLORS.navy }}>{ring.title}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 72 }}>
                        {ring.soldOut
                          ? <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.6rem', color: COLORS.textMuted, fontWeight: 600 }}>Agotado</span>
                          : <>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                                <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.56rem', color: COLORS.textMuted }}>Anillo</span>
                                <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.56rem', color: COLORS.textMuted }}>S/.{fmt(ring.price)}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                                <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.56rem', color: COLORS.textMuted }}>Pack</span>
                                <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.56rem', color: COLORS.textMuted }}>S/.{fmt(product.price)}</span>
                              </div>
                              <div style={{ height: 1, background: 'rgba(247,103,7,0.2)', margin: '2px 0' }} />
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                                <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.62rem', color: COLORS.orange, fontWeight: 700 }}>Total</span>
                                <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.62rem', color: COLORS.orange, fontWeight: 700 }}>S/.{fmt(combo)}</span>
                              </div>
                            </>
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ====== PACKS DISPONIBLES — solo dentro de un anillo, y solo si no viene desde categoría pack ====== */}
          {isAnillos && !hidePacks && allPacks.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
                paddingBottom: 12, borderBottom: `1px solid ${COLORS.borderLight}`,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: 'linear-gradient(135deg, #fff4e6, #ffe0c2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(247,103,7,0.2)', flexShrink: 0,
                }}>
                  <IconPackage size={15} color={COLORS.orange} />
                </div>
                <div>
                  <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '0.9rem', fontWeight: 700, color: COLORS.navy }}>
                    Packs de Presentación
                  </div>
                  <div style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.62rem', color: COLORS.textMuted, marginTop: 1 }}>
                    Hazlo especial · Precio total incluido
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {allPacks.map((pack) => {
                  const ringP = parseFloat(product.price)||0;
                  const packP = parseFloat(pack.price)||0;
                  const combo = ringP + packP;
                  return (
                    <div key={pack.id} style={{
                      borderRadius: 16, overflow: 'hidden',
                      border: `1.5px solid ${pack.soldOut ? COLORS.borderLight : 'rgba(247,103,7,0.2)'}`,
                      background: pack.soldOut ? '#f9f9f9' : 'white',
                      opacity: pack.soldOut ? 0.7 : 1,
                      boxShadow: pack.soldOut ? 'none' : '0 2px 12px rgba(247,103,7,0.08)',
                    }}>
                      {/* Franja superior con imagen + nombre + precio pack */}
                      <div style={{ display: 'flex', gap: 0 }}>
                        {/* Imagen grande */}
                        {pack.images?.[0] ? (
                          <div style={{ width: 90, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                            <img src={pack.images[0]} alt={pack.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 60%, rgba(255,255,255,0.2))' }} />
                          </div>
                        ) : (
                          <div style={{ width: 90, flexShrink: 0, background: 'linear-gradient(135deg, #fff4e6, #ffe0c2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IconPackage size={28} color="rgba(247,103,7,0.3)" />
                          </div>
                        )}

                        {/* Nombre + contenidos + precio pack */}
                        <div style={{ flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '0.9rem', fontWeight: 700, color: pack.soldOut ? COLORS.textMuted : COLORS.navy, marginBottom: 4 }}>
                              {pack.title}
                            </div>
                            {pack.contenidos?.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {pack.contenidos.map((c, i) => (
                                  <span key={i} style={{
                                    fontFamily: '"Outfit", sans-serif', fontSize: '0.55rem',
                                    background: '#fff4e6', color: COLORS.orange, fontWeight: 600,
                                    padding: '2px 6px', borderRadius: 10,
                                    border: '1px solid rgba(247,103,7,0.15)',
                                  }}>{c.nombre}</span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Precio del pack resaltado */}
                          {!pack.soldOut && (
                            <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6,
                              background: 'linear-gradient(90deg, rgba(247,103,7,0.12), rgba(247,103,7,0.05))',
                              padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(247,103,7,0.2)',
                            }}>
                              <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.58rem', color: COLORS.orange }}>Pack</span>
                              <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '1rem', color: COLORS.orange, fontWeight: 700 }}>S/.{fmt(packP)}</span>
                            </div>
                          )}
                          {pack.soldOut && (
                            <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.65rem', color: COLORS.textMuted, fontWeight: 600, marginTop: 6 }}>Agotado</span>
                          )}
                        </div>
                      </div>

                      {/* Franja desglose de precios */}
                      {!pack.soldOut && (
                        <div style={{
                          display: 'flex', alignItems: 'stretch',
                          borderTop: '1px solid rgba(247,103,7,0.12)',
                          background: 'linear-gradient(90deg, rgba(247,103,7,0.04), rgba(247,103,7,0.01))',
                        }}>
                          <div style={{ flex: 1, padding: '8px 14px', borderRight: '1px solid rgba(247,103,7,0.1)', textAlign: 'center' }}>
                            <div style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.52rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Anillo</div>
                            <div style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.78rem', color: COLORS.navy, fontWeight: 600 }}>S/.{fmt(ringP)}</div>
                          </div>
                          <div style={{ flex: 1, padding: '8px 14px', borderRight: '1px solid rgba(247,103,7,0.1)', textAlign: 'center' }}>
                            <div style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.52rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pack</div>
                            <div style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.78rem', color: COLORS.navy, fontWeight: 600 }}>S/.{fmt(packP)}</div>
                          </div>
                          <div style={{ flex: 1.2, padding: '8px 14px', textAlign: 'center', background: 'rgba(247,103,7,0.06)' }}>
                            <div style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.52rem', color: COLORS.orange, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Total</div>
                            <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '0.95rem', color: COLORS.orange, fontWeight: 700 }}>S/.{fmt(combo)}</div>
                          </div>
                        </div>
                      )}

                      {/* Botón Ver detalles */}
                      <button
                        onClick={() => setSelectedPackDetail(pack)}
                        style={{
                          width: '100%', padding: '9px 14px',
                          background: pack.soldOut ? 'transparent' : COLORS.navy,
                          border: 'none', borderTop: `1px solid ${pack.soldOut ? COLORS.borderLight : COLORS.navy}`,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          fontFamily: '"Outfit", sans-serif', fontSize: '0.68rem',
                          color: pack.soldOut ? COLORS.textMuted : 'white',
                          fontWeight: 600, letterSpacing: '0.3px',
                        }}
                      >
                        Ver contenido del pack
                        <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>›</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ====== BOTON WHATSAPP (solo si showWhatsapp esta activo) ====== */}
          {!product.soldOut && product.showWhatsapp && (() => {
            const { number, encoded } = whatsappMsg();
            return (
              <motion.a
                href={`https://wa.me/${number}?text=${encoded}`}
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
            );
          })()}
        </div>
      </div>
    </Modal>

    {/* ====== MODAL DE DETALLE DEL PACK (anidado) ====== */}
    {selectedPackDetail && (
      <PackDetailModal
        pack={selectedPackDetail}
        onClose={() => setSelectedPackDetail(null)}
        ringProduct={product}
      />
    )}
    </>
  );
}

/* ====== PACK DETAIL MODAL ====== */
function PackDetailModal({ pack, onClose, ringProduct }) {
  const images = pack.images || [];
  const [currentImg, setCurrentImg] = React.useState(0);
  const combo = (parseFloat(ringProduct?.price)||0) + (parseFloat(pack.price)||0);

  return (
    <Modal opened={true} onClose={onClose}
      title={pack.title}
      centered size="md" radius="lg"
      styles={{ title: { fontFamily: '"Playfair Display", serif', fontWeight: 600, color: COLORS.navy } }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Imagen */}
        {images.length > 0 && (
          <div style={{ borderRadius: 12, overflow: 'hidden', aspectRatio: '4/3', background: '#f5f5f5' }}>
            <img src={images[currentImg]} alt={pack.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        {images.length > 1 && (
          <div style={{ display: 'flex', gap: 6 }}>
            {images.map((img, i) => (
              <img key={i} src={img} alt="" onClick={() => setCurrentImg(i)}
                style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', cursor: 'pointer', border: `2px solid ${i === currentImg ? COLORS.orange : 'transparent'}`, opacity: i === currentImg ? 1 : 0.6 }} />
            ))}
          </div>
        )}

        {/* Descripción */}
        {pack.description && (
          <p style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.82rem', color: COLORS.textMuted, lineHeight: 1.6, margin: 0 }}>
            {pack.description}
          </p>
        )}

        {/* Precio pack + precio combo */}
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, padding: '10px 14px', borderRadius: 12, background: '#fff4e6', border: '1px solid rgba(247,103,7,0.15)', textAlign: 'center' }}>
            <div style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.58rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Pack solo</div>
            <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', color: COLORS.orange, fontWeight: 700 }}>S/.{fmt(pack.price)}</div>
          </div>
          {ringProduct && (
            <div style={{ flex: 1, padding: '10px 14px', borderRadius: 12, background: '#f0f4ff', border: '1px solid rgba(44,74,128,0.12)', textAlign: 'center' }}>
              <div style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.58rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Con tu anillo</div>
              <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', color: COLORS.navy, fontWeight: 700 }}>
                S/.{fmt(combo)}
              </div>
            </div>
          )}
        </div>

        {/* Contenidos */}
        {pack.contenidos?.length > 0 && (
          <div>
            <div style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.72rem', fontWeight: 700, color: COLORS.navy, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Incluye
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {pack.contenidos.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: '#fffaf5', border: '1px solid rgba(247,103,7,0.1)' }}>
                  {item.imagen
                    ? <img src={item.imagen} alt={item.nombre} style={{ width: 36, height: 36, borderRadius: 7, objectFit: 'cover', flexShrink: 0 }} />
                    : <div style={{ width: 36, height: 36, borderRadius: 7, background: '#fff4e6', flexShrink: 0 }} />
                  }
                  <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.78rem', color: COLORS.navy, fontWeight: 500 }}>{item.nombre}</span>
                </div>
              ))}
            </div>
          </div>
        )}
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