// src/components/ProductModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Modal, Badge } from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconDiamond, IconChevronLeft, IconChevronRight, IconRuler2,
  IconSparkles, IconPackage, IconBrandWhatsapp,
  IconHeart, IconX, IconInfoCircle, IconDroplet,
  IconCategory, IconZoomIn, IconGift, IconFileText, IconAlignLeft, IconCheck,
} from '@tabler/icons-react';
import { COLORS } from '../utils/theme';
import { getWhatsappNumber, trackProductView } from '../utils/store';
import { getProductInventory, isSizeOutOfStock, getSizeStock } from '../utils/inventory';
import useImages from '../hooks/useImages';

const fmt = (n) => parseFloat(n || 0).toFixed(2);

export default function ProductModal({ product: initialProduct, open, onClose, storeData = null, hidePacks = false, comboPrice = null, packPrice = null, packData = null, siblingProducts = null, siblingIndex = null, cachedImages = null }) {
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedTalla, setSelectedTalla] = useState(null);
  const [liked, setLiked] = useState(false);
  const [imageZoomed, setImageZoomed] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImgSrc, setLightboxImgSrc] = useState(null); // para fotos de agregados/cajas
  const [pinchScale, setPinchScale] = useState(1);
  const pinchStartDist = useRef(null);
  const pinchStartScale = useRef(1);

  const [modalImgLoaded, setModalImgLoaded] = useState(false);
  const [selectedPackDetail, setSelectedPackDetail] = useState(null);
  const [inv, setInv] = useState(null); // inventario del producto actual

  // Navegación entre productos hermanos
  const [activeIndex, setActiveIndex] = useState(siblingIndex ?? 0);
  const [swipeDir, setSwipeDir] = useState(0); // -1 = izq, 1 = der
  const hasSiblings = siblingProducts && siblingProducts.length > 1;
  const product = hasSiblings ? siblingProducts[activeIndex] : initialProduct;

  const galleryRef = useRef(null);
  // Imágenes del caché independiente para este producto
  const _fetchedImages = useImages(product?.id);
  const images = (_fetchedImages !== null && _fetchedImages.length > 0)
    ? _fetchedImages
    : (cachedImages?.length ? cachedImages : (product?.images || []));

  // Precargar imágenes del producto actual, hermanos cercanos, y packs relacionados
  useEffect(() => {
    if (!open) return;
    const ids = new Set();
    if (product?.id) ids.add(product.id);
    if (hasSiblings) {
      const next = siblingProducts[(activeIndex + 1) % siblingProducts.length];
      const prev = siblingProducts[(activeIndex - 1 + siblingProducts.length) % siblingProducts.length];
      if (next?.id) ids.add(next.id);
      if (prev?.id) ids.add(prev.id);
    }
    // Pre-cargar también packs si el producto es un anillo
    if (product?.categoryId?.includes('anillo') && storeData) {
      (storeData.products || [])
        .filter(p => p.categoryId?.includes('pack'))
        .forEach(p => ids.add(p.id));
    }
    if (ids.size > 0) {
      import('../utils/imageCache').then(({ preloadImagesInBatches }) => {
        preloadImagesInBatches([...ids], 6);
      });
    }
  }, [open, activeIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) {
      setCurrentImage(0);
      setSelectedTalla(null);
      setImageZoomed(false);
      setModalImgLoaded(false);
      setLightboxOpen(false);
      setLightboxImgSrc(null);
      setPinchScale(1);
      setActiveIndex(siblingIndex ?? 0);
    }
  }, [open, siblingIndex]);

  // Reset imagen al cambiar de producto
  useEffect(() => {
    setCurrentImage(0);
    setSelectedTalla(null);
    setModalImgLoaded(false);
  }, [activeIndex]);

  // Cargar inventario del producto actual
  useEffect(() => {
    if (!open || !product?.id) return;
    setInv(null);
    getProductInventory(product.id).then(data => setInv(data));
  }, [open, product?.id]);

  if (!product) return null;

  const nextImage = (e) => { e?.stopPropagation(); setModalImgLoaded(false); setCurrentImage((p) => (p + 1) % images.length); };
  const prevImage = (e) => { e?.stopPropagation(); setModalImgLoaded(false); setCurrentImage((p) => (p - 1 + images.length) % images.length); };

  const nextProduct = () => { if (hasSiblings) { setSwipeDir(-1); setActiveIndex(p => (p + 1) % siblingProducts.length); } };
  const prevProduct = () => { if (hasSiblings) { setSwipeDir(1);  setActiveIndex(p => (p - 1 + siblingProducts.length) % siblingProducts.length); } };

  const tallas = product.tallas || [];
  const tallasVaron = product.tallasVaron || [];
  const tallasDama = product.tallasDama || [];
  // Ordenar tallas numéricamente de menor a mayor
  const sortTallas = (arr) => [...arr].sort((a, b) => parseFloat(a) - parseFloat(b) || String(a).localeCompare(String(b)));
  const tallasVaronSorted = sortTallas(tallasVaron);
  const tallasDamaSorted  = sortTallas(tallasDama);
  const tallasLegacySorted = sortTallas(tallas);
  const isAnillos = product.categoryId?.includes('anillo');
  const isPack = product.categoryId?.includes('pack');
  const hasTallas = isAnillos && (tallas.length > 0 || tallasVaron.length > 0 || tallasDama.length > 0);
  const hasSpecs = product.material || (product.platingType && product.plating) || product.tipoPiedra || product.acabado;

  const allRings = storeData
    ? (storeData.products || []).filter(p => p.categoryId?.includes('anillo')).sort((a,b) => (a.sortOrder??9999)-(b.sortOrder??9999))
    : [];
  const allPacks = storeData
    ? (storeData.products || []).filter(p => p.categoryId?.includes('pack')).sort((a,b) => (a.sortOrder??9999)-(b.sortOrder??9999))
    : [];

  const whatsappMsg = () => {
    const number = getWhatsappNumber();
    let msg = `Hola, buen día! Vi el catálogo y me interesa el siguiente producto:\n\n*${product.title}*`;
    if (product.price) msg += `\nPrecio: S/.${product.price}`;
    if (product.material) msg += `\nMaterial: ${product.material}`;
    if (product.platingType && product.plating) msg += `\n${product.platingType}: ${product.plating}`;
    if (product.tipoPiedra) msg += `\nPiedra: ${product.tipoPiedra}${product.colorPiedra ? ' ' + product.colorPiedra : ''}`;
    if (product.acabado) msg += `\nAcabado: ${product.acabado}`;
    if (selectedTalla) {
      const label = selectedTalla.startsWith('V-') ? `Talla Varón: ${selectedTalla.slice(2)}` :
                    selectedTalla.startsWith('D-') ? `Talla Dama: ${selectedTalla.slice(2)}` :
                    `Talla: ${selectedTalla}`;
      msg += `\n${label}`;
    }
    msg += `\n\n¿Podría darme más información sobre disponibilidad y formas de pago? Gracias.`;
    return { number, encoded: encodeURIComponent(msg) };
  };

  // Swipe horizontal — ignora si el gesto es vertical (scroll)
  const swipeTouchStartRef = useRef(null);
  const swipeLockedRef = useRef(null); // 'h' = horizontal bloqueado, 'v' = vertical bloqueado

  const handleSwipeTouchStart = (e) => {
    swipeTouchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    swipeLockedRef.current = null;
  };

  const handleSwipeTouchMove = (e) => {
    if (!swipeTouchStartRef.current || swipeLockedRef.current) return;
    const dx = Math.abs(e.touches[0].clientX - swipeTouchStartRef.current.x);
    const dy = Math.abs(e.touches[0].clientY - swipeTouchStartRef.current.y);
    // Necesita al menos 8px de movimiento para decidir dirección
    if (dx + dy < 8) return;
    // Si se mueve más vertical que horizontal → es scroll, bloqueamos swipe
    swipeLockedRef.current = dy > dx ? 'v' : 'h';
  };

  const handleSwipeTouchEnd = (e) => {
    if (!swipeTouchStartRef.current || !hasSiblings) return;
    const dx = swipeTouchStartRef.current.x - e.changedTouches[0].clientX;
    const locked = swipeLockedRef.current;
    swipeTouchStartRef.current = null;
    swipeLockedRef.current = null;
    // Cancelar si fue gesto vertical o no alcanzó 120px horizontal
    if (locked === 'v') return;
    if (Math.abs(dx) < 120) return;
    if (dx > 0) nextProduct(); else prevProduct();
  };

  return (
    <>
    <Modal
      opened={open}
      onClose={onClose}
      fullScreen
      radius={0}
      padding={0}
      transitionProps={{ transition: 'fade', duration: 180 }}
      withCloseButton={false}
      styles={{
        body: { padding: 0, background: COLORS.white },
        content: { background: COLORS.white },
      }}
    >
      <div
        style={{ width: '100%', position: 'relative' }}
        onTouchStart={handleSwipeTouchStart}
        onTouchMove={handleSwipeTouchMove}
        onTouchEnd={handleSwipeTouchEnd}
      >

        {/* ====== HEADER ====== */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${COLORS.borderLight}`,
          padding: '0 16px',
          height: 52,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Volver */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '6px 10px 6px 4px', borderRadius: 10,
            }}
          >
            <IconChevronLeft size={20} color={COLORS.navy} strokeWidth={2.5} />
            <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.82rem', color: COLORS.navy, fontWeight: 600 }}>Volver</span>
          </motion.button>

          {/* Dots centrados */}
          {hasSiblings && (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {siblingProducts.slice(0, 14).map((_, i) => (
                <motion.div key={i}
                  animate={{ width: i === activeIndex ? 18 : 6, background: i === activeIndex ? COLORS.orange : COLORS.borderLight }}
                  transition={{ duration: 0.22 }}
                  onClick={() => setActiveIndex(i)}
                  style={{ height: 6, borderRadius: 3, cursor: 'pointer' }}
                />
              ))}
            </div>
          )}

          {/* Corazón */}
          <motion.button
            whileTap={{ scale: 0.82 }}
            onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
            style={{
              background: liked ? '#fee6e6' : COLORS.offWhite,
              border: `1px solid ${liked ? '#ffb3b3' : COLORS.borderLight}`,
              borderRadius: '50%', width: 38, height: 38, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s, border 0.2s',
            }}
          >
            <motion.div animate={liked ? { scale: [1, 1.4, 1] } : { scale: 1 }} transition={{ duration: 0.28 }}>
              <IconHeart size={18} color={liked ? '#e11d48' : COLORS.textMuted} fill={liked ? '#e11d48' : 'none'} />
            </motion.div>
          </motion.button>
        </div>

        {/* ====== GALERIA DE IMAGENES ====== */}
        {/* overflow:hidden evita que el slide saliente sea visible fuera del área */}
        <div style={{ overflow: 'hidden', position: 'relative', background: COLORS.white }}>
        <AnimatePresence mode="sync" custom={swipeDir} initial={false}>
        <motion.div
          key={`product-${activeIndex}`}
          custom={swipeDir}
          variants={{
            enter: (dir) => ({ x: dir < 0 ? '60%' : '-60%', opacity: 0, scale: 0.96 }),
            center: { x: 0, opacity: 1, scale: 1 },
            exit:  (dir) => ({ x: dir < 0 ? '-60%' : '60%', opacity: 0, scale: 0.96 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: '100%', background: COLORS.white, willChange: 'transform, opacity' }}
        >
        <div style={{ position: 'relative', background: COLORS.offWhite }}>
          {images.length > 0 ? (
            <>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentImage}
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setLightboxOpen(true)}
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
                    loading="eager"
                    fetchPriority="high"
                    onLoad={() => setModalImgLoaded(true)}
                    style={{
                      width: '100%',
                      aspectRatio: '1/1',
                      objectFit: 'cover',
                      display: 'block',
                      filter: modalImgLoaded ? 'none' : 'blur(12px)',
                      transform: modalImgLoaded ? 'scale(1)' : 'scale(1.03)',
                      transition: 'filter 0.5s ease, transform 0.5s ease',
                    }}
                  />
                </motion.div>
              </AnimatePresence>

              {/* Zoom button */}
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => setLightboxOpen(true)}
                style={{
                  position: 'absolute', bottom: 12, right: 12, zIndex: 6,
                  background: 'rgba(26,39,68,0.65)', backdropFilter: 'blur(8px)',
                  border: 'none', borderRadius: 10, width: 34, height: 34,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <IconZoomIn size={16} color="white" />
              </motion.button>

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
            <div className="no-image-placeholder" style={{ aspectRatio: '1/1', height: 'auto' }}>
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
        <div style={{ padding: '20px 20px 40px' }}>

          {/* Titulo y precio */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.036, ease: [0.22,1,0.36,1] }}
            style={{ marginBottom: 16 }}>
            <h1 style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: '1.55rem', fontWeight: 600,
              color: COLORS.navy, marginBottom: 10, lineHeight: 1.25,
            }}>
              {product.title}
            </h1>

            {/* Precio + navegación lateral */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

              {/* Precio */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                background: `linear-gradient(135deg, ${COLORS.orangePale}, #fff4e6)`,
                padding: '10px 20px', borderRadius: 16,
                border: '1px solid rgba(247,103,7,0.12)',
                flex: 1,
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

              {/* Botones de navegación entre productos */}
              {hasSiblings && (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  background: '#f5f6f8',
                  border: '1px solid #e8eaed',
                  borderRadius: 14, padding: '8px 8px',
                  flexShrink: 0,
                }}>
                  <motion.button
                    whileTap={{ scale: 0.84 }}
                    onClick={prevProduct}
                    style={{
                      background: 'white', border: '1px solid #e2e5ea',
                      borderRadius: 9, width: 34, height: 34, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                    }}
                  >
                    <IconChevronLeft size={16} color={COLORS.textMuted} strokeWidth={2} />
                  </motion.button>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <span style={{
                      fontFamily: '"Outfit", sans-serif', fontSize: '0.62rem', fontWeight: 700,
                      color: COLORS.navy, lineHeight: 1,
                    }}>{activeIndex + 1}</span>
                    <div style={{ width: 14, height: 1, background: '#d0d4da', borderRadius: 1 }} />
                    <span style={{
                      fontFamily: '"Outfit", sans-serif', fontSize: '0.58rem',
                      color: COLORS.textMuted, lineHeight: 1,
                    }}>{siblingProducts.length}</span>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.84 }}
                    onClick={nextProduct}
                    style={{
                      background: 'white', border: '1px solid #e2e5ea',
                      borderRadius: 9, width: 34, height: 34, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                    }}
                  >
                    <IconChevronRight size={16} color={COLORS.textMuted} strokeWidth={2} />
                  </motion.button>
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
                <IconDiamond size={20} color={COLORS.orange} />
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

            {/* ====== COMBO PACK: desglose + total cuando viene desde un pack ====== */}
            {comboPrice !== null && packPrice !== null && (
              <div style={{ marginTop: 14 }}>

                {/* Banner del pack: [imagen] [título+precio] [contenidos] — 3 columnas */}
                {packData && (
                  <div style={{
                    borderRadius: 16, overflow: 'hidden',
                    border: '1px solid rgba(26,39,68,0.15)',
                    boxShadow: '0 4px 20px rgba(26,39,68,0.14)',
                    background: `linear-gradient(135deg, ${COLORS.navy} 0%, #1a3260 100%)`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 120 }}>

                      {/* Col 1: Imagen que llena todo el espacio con viñeta azul */}
                      <div style={{ width: 100, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                        <PackImg
                          packId={packData.id}
                          fallbackImages={packData.images}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          fallbackStyle={{ width: 100, height: '100%', minHeight: 120, background: 'rgba(255,255,255,0.07)' }}
                        />
                        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 35%, rgba(26,39,68,0.5) 100%)', pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(26,39,68,0.15) 0%, transparent 35%, transparent 65%, rgba(26,39,68,0.65) 100%)', pointerEvents: 'none' }} />
                      </div>

                      {/* Col 2: Título + precio — juntos, centrados verticalmente */}
                      <div style={{ width: 120, flexShrink: 0, padding: '12px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6, borderRight: '1px solid rgba(255,255,255,0.08)' }}>
                        <div>
                          <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.46rem', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 700, display: 'block', marginBottom: 4 }}>Pack incluido</span>
                          <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '0.82rem', fontWeight: 700, color: 'white', lineHeight: 1.25, display: 'block' }}>{packData.title}</span>
                        </div>
                        <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2 }}>
                          <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.56rem', color: 'rgba(247,103,7,0.85)', fontWeight: 600 }}>S/.</span>
                          <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '1.15rem', fontWeight: 900, color: COLORS.orange, lineHeight: 1 }}>{fmt(packPrice)}</span>
                        </div>
                      </div>

                      {/* Col 3: Todo lo que incluye */}
                      <div style={{ flex: 1, padding: '10px 11px', overflow: 'hidden' }}>
                        <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.44rem', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, display: 'block', marginBottom: 7 }}>Incluye</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {(packData.contenidos || []).map((c, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 24, height: 24, borderRadius: 6, flexShrink: 0, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.07)' }}>
                                {c.imagen ? (
                                  <img src={c.imagen} alt={c.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
                                ) : (
                                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <IconPackage size={10} color="rgba(255,255,255,0.3)" />
                                  </div>
                                )}
                              </div>
                              <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.62rem', color: 'rgba(255,255,255,0.82)', fontWeight: 500, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nombre}</span>
                            </div>
                          ))}
                        </div>
                        {/* Botón ver detalle si hay contenido */}
                        {packData.contenidos?.length > 0 && (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedPackDetail(packData)}
                            style={{ marginTop: 7, display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, padding: '3px 8px', cursor: 'pointer', fontFamily: '"Outfit", sans-serif', fontSize: '0.55rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}
                          >
                            Ver detalle <IconChevronRight size={9} color="rgba(255,255,255,0.5)" />
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Fila desglose anillo + pack */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '10px 14px', borderRadius: 12, background: '#f8f9fb', border: `1px solid ${COLORS.borderLight}` }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.5rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 2, fontWeight: 600 }}>Anillo</span>
                    <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.95rem', color: COLORS.navy, fontWeight: 800 }}>S/.{fmt(product.price)}</span>
                  </div>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'white', border: `1px solid ${COLORS.borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.85rem', color: COLORS.textMuted, fontWeight: 400, lineHeight: 1 }}>+</span>
                  </div>
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.5rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 2, fontWeight: 600 }}>Pack</span>
                    <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.95rem', color: COLORS.navy, fontWeight: 800 }}>S/.{fmt(packPrice)}</span>
                  </div>
                </div>

                {/* Total navy premium */}
                <div style={{
                  position: 'relative', overflow: 'hidden',
                  background: `linear-gradient(120deg, ${COLORS.navy} 0%, #1a3260 100%)`,
                  borderRadius: 16, padding: '16px 20px', marginTop: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  boxShadow: '0 8px 28px rgba(26,39,68,0.28)',
                }}>
                  <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(212,165,116,0.07)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', bottom: -18, left: -10, width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(212,165,116,0.14)', border: '1px solid rgba(212,165,116,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <IconSparkles size={18} color={COLORS.gold} />
                    </div>
                    <div>
                      <div style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.55rem', color: 'rgba(212,165,116,0.6)', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 700, marginBottom: 3 }}>Precio total</div>
                      <div style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}>Anillo + Pack</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.9rem', color: 'rgba(212,165,116,0.75)', fontWeight: 600 }}>S/.</span>
                    <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '2.4rem', color: 'white', fontWeight: 900, lineHeight: 1, letterSpacing: '-1px' }}>{fmt(comboPrice)}</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Linea decorativa */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.22, delay: 0.068, ease: [0.22,1,0.36,1] }}
            style={{
              height: 2, borderRadius: 1, marginBottom: 20,
              background: `linear-gradient(90deg, ${COLORS.orange}, ${COLORS.gold}, transparent)`,
              width: 80, transformOrigin: 'left',
            }} />

          {/* ====== ESPECIFICACIONES (solo material y chapado) ====== */}
          {hasSpecs && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.081, ease: [0.22,1,0.36,1] }}
              style={{ marginBottom: 24 }}>
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
                {product.acabado && (
                  <SpecItem icon={IconRuler2} label="Acabado" value={product.acabado} color="#0f766e" bg="#f0fdfa" />
                )}
                {product.tipoPiedra && (
                  <SpecItem icon={IconDiamond} label="Piedra"
                    value={product.colorPiedra ? `${product.tipoPiedra} · ${product.colorPiedra}` : product.tipoPiedra}
                    color="#7c3aed" bg="#f3f0ff" />
                )}
              </div>
            </motion.div>
          )}

          {/* ====== TALLAS ====== */}
          {hasTallas && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.108, ease: [0.22,1,0.36,1] }}
              style={{ marginBottom: 24 }}>
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
                  }}>Varón</span>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {tallasVaronSorted.map((t, i) => {
                      const val = `V-${t}`;
                      const isSelected = selectedTalla === val;
                      const outOfStock = isSizeOutOfStock(inv, val);
                      return (
                        <motion.button key={i} whileTap={{ scale: outOfStock ? 1 : 0.9 }}
                          onClick={() => !outOfStock && setSelectedTalla(isSelected ? null : val)}
                          style={{
                            fontFamily: '"Outfit", sans-serif', fontSize: '0.82rem', fontWeight: 600,
                            padding: outOfStock ? '6px 14px' : '8px 18px', borderRadius: 12,
                            border: outOfStock ? '1.5px solid #e11d4833' : isSelected ? '2px solid #2c4a80' : `1.5px solid ${COLORS.borderLight}`,
                            color: outOfStock ? '#e11d48' : isSelected ? COLORS.white : '#2c4a80',
                            background: outOfStock ? '#fff5f5' : isSelected ? 'linear-gradient(135deg, #2c4a80, #3d6098)' : COLORS.white,
                            cursor: outOfStock ? 'not-allowed' : 'pointer',
                            opacity: outOfStock ? 0.75 : 1,
                            transition: 'all 0.2s ease',
                            boxShadow: isSelected ? '0 4px 12px rgba(44,74,128,0.3)' : 'none',
                            position: 'relative',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                          }}>
                          <span>{t}</span>
                          {outOfStock && (
                            <span style={{ fontSize: '0.45rem', fontWeight: 700, letterSpacing: '0.5px', color: '#e11d48' }}>AGOTADO</span>
                          )}
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
                    {tallasDamaSorted.map((t, i) => {
                      const val = `D-${t}`;
                      const isSelected = selectedTalla === val;
                      const outOfStock = isSizeOutOfStock(inv, val);
                      return (
                        <motion.button key={i} whileTap={{ scale: outOfStock ? 1 : 0.9 }}
                          onClick={() => !outOfStock && setSelectedTalla(isSelected ? null : val)}
                          style={{
                            fontFamily: '"Outfit", sans-serif', fontSize: '0.82rem', fontWeight: 600,
                            padding: outOfStock ? '6px 14px' : '8px 18px', borderRadius: 12,
                            border: outOfStock ? '1.5px solid #e11d4833' : isSelected ? '2px solid #c2255c' : `1.5px solid ${COLORS.borderLight}`,
                            color: outOfStock ? '#e11d48' : isSelected ? COLORS.white : '#c2255c',
                            background: outOfStock ? '#fff5f5' : isSelected ? 'linear-gradient(135deg, #c2255c, #e64980)' : COLORS.white,
                            cursor: outOfStock ? 'not-allowed' : 'pointer',
                            opacity: outOfStock ? 0.75 : 1,
                            transition: 'all 0.2s ease',
                            boxShadow: isSelected ? '0 4px 12px rgba(194,37,92,0.3)' : 'none',
                            position: 'relative',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                          }}>
                          <span>{t}</span>
                          {outOfStock && (
                            <span style={{ fontSize: '0.45rem', fontWeight: 700, letterSpacing: '0.5px', color: '#e11d48' }}>AGOTADO</span>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tallas antiguas (compatibilidad) */}
              {tallas.length > 0 && tallasVaron.length === 0 && tallasDama.length === 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {tallasLegacySorted.map((t, i) => {
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
            </motion.div>
          )}

          {/* ====== Descripción ====== */}
          {product.description && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.135, ease: [0.22,1,0.36,1] }}
              style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: COLORS.orangePale, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(247,103,7,0.1)',
                }}>
                  <IconAlignLeft size={14} color={COLORS.orange} />
                </div>
                <span style={{
                  fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem',
                  color: COLORS.navy, fontWeight: 600,
                }}>Descripción</span>
              </div>
              <p style={{
                fontFamily: '"Outfit", sans-serif', fontSize: '0.85rem',
                lineHeight: 1.75, color: COLORS.textMuted,
                padding: '14px 16px', borderRadius: 12,
                background: COLORS.offWhite, border: `1px solid ${COLORS.borderLight}`,
                whiteSpace: 'pre-wrap',
              }}>
                {product.description}
              </p>
            </motion.div>
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
                        <IconPackage size={20} color={COLORS.orange} />
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
                      <div style={{ position: 'relative', flexShrink: 0, width: 40, height: 40 }}>
                        <PackImg packId={ring.id} fallbackImages={ring.images}
                          style={{ width: '100%', height: '100%', borderRadius: 8, objectFit: 'cover', filter: ring.soldOut ? 'grayscale(0.6)' : 'none' }}
                          fallbackStyle={{ width: 40, height: 40, borderRadius: 8, background: '#f0f0f0' }} />
                        {ring.soldOut && (
                          <div style={{ position: 'absolute', inset: 0, borderRadius: 8, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.4rem', fontWeight: 700, color: 'white', textAlign: 'center' }}>AGOTADO</span>
                          </div>
                        )}
                      </div>
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

          {/* ====== INCLUYE GRATIS: caja según precio + agregados — solo anillos ====== */}
          {isAnillos && !hidePacks && (() => {
            const ringBoxes = storeData?.ringBoxes || {};
            const isPremium = parseFloat(product.price || 0) >= 40;
            const boxData = isPremium
              ? (ringBoxes.premium || { title: 'Caja Premium', photo: '', label: 'Incluida' })
              : (ringBoxes.cheap   || { title: 'Caja de anillo', photo: '', label: 'Incluida' });
            const agregados = (storeData?.agregados || []).sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));

            const GREEN       = '#1a7c3e';
            const GREEN_LIGHT = '#d6f0e0';   // verde claro para el fondo de la card
            const GREEN_MID   = '#2d9e56';

            // La "imagen pequeña" usa la segunda foto de la caja si existe, si no la misma
            // boxData.photo es la foto principal; boxData.photo2 sería la segunda (si el admin la sube)
            // Por ahora usamos la misma foto con filtro diferente como miniatura
            const photoMain  = boxData.photo  || '';
            const photoThumb = boxData.photo2 || boxData.photo || '';

            return (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.08, ease: [0.22,1,0.36,1] }}
                style={{ marginBottom: 24 }}
              >
                {/* ── Header centrado ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, #2d9e5633)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <IconGift size={13} color={GREEN} />
                    <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.6rem', fontWeight: 700, color: GREEN, textTransform: 'uppercase', letterSpacing: '1.1px' }}>
                      Incluye gratis con tu anillo
                    </span>
                    <IconGift size={13} color={GREEN} />
                  </div>
                  <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #2d9e5633, transparent)' }} />
                </div>

                {/* ── Card principal: fondo verde claro ── */}
                <div style={{
                  position: 'relative',
                  background: GREEN_LIGHT,        // fondo verde claro como pediste
                  borderRadius: 18,
                  border: '1.5px solid #b2dfc4',
                  overflow: 'visible',            // visible para que la miniatura pueda sobresalir
                  marginBottom: agregados.length > 0 ? 22 : 0,
                  // padding bottom suficiente para que la mini no tape nada importante
                  paddingBottom: 16,
                }}>

                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>

                    {/* ══ ZONA IZQUIERDA ══ */}
                    <div style={{
                      position: 'relative',
                      width: 154,
                      flexShrink: 0,
                      // Alto = imagen grande (155) + margen top (14) + espacio para mini (38)
                      minHeight: 207,
                    }}>

                      {/* Grid de puntos: sale por la izquierda, solapado entre el borde
                          exterior de la card y el borde izquierdo de la imagen grande.
                          Posición: top alineado con la imagen, left negativo para salir */}
                      <SquaresGrid
                        color="#000000"
                        rows={6} cols={5} gap={6} size={3.2}
                        style={{
                          position: 'absolute',
                          top: 22,
                          left: -14,
                          opacity: 0.65,
                          pointerEvents: 'none',
                          zIndex: 0,
                        }}
                      />

                      {/* Imagen grande con borde blanco */}
                      <div style={{
                        position: 'absolute',
                        top: 14,
                        left: 20,            // margen izquierdo para que los puntos queden entre él y el borde
                        width: 126,
                        height: 152,
                        borderRadius: 14,
                        border: '2.5px solid white',
                        background: 'white',
                        overflow: 'hidden',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.13)',
                        zIndex: 1,
                        cursor: photoMain ? 'zoom-in' : 'default',
                      }} onClick={() => { if (photoMain) setLightboxImgSrc(photoMain); }}>
                        {photoMain ? (
                          <>
                            <img src={photoMain} alt={boxData.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            <div style={{
                              position: 'absolute', bottom: 7, right: 7,
                              width: 22, height: 22, borderRadius: 7,
                              background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(6px)',
                              border: '1px solid rgba(255,255,255,0.3)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              pointerEvents: 'none',
                            }}>
                              <IconZoomIn size={11} color="rgba(255,255,255,0.92)" strokeWidth={2} />
                            </div>
                          </>
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e8f5ee' }}>
                            <IconGift size={44} color={GREEN + '66'} />
                          </div>
                        )}
                      </div>

                      {/* Imagen pequeña:
                          - Posicionada sobre la esquina inferior izquierda de la imagen GRANDE
                          - top = 14(marginTop) + 152(alto img) - 38(mitad de la mini) = 128
                            → queda mitad dentro de la img grande, mitad fuera
                          - left = 20(margenImg) - 10(sobresale a la izq) = 10
                          - zIndex > imagen grande para estar encima
                          - NO tapa la lupa (que está en la esquina inferior derecha) */}
                      <div style={{
                        position: 'absolute',
                        top: 128,             // queda superpuesta en el borde inferior de la img grande
                        left: 10,             // sobresale un poco a la izquierda de la img grande
                        width: 68,
                        height: 68,
                        borderRadius: 12,
                        overflow: 'hidden',
                        border: '3px solid white',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                        zIndex: 4,            // encima de la imagen grande (z:1) y los puntos (z:0)
                        background: '#e8f5ee',
                        cursor: photoThumb ? 'zoom-in' : 'default',
                      }} onClick={() => { if (photoThumb) setLightboxImgSrc(photoThumb); }}>
                        {photoThumb ? (
                          <img src={photoThumb} alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IconGift size={24} color={GREEN} />
                          </div>
                        )}

                      </div>

                    </div>{/* fin zona izquierda */}

                    {/* ══ ZONA DERECHA: info ══ */}
                    <div style={{
                      flex: 1,
                      padding: '18px 16px 10px 10px',
                      display: 'flex', flexDirection: 'column', gap: 10,
                    }}>

                      {/* Badge "INCLUIDA GRATIS" */}
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, alignSelf: 'flex-start' }}>
                        <IconSparkles size={10} color={GREEN} />
                        <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.55rem', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: GREEN }}>
                          {boxData.label || 'Incluida gratis'}
                        </span>
                      </div>

                      {/* Título */}
                      <div style={{
                        fontFamily: '"Playfair Display", serif',
                        fontSize: '0.95rem', fontWeight: 700,
                        color: '#111', lineHeight: 1.25,
                      }}>
                        {boxData.title || (isPremium ? 'Caja Premium' : 'Caja de anillo')}
                      </div>

                      {/* Checkmarks */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {[
                          isPremium ? 'Presentación premium de lujo' : 'Presentación elegante',
                          'Protege y conserva el anillo',
                          'Lista para regalar',
                        ].map((txt, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <IconCheck size={11} color={GREEN} strokeWidth={3} />
                            <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.67rem', color: '#333', fontWeight: 500 }}>{txt}</span>
                          </div>
                        ))}
                      </div>

                      {/* Precio */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                        <div style={{
                          display: 'inline-flex', alignItems: 'baseline', gap: 4,
                          background: GREEN,
                          borderRadius: 12, padding: '6px 16px',
                          boxShadow: '0 4px 14px rgba(26,124,62,0.35)',
                        }}>
                          <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>S/.</span>
                          <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '1.7rem', fontWeight: 900, color: 'white', lineHeight: 1, letterSpacing: '-1px' }}>0.00</span>
                        </div>
                        <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.62rem', fontWeight: 700, color: GREEN, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gratis</span>
                      </div>

                    </div>

                  </div>
                </div>

                {/* ── Agregados: carrusel horizontal LTR ── */}
                {agregados.length > 0 && (
                  <AgregadosCarousel agregados={agregados} onImageClick={setLightboxImgSrc} />
                )}
              </motion.div>
            );
          })()}

          {/* ====== PACKS DISPONIBLES — solo dentro de un anillo, y solo si no viene desde categoría pack ====== */}
          {isAnillos && !hidePacks && allPacks.length > 0 && (
            <div style={{ marginBottom: 24 }}>

              {/* Header — mismo estilo que la sección de cajas */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, #2c4a8033)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <IconGift size={13} color={COLORS.navy} />
                  <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.6rem', fontWeight: 700, color: COLORS.navy, textTransform: 'uppercase', letterSpacing: '1.1px' }}>
                    Packs de Presentación
                  </span>
                  <IconGift size={13} color={COLORS.orange} />
                </div>
                <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #f7670733, transparent)' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {allPacks.map((pack, packIdx) => {
                  const ringP = parseFloat(product.price)||0;
                  const packP = parseFloat(pack.price)||0;
                  const combo = ringP + packP;
                  return (
                    <motion.div
                      key={pack.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, delay: packIdx * 0.06, ease: [0.22,1,0.36,1] }}
                      style={{
                        position: 'relative',
                        borderRadius: 18,
                        overflow: 'visible',
                        background: pack.soldOut ? '#f9f9f9' : '#eef2ff',
                        border: `1.5px solid ${pack.soldOut ? COLORS.borderLight : '#c5d2f0'}`,
                        opacity: pack.soldOut ? 0.65 : 1,
                        boxShadow: pack.soldOut ? 'none' : '0 4px 20px rgba(26,39,68,0.1)',
                      }}
                    >
                      {/* Puntos negros decorativos — esquina superior derecha */}
                      {!pack.soldOut && (
                        <CrossGrid
                          color="#000000"
                          rows={3} cols={3} gap={8} size={6}
                          style={{
                            position: 'absolute', top: -6, right: -6,
                            opacity: 0.5, pointerEvents: 'none', zIndex: 0,
                          }}
                        />
                      )}

                      {/* Zona imagen + info */}
                      <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 120, position: 'relative', zIndex: 1 }}>

                        {/* Imagen con borde blanco — igual estilo caja */}
                        <div style={{
                          width: 120, flexShrink: 0,
                          margin: 12, marginRight: 0,
                          borderRadius: 13,
                          border: '2.5px solid white',
                          overflow: 'hidden',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
                          background: 'white',
                          alignSelf: 'stretch',
                        }}>
                          <PackImg
                            packId={pack.id}
                            fallbackImages={pack.images}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            fallbackStyle={{ width: '100%', height: '100%', minHeight: 110, background: 'linear-gradient(135deg, #eef2ff, #dde4ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          />
                        </div>

                        {/* Info derecha */}
                        <div style={{ flex: 1, padding: '16px 14px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>

                          {/* Badge navy */}
                          {!pack.soldOut && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, alignSelf: 'flex-start' }}>
                              <IconSparkles size={10} color={COLORS.navy} />
                              <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.55rem', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: COLORS.navy }}>
                                Pack especial
                              </span>
                            </div>
                          )}

                          {/* Nombre */}
                          <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '0.95rem', fontWeight: 700, color: pack.soldOut ? COLORS.textMuted : COLORS.navy, lineHeight: 1.25 }}>
                            {pack.title}
                          </div>

                          {/* Contenidos como chips naranja */}
                          {pack.contenidos?.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {pack.contenidos.map((c, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <IconCheck size={9} color={COLORS.orange} strokeWidth={3} />
                                  <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.6rem', color: '#333', fontWeight: 500 }}>{c.nombre}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Precio pack */}
                          {!pack.soldOut ? (
                            <div style={{ marginTop: 'auto', display: 'inline-flex', alignItems: 'baseline', gap: 3, alignSelf: 'flex-start',
                              background: COLORS.orange, padding: '5px 14px', borderRadius: 10,
                              boxShadow: '0 2px 8px rgba(247,103,7,0.3)',
                            }}>
                              <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.65rem', color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>Pack S/.</span>
                              <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '1.15rem', color: 'white', fontWeight: 900, lineHeight: 1 }}>{fmt(packP)}</span>
                            </div>
                          ) : (
                            <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.65rem', color: COLORS.textMuted, fontWeight: 600, marginTop: 'auto' }}>Agotado</span>
                          )}
                        </div>
                      </div>

                      {/* Desglose de precios + botón — bloque navy separado, fuera del overflow:visible */}
                      {!pack.soldOut && (
                        <div style={{
                          margin: '10px 0 0 0',
                          borderRadius: 16,
                          overflow: 'hidden',
                          boxShadow: '0 4px 18px rgba(26,39,68,0.22)',
                        }}>
                          {/* Fila de precios */}
                          <div style={{
                            background: `linear-gradient(100deg, #0f1f45 0%, #1a3260 60%, #1e3a6e 100%)`,
                            display: 'flex', alignItems: 'stretch',
                          }}>
                            {/* Anillo */}
                            <div style={{ flex: 1, padding: '14px 8px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
                              <div style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.5rem', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.9px', fontWeight: 700, marginBottom: 5 }}>Anillo</div>
                              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2 }}>
                                <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.62rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>S/.</span>
                                <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '1.18rem', color: 'white', fontWeight: 900, lineHeight: 1 }}>{fmt(ringP)}</span>
                              </div>
                            </div>
                            {/* Pack */}
                            <div style={{ flex: 1, padding: '14px 8px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
                              <div style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.5rem', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.9px', fontWeight: 700, marginBottom: 5 }}>Pack</div>
                              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2 }}>
                                <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.62rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>S/.</span>
                                <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '1.18rem', color: 'white', fontWeight: 900, lineHeight: 1 }}>{fmt(packP)}</span>
                              </div>
                            </div>
                            {/* Total — fondo más oscuro con naranja */}
                            <div style={{ flex: 1.5, padding: '14px 12px', textAlign: 'center', background: 'rgba(10,16,35,0.45)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 5 }}>
                                <IconSparkles size={9} color={COLORS.orange} />
                                <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.5rem', color: COLORS.orange, textTransform: 'uppercase', letterSpacing: '0.9px', fontWeight: 800 }}>Total</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2 }}>
                                <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.68rem', color: `${COLORS.orange}cc`, fontWeight: 700 }}>S/.</span>
                                <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '1.4rem', color: COLORS.orange, fontWeight: 900, lineHeight: 1 }}>{fmt(combo)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Botón CTA — separado visualmente con línea naranja fina */}
                          <button
                            onClick={() => setSelectedPackDetail(pack)}
                            style={{
                              width: '100%', padding: '13px 16px',
                              background: 'linear-gradient(100deg, #0d1b38 0%, #162545 100%)',
                              border: 'none', borderTop: `2px solid ${COLORS.orange}22`,
                              cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                              fontFamily: '"Outfit", sans-serif', fontSize: '0.78rem',
                              color: 'white', fontWeight: 700, letterSpacing: '0.5px',
                            }}
                          >
                            <IconGift size={15} color={COLORS.orange} />
                            <span>Ver contenido del pack</span>
                            <IconChevronRight size={14} color={`${COLORS.orange}88`} />
                          </button>
                        </div>
                      )}

                      {/* Botón agotado */}
                      {pack.soldOut && (
                        <div style={{ padding: '10px 14px', textAlign: 'center', color: COLORS.textMuted, fontFamily: '"Outfit", sans-serif', fontSize: '0.7rem', fontWeight: 600 }}>
                          Agotado
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ====== BOTON WHATSAPP (solo si showWhatsapp esta activo) ====== */}
          {!product.soldOut && product.showWhatsapp && (() => {
            const { number, encoded } = whatsappMsg();
            return (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.158, ease: [0.22,1,0.36,1] }}
              >
              <motion.a
                href={`https://wa.me/${number}?text=${encoded}`}
                target="_blank"
                rel="noopener noreferrer"
                whileTap={{ scale: 0.96 }}
                whileHover={{ scale: 1.02, boxShadow: '0 10px 28px rgba(37,211,102,0.45)' }}
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
              </motion.div>
            );
          })()}
        </div>
        </motion.div>
        </AnimatePresence>
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

    {/* Lightbox fuera del portal del Modal — renderiza directo en body */}
    <LightboxPortal
      open={lightboxOpen && !lightboxImgSrc}
      images={images}
      currentImage={currentImage}
      setCurrentImage={setCurrentImage}
      pinchScale={pinchScale}
      setPinchScale={setPinchScale}
      pinchStartDist={pinchStartDist}
      pinchStartScale={pinchStartScale}
      productTitle={product?.title}
      onClose={() => { setLightboxOpen(false); setPinchScale(1); }}
    />

    {/* Lightbox simple para fotos de cajas/agregados */}
    {lightboxImgSrc && ReactDOM.createPortal(
      <div onClick={() => setLightboxImgSrc(null)}
        style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
        <img src={lightboxImgSrc} alt=""
          style={{ maxWidth: '92vw', maxHeight: '88vh', borderRadius: 16, objectFit: 'contain', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }} />
        <button onClick={() => setLightboxImgSrc(null)}
          style={{ position: 'absolute', top: 18, right: 18, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
          <IconX size={18} color="white" />
        </button>
      </div>,
      document.body
    )}
    </>
  );
}

