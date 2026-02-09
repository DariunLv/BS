// src/pages/SecondStorePage.jsx
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { IconShoppingBag, IconArrowLeft } from '@tabler/icons-react';
import CategoryCard from '../components/CategoryCard';
import DeliverySection from '../components/DeliverySection';
import { COLORS } from '../utils/theme';

export default function SecondStorePage({ storeData, onNavigateCategory, onBack }) {
  const generalCategories = useMemo(() =>
    (storeData?.categories || [])
      .filter(c => c.storeType === 'general')
      .sort((a, b) => a.order - b.order),
    [storeData]
  );

  const getProductCount = (catId) =>
    (storeData?.products || []).filter(p => p.categoryId === catId).length;

  const allGeneralProducts = useMemo(() => {
    const catIds = generalCategories.map(c => c.id);
    return (storeData?.products || []).filter(p => catIds.includes(p.categoryId));
  }, [storeData, generalCategories]);

  const galleryImages = useMemo(() =>
    allGeneralProducts
      .flatMap(p => (p.images || []).map(img => ({ image: img, text: p.title })))
      .slice(0, 24),
    [allGeneralProducts]
  );

  const deliveryLocations = storeData?.deliveryLocations || [];
  const shalomImage = storeData?.shalomImage || '';

  return (
    <div className="main-content">
      {/* Hero */}
      <section style={{
        padding: '48px 20px 36px', textAlign: 'center',
        background: 'rgba(255,255,255,0.9)', position: 'relative',
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.025,
          backgroundImage: `radial-gradient(${COLORS.navy} 1px, transparent 1px)`,
          backgroundSize: '24px 24px', pointerEvents: 'none',
        }} />

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3.5, repeat: Infinity }}>
            <dotlottie-wc
              src="https://lottie.host/5af05446-f723-40d6-a8cf-85262739629a/BJ4AfBpEnq.lottie"
              style={{ width: '110px', height: '110px', margin: '0 auto 18px' }}
              autoplay loop
            />
          </motion.div>
          <h1 style={{
            fontFamily: '"Playfair Display", serif', fontSize: 'clamp(1.5rem, 5vw, 2.1rem)',
            fontWeight: 700, color: COLORS.navy, marginBottom: 10,
          }}>
            Tienda General
          </h1>
          <div className="elegant-divider" style={{ marginBottom: 14 }} />
          <p style={{
            fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem',
            color: COLORS.textMuted, fontStyle: 'italic', maxWidth: 320,
            margin: '0 auto', lineHeight: 1.6,
          }}>
            Explora nuestros productos de la tienda general
          </p>
        </motion.div>
      </section>

      {/* Categories */}
      <section style={{ padding: '20px 16px 36px', background: 'rgba(255,255,255,0.85)' }}>
        {generalCategories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }}>
              <IconShoppingBag size={48} color={COLORS.borderLight} />
            </motion.div>
            <p style={{ fontFamily: '"Playfair Display", serif', color: COLORS.textMuted, marginTop: 16 }}>Proximamente</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
            {generalCategories.map((cat, i) => (
              <CategoryCard key={cat.id} category={cat} index={i}
                productCount={getProductCount(cat.id)}
                onClick={() => onNavigateCategory(cat.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Gallery */}
      {galleryImages.length > 0 && (
        <section style={{
          padding: '48px 0', overflow: 'hidden',
          background: `linear-gradient(135deg, ${COLORS.navyDark} 0%, ${COLORS.navy} 100%)`,
        }}>
          <div style={{ padding: '0 16px', marginBottom: 28, textAlign: 'center' }}>
            <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.3rem', fontWeight: 600, color: COLORS.white, marginBottom: 8 }}>
              Galeria
            </h2>
            <div className="elegant-divider" style={{ background: 'linear-gradient(90deg, #f76707, #d4a574)' }} />
          </div>
          <div style={{
            display: 'flex', gap: 14, overflowX: 'auto', padding: '0 16px 20px',
            scrollSnapType: 'x mandatory', scrollbarWidth: 'none',
          }}>
            {galleryImages.map((item, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, scale: 0.85 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.04 }}
                whileHover={{ scale: 1.05, y: -4 }}
                style={{ flexShrink: 0, width: 170, scrollSnapAlign: 'center' }}
              >
                <div style={{
                  borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                }}>
                  <img src={item.image} alt={item.text} style={{ width: 170, height: 170, objectFit: 'cover', display: 'block' }} />
                </div>
                <p style={{
                  fontFamily: '"Outfit", sans-serif', fontSize: '0.68rem', color: 'rgba(255,255,255,0.55)',
                  textAlign: 'center', marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{item.text}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Delivery & Shipping */}
      <DeliverySection deliveryLocations={deliveryLocations} shalomImage={shalomImage} />

      {/* Back */}
      <section style={{ padding: '36px 16px', textAlign: 'center', background: 'rgba(255,255,255,0.9)' }}>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={onBack}
          style={{
            background: 'none', border: `1px solid ${COLORS.borderLight}`, borderRadius: 30,
            padding: '11px 30px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: '"Outfit", sans-serif', fontSize: '0.85rem', color: COLORS.navy, fontWeight: 500,
          }}
        >
          <IconArrowLeft size={16} />
          Volver a Joyeria
        </motion.button>
      </section>
    </div>
  );
}
