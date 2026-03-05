// src/pages/CategoryPage.jsx
import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IconDiamond } from '@tabler/icons-react';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard';
import { COLORS } from '../utils/theme';

export default function CategoryPage({ storeData, isLoading }) {
  const { categoryId } = useParams();
  const navigate = useNavigate();

  const category = useMemo(() =>
    (storeData?.categories || []).find(c => c.id === categoryId),
    [storeData, categoryId]
  );

  const products = useMemo(() =>
    (storeData?.products || [])
      .filter(p => p.categoryId === categoryId)
      .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999)),
    [storeData, categoryId]
  );

  const isPack = categoryId?.includes('pack');
  const isAnillos = categoryId?.includes('anillo');

  // Para categorías pack: todos los anillos registrados
  const ringProducts = useMemo(() =>
    (storeData?.products || [])
      .filter(p => p.categoryId?.includes('anillo'))
      .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999)),
    [storeData]
  );

  // Precio del pack actual (primer producto de la categoría pack)
  const packPrice = useMemo(() => {
    if (!isPack || products.length === 0) return 0;
    return parseFloat(products[0]?.price) || 0;
  }, [isPack, products]);

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

  return (
    <div className="main-content">
      {/* Category Banner */}
      <div style={{
        position: 'relative', width: '100%', height: 220, overflow: 'hidden',
        background: `linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.navyDark} 100%)`,
      }}>
        {hasImage && (
          <motion.img
            src={category.image} alt={category.name}
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.85 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
          />
        )}

        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: hasImage
            ? 'linear-gradient(0deg, rgba(26,39,68,0.8) 0%, rgba(26,39,68,0.2) 50%, transparent 100%)'
            : 'linear-gradient(0deg, rgba(26,39,68,0.5) 0%, transparent 60%)',
        }} />

        <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 2, width: 24, height: 24,
          borderTop: '2px solid rgba(247,103,7,0.3)', borderRight: '2px solid rgba(247,103,7,0.3)', borderRadius: '0 6px 0 0',
        }} />
        <div style={{ position: 'absolute', bottom: 14, left: 14, zIndex: 2, width: 24, height: 24,
          borderBottom: '2px solid rgba(247,103,7,0.3)', borderLeft: '2px solid rgba(247,103,7,0.3)', borderRadius: '0 0 0 6px',
        }} />

        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 24, gap: 6, zIndex: 3,
        }}>
          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            style={{
              fontFamily: '"Playfair Display", serif', fontSize: 'clamp(1.5rem, 5vw, 2rem)',
              fontWeight: 700, color: COLORS.white, textAlign: 'center',
              textShadow: '0 2px 10px rgba(0,0,0,0.4)',
            }}
          >
            {category.name}
          </motion.h1>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.5, delay: 0.3 }}
            style={{ width: 50, height: 2, borderRadius: 1, background: `linear-gradient(90deg, transparent, ${COLORS.orange}, transparent)` }}
          />
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            style={{
              fontFamily: '"Outfit", sans-serif', fontSize: '0.72rem',
              color: 'rgba(255,255,255,0.65)', letterSpacing: '2px', textTransform: 'uppercase',
              textShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }}
          >
            {products.length} {products.length === 1 ? 'producto' : 'productos'}
          </motion.p>
        </div>
      </div>

      {/* ===== LOTTIE STICKER BELOW BANNER ===== */}
      {hasLottie && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.7 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3, type: 'spring', stiffness: 150 }}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '20px 16px 8px',
            background: 'linear-gradient(180deg, rgba(254,252,249,0.98) 0%, rgba(255,255,255,0.95) 100%)',
          }}
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              background: 'rgba(247,103,7,0.06)',
              borderRadius: '50%',
              padding: 16,
              border: '1px solid rgba(247,103,7,0.12)',
              boxShadow: '0 4px 20px rgba(247,103,7,0.08)',
            }}
          >
            <dotlottie-wc
              src={category.lottieUrl}
              style={{ width: '72px', height: '72px' }}
              autoplay loop
            />
          </motion.div>
          <motion.div
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            style={{
              width: 40, height: 1.5, borderRadius: 1, marginTop: 12,
              background: `linear-gradient(90deg, transparent, ${COLORS.orange}50, transparent)`,
            }}
          />
        </motion.div>
      )}

      {/* Products Grid */}
      <section style={{ padding: '20px 16px 32px', background: 'rgba(255,255,255,0.9)' }}>
        {products.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '60px 20px' }}
          >
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }}>
              <IconDiamond size={48} color={COLORS.borderLight} style={{ marginBottom: 16 }} />
            </motion.div>
            <p style={{ fontFamily: '"Playfair Display", serif', fontSize: '1rem', color: COLORS.textMuted, marginBottom: 8 }}>
              Proximamente
            </p>
            <p style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem', color: COLORS.textMuted, opacity: 0.7 }}>
              Pronto agregaremos productos a esta categoría
            </p>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {isLoading
              ? [0,1,2,3].map(i => <ProductCardSkeleton key={i} />)
              : products.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} showOfferTag={category.isOffers} storeData={storeData} />
                ))
            }
          </div>
        )}
      </section>

      {/* ===== PACK: grilla de anillos con precio combo (como cards) ===== */}
      {isPack && (
        <RingsComboSection storeData={storeData} packProducts={products} isLoading={isLoading} />
      )}

      {/* ===== ANILLOS: banner que redirige a packs ===== */}
      {isAnillos && <PackBannerSection navigate={navigate} storeData={storeData} />}
    </div>
  );
}