/* ====== AgregadosCarousel — carrusel RTL de tarjetas de agregados ====== */
/* ====== SISTEMA DE ADORNOS GEOMÉTRICOS ====== */

/* Cuadrícula de puntos circulares — el clásico */
function DotsGrid({ color = '#000', rows = 5, cols = 6, gap = 7, dotSize = 3, style = {} }) {
  const dots = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dots.push(
        <div key={`${r}-${c}`} style={{
          width: dotSize, height: dotSize, borderRadius: '50%',
          background: color,
        }} />
      );
    }
  }
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, ${dotSize}px)`,
      gap: `${gap}px`,
      ...style,
    }}>
      {dots}
    </div>
  );
}

/* Cuadrícula de cuadraditos — más geométrico */
function SquaresGrid({ color = '#000', rows = 4, cols = 5, gap = 7, size = 3.5, style = {} }) {
  const squares = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      squares.push(
        <div key={`${r}-${c}`} style={{
          width: size, height: size, borderRadius: 1,
          background: color,
        }} />
      );
    }
  }
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, ${size}px)`,
      gap: `${gap}px`,
      ...style,
    }}>
      {squares}
    </div>
  );
}

/* Cuadrícula de cruces (+) SVG */
function CrossGrid({ color = '#000', rows = 3, cols = 4, gap = 12, size = 8, style = {} }) {
  const items = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      items.push(
        <svg key={`${r}-${c}`} width={size} height={size} viewBox="0 0 10 10" style={{ display: 'block' }}>
          <rect x="4" y="0" width="2" height="10" fill={color} rx="0.5" />
          <rect x="0" y="4" width="10" height="2" fill={color} rx="0.5" />
        </svg>
      );
    }
  }
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, ${size}px)`,
      gap: `${gap}px`,
      ...style,
    }}>
      {items}
    </div>
  );
}

/* Cuadrícula de diamantes (rombos) SVG */
function DiamondGrid({ color = '#000', rows = 3, cols = 4, gap = 10, size = 7, style = {} }) {
  const items = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      items.push(
        <svg key={`${r}-${c}`} width={size} height={size} viewBox="0 0 10 10" style={{ display: 'block' }}>
          <polygon points="5,0 10,5 5,10 0,5" fill={color} />
        </svg>
      );
    }
  }
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, ${size}px)`,
      gap: `${gap}px`,
      ...style,
    }}>
      {items}
    </div>
  );
}

