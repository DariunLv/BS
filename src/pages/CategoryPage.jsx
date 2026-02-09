// src/pages/CategoryPage.jsx
import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { IconDiamond } from '@tabler/icons-react';
import ProductCard from '../components/ProductCard';
import { COLORS } from '../utils/theme';

export default function CategoryPage({ storeData }) {
  const { categoryId } = useParams();

  const category = useMemo(() =>
    (storeData?.categories || []).find(c => c.id === categoryId),
    [storeData, categoryId]
  );

  const products = useMemo(() =>
    (storeData?.products || []).filter(p => p.categoryId === categoryId),
    [storeData, categoryId]
  );

  if (!category) {
    return (
      <div className="main-content" style={{ padding: 40, textAlign: 'center' }}>
        <IconDiamond size={48} color={COLORS.borderLight} />
        <p style={{ color: COLORS.textMuted, marginTop: 16 }}>Categoria no encontrada</p>
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
              Pronto agregaremos productos a esta categoria
            </p>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} showOfferTag={category.isOffers} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