// Grilla de anillos con precio combo, dentro de la categoría pack
function RingsComboSection({ storeData, packProducts, isLoading }) {
  const fmt = (n) => parseFloat(n || 0).toFixed(2);

  const ringProducts = React.useMemo(() =>
    (storeData?.products || [])
      .filter(p => p.categoryId?.includes('anillo'))
      .sort((a,b) => (a.sortOrder??9999)-(b.sortOrder??9999)),
    [storeData]
  );

  if (ringProducts.length === 0 || packProducts.length === 0) return null;

  return (
    <section style={{ background: 'rgba(255,255,255,0.9)', paddingBottom: 40 }}>
      {packProducts.map((pack) => {
        const pPrice = parseFloat(pack.price) || 0;
        return (
          <div key={pack.id} style={{ marginBottom: packProducts.length > 1 ? 32 : 0 }}>
            {/* Banner precio del pack — resaltado */}
            <div style={{
              margin: '0 16px 20px',
              borderRadius: 16, overflow: 'hidden',
              background: `linear-gradient(135deg, ${COLORS.navy} 0%, #2c4a80 100%)`,
              boxShadow: '0 4px 18px rgba(26,39,68,0.18)',
              position: 'relative',
            }}>
              {/* Decoración esquinas */}
              <div style={{ position: 'absolute', top: 10, right: 14, width: 16, height: 16, borderTop: '1.5px solid rgba(247,103,7,0.4)', borderRight: '1.5px solid rgba(247,103,7,0.4)', borderRadius: '0 5px 0 0' }} />
              <div style={{ position: 'absolute', bottom: 10, left: 14, width: 16, height: 16, borderBottom: '1.5px solid rgba(247,103,7,0.4)', borderLeft: '1.5px solid rgba(247,103,7,0.4)', borderRadius: '0 0 0 5px' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                {pack.images?.[0] && (
                  <div style={{ width: 80, flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
                    <img src={pack.images[0]} alt={pack.title} style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block', opacity: 0.85 }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(26,39,68,0.5))' }} />
                  </div>
                )}
                <div style={{ flex: 1, padding: '14px 16px' }}>
                  <div style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.58rem', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 2 }}>
                    Precio del pack
                  </div>
                  <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '0.95rem', fontWeight: 700, color: 'white', marginBottom: 6 }}>
                    {pack.title}
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4, background: 'rgba(247,103,7,0.9)', padding: '4px 12px', borderRadius: 8 }}>
                    <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.65rem', color: 'rgba(255,255,255,0.85)' }}>S/.</span>
                    <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.3rem', fontWeight: 700, color: 'white' }}>{fmt(pPrice)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Título sección anillos */}
            <div style={{ padding: '0 16px', marginBottom: 14 }}>
              <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1rem', fontWeight: 700, color: COLORS.navy, marginBottom: 3 }}>
                Modelos disponibles
              </h3>
              <p style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.68rem', color: COLORS.textMuted, lineHeight: 1.5 }}>
                Precio total al llevar este pack con cada anillo
              </p>
            </div>

            <div style={{ padding: '0 16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {isLoading
                  ? [0,1,2,3].map(i => <ProductCardSkeleton key={i} />)
                  : ringProducts.map((ring, i) => (
                      <ProductCard
                        key={ring.id}
                        product={ring}
                        index={i}
                        storeData={storeData}
                        hidePacks
                        comboPrice={(parseFloat(ring.price)||0) + pPrice}
                        packPrice={pPrice}
                      />
                    ))
                }
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}



// Banner simple en anillos → redirige a categoría de packs
function PackBannerSection({ navigate, storeData }) {
  const hasPacks = (storeData?.products || []).some(p => p.categoryId?.includes('pack'));
  if (!hasPacks) return null;

  const packCat = (storeData?.categories || []).find(c => c.id?.includes('pack'));
  if (!packCat) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
      style={{ margin: '0', padding: '20px 16px 40px', background: 'rgba(255,255,255,0.9)' }}>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate(`/categoria/${packCat.id}`)}
        style={{
          width: '100%', cursor: 'pointer', border: 'none', padding: 0, background: 'none',
        }}>
        <div style={{
          borderRadius: 16, overflow: 'hidden',
          background: `linear-gradient(135deg, ${COLORS.navy} 0%, #2c4a80 100%)`,
          padding: '20px 20px',
          display: 'flex', alignItems: 'center', gap: 16,
          boxShadow: '0 4px 20px rgba(26,39,68,0.18)',
          position: 'relative',
        }}>
          {/* Decoración */}
          <div style={{ position: 'absolute', top: 10, right: 16, width: 18, height: 18, borderTop: '1.5px solid rgba(247,103,7,0.4)', borderRight: '1.5px solid rgba(247,103,7,0.4)', borderRadius: '0 5px 0 0' }} />
          <div style={{ position: 'absolute', bottom: 10, left: 16, width: 18, height: 18, borderBottom: '1.5px solid rgba(247,103,7,0.4)', borderLeft: '1.5px solid rgba(247,103,7,0.4)', borderRadius: '0 0 0 5px' }} />

          {packCat.image ? (
            <img src={packCat.image} alt="" style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: '1.5px solid rgba(255,255,255,0.15)' }} />
          ) : (
            <div style={{ width: 64, height: 64, borderRadius: 10, background: 'rgba(255,255,255,0.08)', flexShrink: 0, border: '1.5px solid rgba(255,255,255,0.1)' }} />
          )}

          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.62rem', color: COLORS.orange, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 4 }}>
              Presentación especial
            </div>
            <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: 4, lineHeight: 1.3 }}>
              Packs de Presentación
            </div>
            <div style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.68rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
              Complementa tu anillo y sorprende. Ver precios combinados.
            </div>
          </div>

          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: COLORS.orange,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: 300 }}>›</span>
          </div>
        </div>
      </motion.button>
    </motion.section>
  );
}