/* Líneas paralelas diagonales */
function DiagonalLines({ color = '#000', count = 5, length = 24, thickness = 1.5, gap = 6, style = {} }) {
  return (
    <svg
      width={count * (thickness + gap) + length * 0.7}
      height={length}
      style={{ display: 'block', ...style }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <line
          key={i}
          x1={i * (thickness + gap)}
          y1={0}
          x2={i * (thickness + gap) + length * 0.7}
          y2={length}
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

/* ====== AgregadosCarousel — carrusel LTR táctil, tarjetas premium ====== */
function AgregadosCarousel({ agregados, onImageClick }) {
  const scrollRef = useRef(null);
  const [scrollState, setScrollState] = useState({ left: false, right: true });

  const ORANGE      = '#f76707';
  const ORANGE_LIGHT= '#fff1e6';
  const ORANGE_MID  = '#fd7c2a';

  const updateState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setScrollState({
      left:  el.scrollLeft > 4,
      right: el.scrollLeft < el.scrollWidth - el.clientWidth - 4,
    });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = 0;
    setTimeout(updateState, 80);
    el.addEventListener('scroll', updateState, { passive: true });
    return () => el.removeEventListener('scroll', updateState);
  }, [agregados]);

  const nudge = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 170, behavior: 'smooth' });
  };

  return (
    <div>
      {/* Header con label y flechas */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, #fd7c2a44)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <IconGift size={13} color={ORANGE} />
            <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.6rem', fontWeight: 700, color: ORANGE, textTransform: 'uppercase', letterSpacing: '1.1px' }}>
              También puedes agregar
            </span>
            <IconGift size={13} color={ORANGE} />
          </div>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #fd7c2a44, transparent)' }} />
        </div>
        <div style={{ display: 'flex', gap: 5, marginLeft: 10 }}>
          {[{ dir: -1, icon: <IconChevronLeft size={13} strokeWidth={2.8} /> }, { dir: 1, icon: <IconChevronRight size={13} strokeWidth={2.8} /> }].map(({ dir, icon }) => {
            const active = dir === -1 ? scrollState.left : scrollState.right;
            return (
              <button key={dir} onClick={() => nudge(dir)}
                style={{
                  width: 28, height: 28, borderRadius: 9, border: 'none', padding: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: active ? 'pointer' : 'default',
                  background: active ? ORANGE : COLORS.borderLight,
                  color: 'white',
                  transition: 'all 0.2s ease',
                  boxShadow: active ? '0 2px 8px rgba(247,103,7,0.35)' : 'none',
                }}>
                {icon}
              </button>
            );
          })}
        </div>
      </div>

      {/* Carrusel */}
      <div style={{ position: 'relative' }}>
        {scrollState.left && (
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 30, zIndex: 2, background: 'linear-gradient(90deg, rgba(255,255,255,0.96), transparent)', pointerEvents: 'none' }} />
        )}
        {scrollState.right && (
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 30, zIndex: 2, background: 'linear-gradient(270deg, rgba(255,255,255,0.96), transparent)', pointerEvents: 'none' }} />
        )}

        <div
          ref={scrollRef}
          style={{
            display: 'flex',
            gap: 12,
            overflowX: 'auto',
            overflowY: 'visible',
            paddingBottom: 8,
            paddingTop: 4,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'x mandatory',
          }}
        >
          {agregados.map((ag) => (
            <motion.div
              key={ag.id}
              whileTap={{ scale: 0.97 }}
              style={{
                flexShrink: 0,
                width: 158,
                borderRadius: 18,
                background: ORANGE_LIGHT,
                border: '1.5px solid #fdc89a',
                boxShadow: '0 4px 18px rgba(247,103,7,0.12)',
                overflow: 'visible',
                display: 'flex',
                flexDirection: 'column',
                scrollSnapAlign: 'start',
                position: 'relative',
              }}
            >
              {/* Puntos decorativos negros — esquina superior derecha */}
              <DiamondGrid
                color="#000000"
                rows={3} cols={3} gap={8} size={6}
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  opacity: 0.52,
                  pointerEvents: 'none',
                  zIndex: 0,
                }}
              />

              {/* Zona imagen con borde redondeado y borde blanco interno */}
              <div style={{
                margin: 12, marginBottom: 0,
                borderRadius: 13,
                border: '2.5px solid white',
                overflow: 'hidden',
                position: 'relative',
                background: 'white',
                boxShadow: '0 3px 12px rgba(0,0,0,0.1)',
                height: 130,
                cursor: ag.photo ? 'zoom-in' : 'default',
                zIndex: 1,
                flexShrink: 0,
              }} onClick={() => { if (ag.photo) onImageClick(ag.photo); }}>
                {ag.photo ? (
                  <>
                    <img
                      src={ag.photo}
                      alt={ag.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    {/* Lupa — esquina inferior derecha */}
                    <div style={{
                      position: 'absolute', bottom: 6, right: 6,
                      width: 20, height: 20, borderRadius: 6,
                      background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(6px)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      pointerEvents: 'none',
                    }}>
                      <IconZoomIn size={10} color="rgba(255,255,255,0.92)" strokeWidth={2} />
                    </div>
                  </>
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff4e6' }}>
                    <IconGift size={36} color={ORANGE + '66'} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: '10px 12px 14px', display: 'flex', flexDirection: 'column', gap: 6, zIndex: 1 }}>

                {/* Badge label */}
                {ag.tag && (
                  <div style={{ display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', gap: 4, background: ORANGE, borderRadius: 20, padding: '2px 9px' }}>
                    <IconSparkles size={8} color="white" />
                    <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.5rem', fontWeight: 800, color: 'white', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                      {ag.tag}
                    </span>
                  </div>
                )}

                {/* Título */}
                <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '0.82rem', fontWeight: 700, color: '#111', lineHeight: 1.3 }}>
                  {ag.title}
                </div>

                {/* Precio */}
                {ag.price ? (
                  <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4, background: ORANGE, borderRadius: 12, padding: '7px 16px', alignSelf: 'flex-start', boxShadow: '0 3px 10px rgba(247,103,7,0.35)' }}>
                    <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.85rem', fontWeight: 800, color: 'rgba(255,255,255,0.9)' }}>+S/.</span>
                    <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '1.25rem', fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>{ag.price}</span>
                  </div>
                ) : (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#e6f9ee', borderRadius: 8, padding: '3px 9px', alignSelf: 'flex-start' }}>
                    <IconCheck size={9} color="#1a7c3e" strokeWidth={3} />
                    <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.58rem', fontWeight: 700, color: '#1a7c3e' }}>Incluido</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ====== PackImg — muestra imagen de un pack desde imageCache ====== */
function PackImg({ packId, fallbackImages, style, fallbackStyle }) {
  const cached = useImages(packId);
  const src = (cached?.length ? cached[0] : null) || fallbackImages?.[0] || null;
  if (!src) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', ...fallbackStyle }}>
        <IconPackage size={28} color="rgba(247,103,7,0.3)" />
      </div>
    );
  }
  return <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...style }} />;
}

