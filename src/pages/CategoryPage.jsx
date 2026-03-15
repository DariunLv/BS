import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconDiamond, IconChevronLeft, IconChevronRight,
  IconPackage, IconHeart, IconFilter,
} from '@tabler/icons-react';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard';
import { COLORS } from '../utils/theme';

const fmt = (n) => parseFloat(n || 0).toFixed(2);

export default function CategoryPage({ storeData, isLoading }) {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [selectedPack, setSelectedPack] = useState(null);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const bannerRef = useRef(null);

  const category = useMemo(() =>
    (storeData?.categories || []).find(c => c.id === categoryId),
    [storeData, categoryId]
  );

  const products = useMemo(() =>
    (storeData?.products || [])
      .filter(p => p.categoryId === categoryId && !p.hidden)
      .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999)),
    [storeData, categoryId]
  );

  // Parallax scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!bannerRef.current) return;
      const rect = bannerRef.current.getBoundingClientRect();
      const scrolled = -rect.top;
      setParallaxOffset(Math.max(0, scrolled * 0.35));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lazy-load imágenes solo para los productos de esta categoría
  useEffect(() => {
    if (!products.length) return;
    const sinImagenes = products.filter(p => !p.images?.length);
    if (!sinImagenes.length) return;
    Promise.all([
      import('../utils/firebase').then(m => m.loadCategoryImages),
      import('../utils/store').then(m => m.mergeProductImages),
    ]).then(([loadCategoryImages, mergeProductImages]) => {
      loadCategoryImages(sinImagenes.map(p => p.id)).then(map => {
        if (Object.keys(map).length) mergeProductImages(map);
      });
    });
  }, [categoryId]); // eslint-disable-line react-hooks/exhaustive-deps

  const isPack = categoryId?.includes('pack');
  const isAnillos = categoryId?.includes('anillo');
  const [filterMaterial, setFilterMaterial] = useState('todos');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  // Cerrar dropdown al tocar fuera
  useEffect(() => {
    const handler = (e) => { if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false); };
    if (filterOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [filterOpen]);

  // Materiales únicos de los productos (solo para anillos)
  const materials = useMemo(() => {
    if (!isAnillos) return [];
    const set = new Set();
    products.forEach(p => { if (p.material?.trim()) set.add(p.material.trim()); });
    return Array.from(set).sort();
  }, [products, isAnillos]);

  const filteredProducts = useMemo(() => {
    if (!isAnillos || filterMaterial === 'todos') return products;
    return products.filter(p => p.material?.trim() === filterMaterial);
  }, [products, isAnillos, filterMaterial]);

  if (!category) {
    return (
      <div className="main-content" style={{ padding: 40, textAlign: 'center' }}>
        <IconDiamond size={48} color={COLORS.borderLight} />
        <p style={{ color: COLORS.textMuted, marginTop: 16 }}>categoría no encontrada</p>
      </div>
    );
  }

  const hasImage = !!category.image;
  const hasLottie = !!category.lottieUrl;

  // ===== NIVEL 2: detalle del pack =====
  if (isPack && selectedPack) {
    return (
      <div className="main-content">
        <PackDetailPage
          pack={selectedPack}
          storeData={storeData}
          isLoading={isLoading}
          onBack={() => setSelectedPack(null)}
        />
      </div>
    );
  }

  return (
    <div className="main-content">
      {/* Category Banner */}
      <div style={{
        position: 'relative', width: '100%', height: 220, overflow: 'hidden',
        background: `linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.navyDark} 100%)`,
      }} ref={bannerRef}>
        {hasImage && (
          <motion.img
            src={category.image} alt={category.name}
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.85 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ width: '100%', height: '115%', objectFit: 'cover', position: 'absolute', inset: 0,
              transform: `translateY(${parallaxOffset}px)`, willChange: 'transform' }}
          />
        )}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: hasImage
            ? 'linear-gradient(0deg, rgba(26,39,68,0.8) 0%, rgba(26,39,68,0.2) 50%, transparent 100%)'
            : 'linear-gradient(0deg, rgba(26,39,68,0.5) 0%, transparent 60%)',
        }} />
        <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 2, width: 24, height: 24,
          borderTop: '2px solid rgba(247,103,7,0.3)', borderRight: '2px solid rgba(247,103,7,0.3)', borderRadius: '0 6px 0 0' }} />
        <div style={{ position: 'absolute', bottom: 14, left: 14, zIndex: 2, width: 24, height: 24,
          borderBottom: '2px solid rgba(247,103,7,0.3)', borderLeft: '2px solid rgba(247,103,7,0.3)', borderRadius: '0 0 0 6px' }} />
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 24, gap: 6, zIndex: 3,
        }}>
          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(1.5rem, 5vw, 2rem)',
              fontWeight: 700, color: COLORS.white, textAlign: 'center', textShadow: '0 2px 10px rgba(0,0,0,0.4)' }}
          >
            {category.name}
          </motion.h1>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.5, delay: 0.3 }}
            style={{ width: 50, height: 2, borderRadius: 1, background: `linear-gradient(90deg, transparent, ${COLORS.orange}, transparent)` }}
          />
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.72rem',
              color: 'rgba(255,255,255,0.65)', letterSpacing: '2px', textTransform: 'uppercase', textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
          >
            {products.length} {isPack
              ? products.length === 1 ? 'pack' : 'packs'
              : products.length === 1 ? 'producto' : 'productos'}
          </motion.p>
        </div>
      </div>

      {/* Lottie */}
      {hasLottie && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.7 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3, type: 'spring', stiffness: 150 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px 8px',
            background: 'linear-gradient(180deg, rgba(254,252,249,0.98) 0%, rgba(255,255,255,0.95) 100%)' }}
        >
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{ background: 'rgba(247,103,7,0.06)', borderRadius: '50%', padding: 16,
              border: '1px solid rgba(247,103,7,0.12)', boxShadow: '0 4px 20px rgba(247,103,7,0.08)' }}
          >
            <dotlottie-wc src={category.lottieUrl} style={{ width: '72px', height: '72px' }} autoplay loop />
          </motion.div>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.4, delay: 0.6 }}
            style={{ width: 40, height: 1.5, borderRadius: 1, marginTop: 12,
              background: `linear-gradient(90deg, transparent, ${COLORS.orange}50, transparent)` }}
          />
        </motion.div>
      )}

      {/* ── GRID: packs o productos normales ── */}
      <section style={{ padding: '20px 16px 32px', background: 'rgba(255,255,255,0.9)' }}>

        {/* FILTRO DE MATERIALES — dropdown selector */}
        {isAnillos && materials.length > 1 && (
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>

            {/* Botón selector */}
            <div ref={filterRef} style={{ position: 'relative' }}>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setFilterOpen(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  fontFamily: '"Outfit", sans-serif', fontSize: '0.75rem',
                  fontWeight: filterMaterial !== 'todos' ? 600 : 500,
                  padding: '7px 14px',
                  borderRadius: 22,
                  border: filterMaterial !== 'todos'
                    ? `1.5px solid ${COLORS.orange}`
                    : `1px solid ${COLORS.borderLight}`,
                  background: filterMaterial !== 'todos'
                    ? COLORS.orangePale
                    : 'rgba(255,255,255,0.9)',
                  color: filterMaterial !== 'todos' ? COLORS.orange : COLORS.textMuted,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  backdropFilter: 'blur(8px)',
                  whiteSpace: 'nowrap',
                }}
              >
                <IconFilter size={13} />
                {filterMaterial === 'todos' ? 'Material' : filterMaterial}
                <motion.span
                  animate={{ rotate: filterOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <IconChevronRight size={13} style={{ transform: 'rotate(90deg)' }} />
                </motion.span>
              </motion.button>

              {/* Dropdown */}
              <AnimatePresence>
                {filterOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      position: 'absolute', top: 'calc(100% + 6px)', left: 0,
                      zIndex: 100, minWidth: 170,
                      background: 'rgba(255,255,255,0.97)',
                      border: `1px solid ${COLORS.borderLight}`,
                      borderRadius: 14,
                      boxShadow: '0 8px 32px rgba(26,39,68,0.12)',
                      overflow: 'hidden',
                      backdropFilter: 'blur(16px)',
                    }}
                  >
                    {/* Opción Todos */}
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setFilterMaterial('todos'); setFilterOpen(false); }}
                      style={{
                        width: '100%', textAlign: 'left',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px',
                        fontFamily: '"Outfit", sans-serif', fontSize: '0.78rem',
                        fontWeight: filterMaterial === 'todos' ? 600 : 400,
                        color: filterMaterial === 'todos' ? COLORS.orange : COLORS.navy,
                        background: filterMaterial === 'todos' ? COLORS.orangePale : 'transparent',
                        border: 'none', cursor: 'pointer',
                        borderBottom: `1px solid ${COLORS.borderLight}`,
                      }}
                    >
                      <span>Todos los materiales</span>
                      <span style={{ fontSize: '0.65rem', opacity: 0.5, fontWeight: 400 }}>
                        {products.length}
                      </span>
                    </motion.button>

                    {/* Opciones de materiales */}
                    {materials.map((mat, i) => {
                      const count = products.filter(p => p.material?.trim() === mat).length;
                      const active = filterMaterial === mat;
                      return (
                        <motion.button
                          key={mat}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => { setFilterMaterial(mat); setFilterOpen(false); }}
                          style={{
                            width: '100%', textAlign: 'left',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 14px',
                            fontFamily: '"Outfit", sans-serif', fontSize: '0.78rem',
                            fontWeight: active ? 600 : 400,
                            color: active ? COLORS.orange : COLORS.navy,
                            background: active ? COLORS.orangePale : 'transparent',
                            border: 'none', cursor: 'pointer',
                            borderBottom: i < materials.length - 1 ? `1px solid ${COLORS.borderLight}` : 'none',
                          }}
                        >
                          <span>{mat}</span>
                          <span style={{ fontSize: '0.65rem', opacity: 0.5, fontWeight: 400 }}>
                            {count}
                          </span>
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Contador de resultados o chip para limpiar filtro */}
            <AnimatePresence>
              {filterMaterial !== 'todos' && (
                <motion.button
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setFilterMaterial('todos')}
                  style={{
                    fontFamily: '"Outfit", sans-serif', fontSize: '0.65rem',
                    color: COLORS.textMuted, background: 'none', border: 'none',
                    cursor: 'pointer', padding: '4px 2px', textDecoration: 'underline',
                    textUnderlineOffset: 2,
                  }}
                >
                  {filteredProducts.length} de {products.length} · quitar filtro
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        )}

        {products.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '60px 20px' }}>
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }}>
              <IconDiamond size={48} color={COLORS.borderLight} style={{ marginBottom: 16 }} />
            </motion.div>
            <p style={{ fontFamily: '"Playfair Display", serif', fontSize: '1rem', color: COLORS.textMuted, marginBottom: 8 }}>Proximamente</p>
            <p style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem', color: COLORS.textMuted, opacity: 0.7 }}>Pronto agregaremos productos a esta categoría</p>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {isLoading
              ? [0,1,2,3].map(i => <ProductCardSkeleton key={i} />)
              : filteredProducts.map((product, i) => (
                  isPack ? (
                    <div key={product.id} style={{ position: 'relative' }}>
                      <ProductCard product={product} index={i} storeData={storeData} />
                      <div
                        onClick={() => setSelectedPack(product)}
                        style={{ position: 'absolute', inset: 0, cursor: 'pointer', zIndex: 10 }}
                      />
                    </div>
                  ) : (
                    <ProductCard key={product.id} product={product} index={i} showOfferTag={category.isOffers} storeData={storeData} siblingProducts={products} siblingIndex={i} />
                  )
                ))
            }
          </div>
        )}
      </section>

      {isAnillos && <PackBannerSection navigate={navigate} storeData={storeData} />}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// NIVEL 2: detalle del pack (vista tipo ProductModal) + anillos abajo
