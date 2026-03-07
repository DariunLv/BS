// src/pages/CatalogPage.jsx
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { IconSparkles, IconHeart, IconStars, IconArrowRight } from '@tabler/icons-react';
import RotatingText from '../components/RotatingText';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard';
import CategoryCard from '../components/CategoryCard';
import DeliverySection from '../components/DeliverySection';
import CircularGallery from '../components/CircularGallery';
import { COLORS } from '../utils/theme';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
};

export default function CatalogPage({ storeData, isLoading, onNavigateCategory, onNavigateSecondStore }) {
  const jewelryCategories = useMemo(() =>
    (storeData?.categories || [])
      .filter(c => c.storeType === 'jewelry' && !c.isOffers)
      .sort((a, b) => a.order - b.order),
    [storeData]
  );

  const offerProducts = useMemo(() =>
    (storeData?.products || [])
      .filter(p => p.categoryId === 'ofertas')
      .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999)),
    [storeData]
  );

  const allJewelryProducts = useMemo(() => {
    const catIds = (storeData?.categories || []).filter(c => c.storeType === 'jewelry').map(c => c.id);
    return (storeData?.products || []).filter(p => catIds.includes(p.categoryId));
  }, [storeData]);

  const getProductCount = (catId) =>
    (storeData?.products || []).filter(p => p.categoryId === catId).length;

  const galleryImages = useMemo(() =>
    allJewelryProducts
      .flatMap(p => (p.images || []).map(img => ({ image: img, text: p.title })))
      .slice(0, 24),
    [allJewelryProducts]
  );

  const deliveryLocations = storeData?.deliveryLocations || [];
  const shalomImage = storeData?.shalomImage || '';

  return (
    <div className="main-content" style={{ position: 'relative', zIndex: 1 }}>

      {/* ===== HERO SECTION ===== */}
      <section style={{
        position: 'relative', padding: '48px 20px 40px', textAlign: 'center',
        overflow: 'hidden', background: 'rgba(255,255,255,0.92)',
      }}>
        <div style={{
          position: 'absolute', top: '-50%', left: '50%', transform: 'translateX(-50%)',
          width: '200%', height: '200%', opacity: 0.04,
          background: 'radial-gradient(circle, #f76707 0%, transparent 50%)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.025,
          backgroundImage: `radial-gradient(${COLORS.navy} 1px, transparent 1px)`,
          backgroundSize: '24px 24px', pointerEvents: 'none',
        }} />

        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          {/* ===== LOGO HERO ANIMADO ===== */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            style={{ margin: '0 auto 28px', width: 160, height: 160, position: 'relative' }}
          >
            {/* Anillo exterior rotando */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute', inset: -10,
                borderRadius: '50%',
                border: '1.5px dashed rgba(247,103,7,0.25)',
              }}
            />
            {/* Anillo interior rotando al revés */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute', inset: 4,
                borderRadius: '50%',
                border: '1px dashed rgba(212,165,116,0.3)',
              }}
            />

            {/* Resplandor de fondo */}
            <motion.div
              animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0.6, 0.35] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(247,103,7,0.18) 0%, rgba(212,165,116,0.1) 50%, transparent 70%)',
                filter: 'blur(8px)',
                pointerEvents: 'none',
              }}
            />

            {/* Partículas flotantes */}
            {[
              { top: '5%',  left: '15%',  delay: 0,    dur: 3.2 },
              { top: '10%', left: '75%',  delay: 0.8,  dur: 2.8 },
              { top: '70%', left: '8%',   delay: 1.4,  dur: 3.6 },
              { top: '75%', left: '80%',  delay: 0.4,  dur: 2.5 },
              { top: '45%', left: '90%',  delay: 1.8,  dur: 3.0 },
            ].map((p, i) => (
              <motion.div key={i}
                animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
                style={{
                  position: 'absolute', top: p.top, left: p.left,
                  width: i % 2 === 0 ? 5 : 4, height: i % 2 === 0 ? 5 : 4,
                  borderRadius: '50%',
                  background: i % 2 === 0 ? COLORS.orange : COLORS.gold,
                  pointerEvents: 'none',
                }}
              />
            ))}

            {/* Logo flotando */}
            <motion.div
              animate={{ y: [0, -7, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'relative', width: '100%', height: '100%',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.95)',
                boxShadow: '0 8px 40px rgba(247,103,7,0.2), 0 2px 12px rgba(26,39,68,0.1), inset 0 1px 0 rgba(255,255,255,0.9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
                border: '2px solid rgba(212,165,116,0.3)',
              }}
            >
              {/* Brillo interno */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
                borderRadius: '50% 50% 0 0',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)',
                pointerEvents: 'none',
              }} />
              <img
                src="/logo.png"
                alt="Benito Virtual Store"
                style={{
                  width: '82%', height: '82%',
                  objectFit: 'contain',
                  position: 'relative', zIndex: 1,
                  filter: 'drop-shadow(0 2px 8px rgba(247,103,7,0.3))',
                }}
              />
            </motion.div>

            {/* Destellos ✦ en las esquinas */}
            {[
              { top: '-2%', left: '50%',  size: 10, delay: 0 },
              { top: '50%', left: '-2%',  size: 8,  delay: 1 },
              { top: '50%', left: '98%',  size: 8,  delay: 0.5 },
              { top: '98%', left: '50%',  size: 10, delay: 1.5 },
            ].map((s, i) => (
              <motion.span key={i}
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1.3, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
                style={{
                  position: 'absolute', top: s.top, left: s.left,
                  transform: 'translate(-50%, -50%)',
                  fontSize: s.size, color: COLORS.gold, pointerEvents: 'none',
                  textShadow: `0 0 8px ${COLORS.orange}`,
                }}
              >✦</motion.span>
            ))}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{
              fontFamily: '"Playfair Display", serif', fontSize: 'clamp(1.7rem, 7vw, 2.6rem)',
              fontWeight: 700, color: COLORS.navy, marginBottom: 10, lineHeight: 1.15,
            }}
          >
            Benito Virtual Store
          </motion.h1>

          <motion.div
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 18 }}
          >
            <div className="elegant-divider" style={{ width: 44 }} />
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              <IconHeart size={15} color={COLORS.orange} fill={COLORS.orange} />
            </motion.div>
            <div className="elegant-divider" style={{ width: 44 }} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            style={{
              fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(1.05rem, 3.5vw, 1.35rem)',
              color: COLORS.textMuted, fontStyle: 'italic', marginBottom: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap',
            }}
          >
            <span>joyería con</span>
            <RotatingText
              texts={['Elegancia', 'Amor', 'Estilo', 'pasión', 'Encanto']}
              staggerFrom="last"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '-120%', opacity: 0 }}
              staggerDuration={0.025}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              rotationInterval={2500}
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
            style={{
              fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem',
              color: COLORS.textMuted, maxWidth: 340, margin: '0 auto', lineHeight: 1.7,
            }}
          >
            Descubre nuestra colección exclusiva de joyería,
            diseñada para momentos especiales
          </motion.p>
        </motion.div>
      </section>

      {/* ===== OFFERS ===== */}
      {offerProducts.length > 0 && (
        <section style={{
          padding: '36px 16px', position: 'relative',
          background: 'linear-gradient(180deg, rgba(254,252,249,0.92) 0%, rgba(255,244,230,0.6) 100%)',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, width: 3, height: '100%',
            background: `linear-gradient(180deg, ${COLORS.orange}, transparent)`,
          }} />

          <motion.div {...fadeUp}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                <IconSparkles size={22} color={COLORS.orange} />
              </motion.div>
              <h2 style={{
                fontFamily: '"Playfair Display", serif', fontSize: '1.35rem',
                fontWeight: 600, color: COLORS.navy,
              }}>
                Ofertas Especiales
              </h2>
            </div>
            <p style={{
              fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem',
              color: COLORS.textMuted, fontStyle: 'italic', marginBottom: 16,
            }}>
              Aprovecha estas promociones exclusivas
            </p>

            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{ textAlign: 'center', marginBottom: 20 }}
            >
              <dotlottie-wc
                src="https://lottie.host/f605aec1-2e91-496b-9b55-4982e2f75047/Ow0BUEgWTP.lottie"
                style={{ width: '80px', height: '80px', margin: '0 auto' }}
                autoplay loop
              />
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {isLoading
                ? [0,1,2,3].map(i => <ProductCardSkeleton key={i} />)
                : offerProducts.map((product, i) => (
                    <ProductCard key={product.id} product={product} index={i} showOfferTag storeData={storeData} siblingProducts={offerProducts} siblingIndex={i} />
                  ))
              }
            </div>
          </motion.div>
        </section>
      )}

      {/* ===== COLLECTIONS ===== */}
      <section style={{
        padding: '40px 16px', position: 'relative',
        background: 'rgba(255,255,255,0.92)',
      }}>
        <motion.div {...fadeUp}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2.5, repeat: Infinity }}>
              <IconStars size={22} color={COLORS.orange} />
            </motion.div>
            <h2 style={{
              fontFamily: '"Playfair Display", serif', fontSize: '1.35rem',
              fontWeight: 600, color: COLORS.navy,
            }}>
              Nuestras colecciones
            </h2>
          </div>
          <p style={{
            fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem',
            color: COLORS.textMuted, fontStyle: 'italic', marginBottom: 28,
          }}>
            Explora cada categoría y encuentra tu pieza ideal
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 18,
          }}>
            {isLoading
              ? [0,1,2,3].map(i => (
                  <div key={i} style={{ borderRadius: 20, overflow: 'hidden', border: `1px solid ${COLORS.borderLight}` }}>
                    <div className="skeleton-shimmer" style={{ height: 200 }} />
                  </div>
                ))
              : jewelryCategories.map((cat, i) => (
                  <CategoryCard key={cat.id} category={cat} index={i}
                    productCount={getProductCount(cat.id)}
                    onClick={() => onNavigateCategory(cat.id)}
                  />
                ))
            }
          </div>
        </motion.div>
      </section>

      {/* ===== DIGITAL CATALOG ===== */}
      <section style={{
        padding: '48px 16px', textAlign: 'center', position: 'relative',
        background: 'linear-gradient(180deg, rgba(248,249,250,0.92) 0%, rgba(255,255,255,0.92) 100%)',
      }}>
        <motion.div {...fadeUp}>
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3.5, repeat: Infinity }}>
            <dotlottie-wc
              src="https://lottie.host/843dc3e9-342c-4e58-94f5-ebdeabe52e61/TZVqV3VA2v.lottie"
              style={{ width: '150px', height: '150px', margin: '0 auto' }}
              autoplay loop
            />
          </motion.div>
          <h3 style={{
            fontFamily: '"Playfair Display", serif', fontSize: '1.15rem',
            fontWeight: 600, color: COLORS.navy, marginTop: 16, marginBottom: 8,
          }}>
            Catálogo Digital
          </h3>
          <div className="elegant-divider" style={{ marginBottom: 12 }} />
          <p style={{
            fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem',
            color: COLORS.textMuted, maxWidth: 300, margin: '0 auto', lineHeight: 1.6,
          }}>
            Navega por nuestro Catálogo completo desde la comodidad de tu dispositivo
          </p>
        </motion.div>
      </section>

      {/* ===== GALLERY - CircularGallery ===== */}
      {galleryImages.length > 0 && (
        <section style={{
          position: 'relative', overflow: 'hidden',
          background: `linear-gradient(135deg, ${COLORS.navyDark} 0%, ${COLORS.navy} 50%, ${COLORS.navyLight} 100%)`,
          paddingTop: 48,
        }}>
          {/* Dot pattern */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.05,
            backgroundImage: 'radial-gradient(circle, rgba(247,103,7,0.5) 1px, transparent 1px)',
            backgroundSize: '30px 30px', pointerEvents: 'none',
          }} />

          {/* Header */}
          <div style={{ padding: '0 16px', marginBottom: 16, textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <motion.h2 {...fadeUp} style={{
              fontFamily: '"Playfair Display", serif', fontSize: '1.35rem',
              fontWeight: 600, color: COLORS.white, marginBottom: 8,
            }}>
              Nuestra galería
            </motion.h2>
            <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}>
              <div className="elegant-divider" style={{ background: 'linear-gradient(90deg, #f76707, #d4a574)', marginBottom: 8 }} />
            </motion.div>
            <p style={{
              fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem',
              color: 'rgba(255,255,255,0.92)', fontStyle: 'italic',
            }}>
              Desliza para explorar nuestras piezas
            </p>
          </div>

          {/* CircularGallery */}
          <div style={{ height: '420px', position: 'relative', zIndex: 1 }}>
            <CircularGallery
              items={galleryImages}
              bend={1}
              textColor="#ffffff"
              borderRadius={0.05}
              scrollSpeed={2}
              scrollEase={0.05}
            />
          </div>
        </section>
      )}

      {/* ===== DELIVERY & SHIPPING ===== */}
      <DeliverySection deliveryLocations={deliveryLocations} shalomImage={shalomImage} />

      {/* ===== SECOND STORE ===== */}
      <section style={{
        padding: '40px 20px', textAlign: 'center', position: 'relative',
        background: `linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.navyDark} 100%)`,
        borderTop: `3px solid ${COLORS.orange}`,
      }}>
        <motion.div {...fadeUp}>
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }}>
            <dotlottie-wc
              src="https://lottie.host/5af05446-f723-40d6-a8cf-85262739629a/BJ4AfBpEnq.lottie"
              style={{ width: '90px', height: '90px', margin: '0 auto 14px' }}
              autoplay loop
            />
          </motion.div>
          <h3 style={{
            fontFamily: '"Playfair Display", serif', fontSize: '1.15rem',
            fontWeight: 600, color: COLORS.white, marginBottom: 8,
          }}>
            Tienda General
          </h3>
          <div className="elegant-divider" style={{ background: 'linear-gradient(90deg, #f76707, #d4a574)', marginBottom: 12 }} />
          <p style={{
            fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem',
            color: 'rgba(255,255,255,0.55)', marginBottom: 24, maxWidth: 300,
            margin: '0 auto 24px', lineHeight: 1.6,
          }}>
            Visita nuestra tienda general con mas productos para ti
          </p>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 8px 24px rgba(247,103,7,0.4)' }}
            whileTap={{ scale: 0.95 }}
            onClick={onNavigateSecondStore}
            style={{
              background: `linear-gradient(135deg, ${COLORS.orange} 0%, ${COLORS.orangeLight} 100%)`,
              color: COLORS.white, border: 'none', borderRadius: 30,
              padding: '13px 36px', fontFamily: '"Outfit", sans-serif',
              fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}
          >
            Explorar Tienda
            <IconArrowRight size={16} />
          </motion.button>
        </motion.div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{
        padding: '28px 16px 40px', textAlign: 'center',
        background: 'rgba(255,255,255,0.94)', borderTop: `1px solid ${COLORS.borderLight}`,
      }}>
        <motion.div {...fadeUp}>
          <img src="/logo.png" alt="Benito Store"
            style={{ height: 52, marginBottom: 12, objectFit: 'contain' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <p style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.68rem', color: COLORS.textMuted, letterSpacing: '2px' }}>
            BENITO VIRTUAL STORE
          </p>
          <p style={{
            fontFamily: '"Cormorant Garamond", serif', fontSize: '0.85rem',
            color: COLORS.textMuted, fontStyle: 'italic', marginTop: 4,
          }}>
            Elegancia en cada detalle
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12 }}>
            {[0, 1, 2].map(i => (
              <motion.div key={i}
                animate={{ opacity: [0.2, 0.6, 0.2] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                style={{ width: 4, height: 4, borderRadius: '50%', background: COLORS.orange }}
              />
            ))}
          </div>
        </motion.div>
      </footer>
    </div>
  );
}