/* ====== LIGHTBOX PORTAL — renderiza directo en document.body ====== */
function LightboxPortal({ open, images, currentImage, setCurrentImage, pinchScale, setPinchScale, pinchStartDist, pinchStartScale, productTitle, onClose }) {
  // Bloquear scroll del body mientras está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  if (!open) return null;

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      pinchStartDist.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchStartScale.current = pinchScale;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && pinchStartDist.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const newScale = Math.min(4, Math.max(1, pinchStartScale.current * (dist / pinchStartDist.current)));
      setPinchScale(newScale);
    }
  };

  return ReactDOM.createPortal(
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => { pinchStartDist.current = null; }}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.97)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        touchAction: 'none',
      }}
    >
      {/* X cerrar */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 16, right: 16, zIndex: 10,
          background: 'rgba(255,255,255,0.15)', border: 'none',
          borderRadius: '50%', width: 44, height: 44, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)',
        }}
      >
        <IconX size={22} color="white" />
      </button>

      {/* Indicador de zoom */}
      {pinchScale > 1 && (
        <div style={{
          position: 'absolute', top: 16, left: 16,
          background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
          padding: '4px 12px', borderRadius: 12,
          fontFamily: '"Outfit", sans-serif', fontSize: '0.72rem', color: 'white',
        }}>
          {pinchScale.toFixed(1)}x
        </div>
      )}

      {/* Flechas navegación */}
      {images.length > 1 && (
        <>
          <button
            onClick={() => { setCurrentImage(p => (p - 1 + images.length) % images.length); setPinchScale(1); }}
            style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 10,
              background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 12,
              width: 44, height: 44, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <IconChevronLeft size={24} color="white" />
          </button>
          <button
            onClick={() => { setCurrentImage(p => (p + 1) % images.length); setPinchScale(1); }}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 10,
              background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 12,
              width: 44, height: 44, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <IconChevronRight size={24} color="white" />
          </button>
        </>
      )}

      {/* Imagen */}
      <img
        src={images[currentImage]}
        alt={productTitle}
        style={{
          maxWidth: '100vw',
          maxHeight: '90vh',
          objectFit: 'contain',
          transform: `scale(${pinchScale})`,
          transition: pinchScale === 1 ? 'transform 0.2s' : 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          display: 'block',
        }}
        onDoubleClick={() => setPinchScale(p => p > 1 ? 1 : 2.5)}
        draggable={false}
      />

      {/* Dots */}
      {images.length > 1 && (
        <div style={{
          position: 'absolute', bottom: 24, left: 0, right: 0,
          display: 'flex', justifyContent: 'center', gap: 8,
        }}>
          {images.map((_, i) => (
            <div
              key={i}
              onClick={() => { setCurrentImage(i); setPinchScale(1); }}
              style={{
                width: i === currentImage ? 22 : 8, height: 8, borderRadius: 4,
                background: i === currentImage ? 'white' : 'rgba(255,255,255,0.3)',
                transition: 'all 0.25s', cursor: 'pointer',
              }}
            />
          ))}
        </div>
      )}

      {/* Hint doble tap */}
      {pinchScale === 1 && (
        <div style={{
          position: 'absolute', bottom: images.length > 1 ? 56 : 24,
          left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.1)',
          padding: '3px 12px', borderRadius: 20,
          fontFamily: '"Outfit", sans-serif', fontSize: '0.6rem',
          color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap',
        }}>
          Doble tap para zoom • Pellizca para ampliar
        </div>
      )}
    </div>,
    document.body
  );
}