// ─────────────────────────────────────────────────────────────────────────────
function PackDetailPage({ pack, storeData, isLoading, onBack }) {
  const [currentImage, setCurrentImage] = useState(0);
  const [liked, setLiked] = useState(false);
  const images = pack.images || [];
  const pPrice = parseFloat(pack.price) || 0;

  const ringProducts = useMemo(() =>
    (storeData?.products || [])
      .filter(p => p.categoryId?.includes('anillo') && !p.hidden)
      .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999)),
    [storeData]
  );

  const nextImage = () => setCurrentImage(p => (p + 1) % images.length);
  const prevImage = () => setCurrentImage(p => (p - 1 + images.length) % images.length);

  const touchStartRef = React.useRef(null);
  const handleTouchStart = (e) => { touchStartRef.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartRef.current === null) return;
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    touchStartRef.current = null;
    if (Math.abs(diff) > 50) { diff > 0 ? nextImage() : prevImage(); }
  };

  return (
    <div>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${COLORS.borderLight}`,
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 10,
        }}>
          <IconChevronLeft size={18} color={COLORS.navy} />
          <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem', color: COLORS.navy, fontWeight: 500 }}>Volver</span>
        </button>
        <motion.button whileTap={{ scale: 0.85 }} onClick={() => setLiked(!liked)}
          style={{ background: liked ? '#fee6e6' : COLORS.offWhite,
            border: `1px solid ${liked ? '#ffb3b3' : COLORS.borderLight}`,
            borderRadius: 10, width: 36, height: 36, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconHeart size={16} color={liked ? '#e11d48' : COLORS.textMuted} fill={liked ? '#e11d48' : 'none'} />
        </motion.button>
      </div>

      {/* Galería */}
      <div style={{ position: 'relative', background: COLORS.offWhite }}
        onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {images.length > 0 ? (
          <>
            <AnimatePresence mode="wait">
              <motion.div key={currentImage}
                initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.3 }}>
                <img loading="lazy" src={images[currentImage]} alt={pack.title}
                  style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }} />
              </motion.div>
            </AnimatePresence>
            {images.length > 1 && (
              <>
                <motion.button whileTap={{ scale: 0.85 }} onClick={prevImage} style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
                  border: `1px solid ${COLORS.borderLight}`, borderRadius: 12,
                  width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
                  <IconChevronLeft size={18} color={COLORS.navy} />
                </motion.button>
                <motion.button whileTap={{ scale: 0.85 }} onClick={nextImage} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
                  border: `1px solid ${COLORS.borderLight}`, borderRadius: 12,
                  width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
                  <IconChevronRight size={18} color={COLORS.navy} />
                </motion.button>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: COLORS.borderLight }}>
                  <motion.div animate={{ width: `${((currentImage + 1) / images.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                    style={{ height: '100%', background: `linear-gradient(90deg, ${COLORS.orange}, ${COLORS.gold})`, borderRadius: 2 }} />
                </div>
                <div style={{ position: 'absolute', top: 12, right: 12,
                  background: 'rgba(26,39,68,0.65)', backdropFilter: 'blur(8px)',
                  padding: '4px 10px', borderRadius: 16,
                  fontFamily: '"Outfit", sans-serif', fontSize: '0.65rem', color: 'white', fontWeight: 500 }}>
                  {currentImage + 1} / {images.length}
                </div>
              </>
            )}
            {pack.soldOut && (
              <div className="sold-out-overlay" style={{ borderRadius: 0 }}>
                <div className="sold-out-badge" style={{ fontSize: '1rem', padding: '10px 32px' }}>AGOTADO</div>
              </div>
            )}
          </>
        ) : (
          <div className="no-image-placeholder" style={{ aspectRatio: '1/1' }}>
            <IconDiamond size={48} color={COLORS.borderLight} />
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div style={{ display: 'flex', gap: 8, padding: '12px 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {images.map((img, i) => (
            <motion.div key={i} whileTap={{ scale: 0.9 }} onClick={() => setCurrentImage(i)}
              style={{ width: 60, height: 60, borderRadius: 10, overflow: 'hidden', flexShrink: 0, cursor: 'pointer',
                aspectRatio: '1/1',
                border: i === currentImage ? `2.5px solid ${COLORS.orange}` : `1.5px solid ${COLORS.borderLight}`,
                boxShadow: i === currentImage ? `0 4px 12px rgba(247,103,7,0.25)` : 'none', transition: 'all 0.25s' }}>
              <img loading="lazy" src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover',
                opacity: i === currentImage ? 1 : 0.55, transition: 'opacity 0.25s' }} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Contenido */}
      <div style={{ padding: '20px 20px 0' }}>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.55rem', fontWeight: 600,
          color: COLORS.navy, marginBottom: 10, lineHeight: 1.25 }}>
          {pack.title}
        </h1>

        {/* Precio */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10,
          background: `linear-gradient(135deg, ${COLORS.orangePale}, #fff4e6)`,
          padding: '10px 20px', borderRadius: 16, border: '1px solid rgba(247,103,7,0.12)', marginBottom: 16 }}>
          <div>
            <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.6rem', color: COLORS.textMuted,
              fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: 1 }}>
              Precio
            </span>
            <span className="price-tag" style={{ fontSize: '1.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 400, marginRight: 2 }}>S/.</span>
              {fmt(pack.price)}
            </span>
          </div>
          {!pack.soldOut && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4,
              background: '#e6f9e6', padding: '3px 10px', borderRadius: 20, border: '1px solid rgba(45,138,45,0.15)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2d8a2d' }} />
              <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.6rem', color: '#2d8a2d', fontWeight: 600 }}>Disponible</span>
            </div>
          )}
        </div>

        {/* Línea decorativa */}
        <div style={{ height: 2, borderRadius: 1, marginBottom: 20,
          background: `linear-gradient(90deg, ${COLORS.orange}, ${COLORS.gold}, transparent)`, width: 80 }} />

        {/* Descripción */}
        {pack.description && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: COLORS.orangePale,
                display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(247,103,7,0.1)' }}>
                <IconPackage size={14} color={COLORS.orange} />
              </div>
              <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem', color: COLORS.navy, fontWeight: 600 }}>Descripcion</span>
            </div>
            <p style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.85rem', lineHeight: 1.75,
              color: COLORS.textMuted, padding: '14px 16px', borderRadius: 12,
              background: COLORS.offWhite, border: `1px solid ${COLORS.borderLight}`,
              whiteSpace: 'pre-wrap' }}>
              {pack.description}
            </p>
          </div>
        )}

        {/* Contenidos del pack */}
        {pack.contenidos?.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#fff4e6',
                display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(247,103,7,0.15)' }}>
                <IconPackage size={14} color={COLORS.orange} />
              </div>
              <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem', color: COLORS.navy, fontWeight: 600 }}>
                ¿Qué incluye este pack?
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pack.contenidos.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 10, background: '#fffaf5', border: '1px solid rgba(247,103,7,0.1)' }}>
                  {item.imagen ? (
                    <img loading="lazy" src={item.imagen} alt={item.nombre} style={{ width: 42, height: 42, borderRadius: 8,
                      objectFit: 'cover', aspectRatio: '1/1', border: '1px solid rgba(247,103,7,0.15)', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 42, height: 42, borderRadius: 8, flexShrink: 0,
                      background: '#fff4e6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1px solid rgba(247,103,7,0.15)' }}>
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
      </div>

      {/* Grilla de anillos con combo */}
      <section style={{ background: 'rgba(255,255,255,0.9)', padding: '0 16px 40px' }}>
        <div style={{ paddingTop: 8, marginBottom: 14 }}>
          <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1rem', fontWeight: 700, color: COLORS.navy, marginBottom: 3 }}>
            Modelos disponibles
          </h3>
          <p style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.68rem', color: COLORS.textMuted, lineHeight: 1.5 }}>
            Precio total al llevar este pack con cada anillo
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {isLoading
            ? [0,1,2,3].map(i => <ProductCardSkeleton key={i} />)
            : ringProducts.map((ring, i) => (
                <ProductCard
                  key={ring.id} product={ring} index={i}
                  storeData={storeData} hidePacks
                  comboPrice={(parseFloat(ring.price) || 0) + pPrice}
                  packPrice={pPrice}
                  packData={pack}
                  siblingProducts={ringProducts}
                  siblingIndex={i}
                />
              ))
          }
        </div>
      </section>
    </div>
  );
}


// ─────────────────────────────────────────────
// Banner en anillos → redirige a packs
// ─────────────────────────────────────────────
function PackBannerSection({ navigate, storeData }) {
  const hasPacks = (storeData?.products || []).some(p => p.categoryId?.includes('pack'));
  if (!hasPacks) return null;
  const packCat = (storeData?.categories || []).find(c => c.id?.includes('pack'));
  if (!packCat) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
      style={{ margin: '0', padding: '20px 16px 40px', background: 'rgba(255,255,255,0.9)' }}>
      <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate(`/categoria/${packCat.id}`)}
        style={{ width: '100%', cursor: 'pointer', border: 'none', padding: 0, background: 'none' }}>
        <div style={{ borderRadius: 16, overflow: 'hidden',
          background: `linear-gradient(135deg, ${COLORS.navy} 0%, #2c4a80 100%)`,
          padding: '20px', display: 'flex', alignItems: 'center', gap: 16,
          boxShadow: '0 4px 20px rgba(26,39,68,0.18)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 10, right: 16, width: 18, height: 18,
            borderTop: '1.5px solid rgba(247,103,7,0.4)', borderRight: '1.5px solid rgba(247,103,7,0.4)', borderRadius: '0 5px 0 0' }} />
          <div style={{ position: 'absolute', bottom: 10, left: 16, width: 18, height: 18,
            borderBottom: '1.5px solid rgba(247,103,7,0.4)', borderLeft: '1.5px solid rgba(247,103,7,0.4)', borderRadius: '0 0 0 5px' }} />
          {packCat.image
            ? <img loading="lazy" src={packCat.image} alt="" style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', aspectRatio: '1/1', flexShrink: 0, border: '1.5px solid rgba(255,255,255,0.15)' }} />
            : <div style={{ width: 64, height: 64, borderRadius: 10, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
          }
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.62rem', color: COLORS.orange,
              fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 4 }}>
              Presentación especial
            </div>
            <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: 4, lineHeight: 1.3 }}>
              Packs de Presentación
            </div>
            <div style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.68rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
              Complementa tu anillo y sorprende. Ver precios combinados.
            </div>
          </div>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: COLORS.orange,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: 300 }}>›</span>
          </div>
        </div>
      </motion.button>
    </motion.section>
  );
}