/* ====== PACK DETAIL MODAL ====== */
function PackDetailModal({ pack, onClose, ringProduct }) {
  const cachedImgs = useImages(pack.id);
  const images = (cachedImgs?.length ? cachedImgs : pack.images) || [];
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
          <div style={{ borderRadius: 12, overflow: 'hidden', aspectRatio: '1/1', background: '#f5f5f5' }}>
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
          <p style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.82rem', color: COLORS.textMuted, lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
            {pack.description}
          </p>
        )}

        {/* Precios: pack + anillo + total */}
        {ringProduct ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Fila pack + anillo */}
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, padding: '10px 14px', borderRadius: 12, background: '#fff4e6', border: '1px solid rgba(247,103,7,0.18)', textAlign: 'center' }}>
                <div style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.55rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.9px', fontWeight: 600, marginBottom: 4 }}>Pack</div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2 }}>
                  <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.72rem', color: COLORS.orange, fontWeight: 600 }}>S/.</span>
                  <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '1.4rem', color: COLORS.orange, fontWeight: 800, lineHeight: 1 }}>{fmt(pack.price)}</span>
                </div>
              </div>
              <div style={{ flex: 1, padding: '10px 14px', borderRadius: 12, background: '#f0f4ff', border: '1px solid rgba(44,74,128,0.15)', textAlign: 'center' }}>
                <div style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.55rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.9px', fontWeight: 600, marginBottom: 4 }}>Anillo</div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2 }}>
                  <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.72rem', color: COLORS.navy, fontWeight: 600 }}>S/.</span>
                  <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '1.4rem', color: COLORS.navy, fontWeight: 800, lineHeight: 1 }}>{fmt(ringProduct.price)}</span>
                </div>
              </div>
            </div>
            {/* Total */}
            <div style={{
              position: 'relative', overflow: 'hidden',
              background: `linear-gradient(120deg, ${COLORS.navy} 0%, #1a3260 100%)`,
              borderRadius: 14, padding: '14px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              boxShadow: '0 6px 20px rgba(26,39,68,0.22)',
            }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(212,165,116,0.08)', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(212,165,116,0.15)', border: '1px solid rgba(212,165,116,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconSparkles size={16} color={COLORS.gold} />
                </div>
                <div>
                  <div style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.52rem', color: 'rgba(212,165,116,0.6)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Total</div>
                  <div style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.62rem', color: 'rgba(255,255,255,0.45)' }}>Anillo + Pack</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem', color: 'rgba(212,165,116,0.75)', fontWeight: 600 }}>S/.</span>
                <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '2rem', color: 'white', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.5px' }}>{fmt(combo)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '12px 16px', borderRadius: 12, background: '#fff4e6', border: '1px solid rgba(247,103,7,0.18)', textAlign: 'center' }}>
            <div style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.55rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.9px', fontWeight: 600, marginBottom: 4 }}>Precio</div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2 }}>
              <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem', color: COLORS.orange, fontWeight: 600 }}>S/.</span>
              <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '1.6rem', color: COLORS.orange, fontWeight: 900, lineHeight: 1 }}>{fmt(pack.price)}</span>
            </div>
          </div>
        )}

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