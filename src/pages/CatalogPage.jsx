// src/pages/CatalogPage.jsx
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { IconSparkles, IconHeart, IconStars, IconArrowRight } from '@tabler/icons-react';
import RotatingText from '../components/RotatingText';
import ProductCard from '../components/ProductCard';
import CategoryCard from '../components/CategoryCard';
import DeliverySection from '../components/DeliverySection';
import { COLORS } from '../utils/theme';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
};

export default function CatalogPage({ storeData, onNavigateCategory, onNavigateSecondStore }) {
  const jewelryCategories = useMemo(() =>
    (storeData?.categories || [])
      .filter(c => c.storeType === 'jewelry' && !c.isOffers)
      .sort((a, b) => a.order - b.order),
    [storeData]
  );

  const offerProducts = useMemo(() =>
    (storeData?.products || []).filter(p => p.categoryId === 'ofertas'),
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
        overflow: 'hidden', background: 'rgba(255,255,255,0.85)',
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
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ margin: '0 auto 20px', width: 130, height: 130 }}
          >
            <dotlottie-wc
              src="https://lottie.host/454dfe96-d4d9-4938-96f4-db32c761f5d0/SLbWwfzsQh.lottie"
              style={{ width: '130px', height: '130px' }}
              autoplay loop
            />
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
            Descubre nuestra colección exclusiva de joyería ,
            disenada para momentos especiales
          </motion.p>
        </motion.div>
      </section>

      {/* ===== OFFERS ===== */}
      {offerProducts.length > 0 && (
        <section style={{
          padding: '36px 16px', position: 'relative',
          background: 'linear-gradient(180deg, rgba(254,252,249,0.95) 0%, rgba(255,244,230,0.6) 100%)',
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
              {offerProducts.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} showOfferTag />
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* ===== COLLECTIONS ===== */}
      <section style={{
        padding: '40px 16px', position: 'relative',
        background: 'rgba(255,255,255,0.9)',
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
            {jewelryCategories.map((cat, i) => (
              <CategoryCard key={cat.id} category={cat} index={i}
                productCount={getProductCount(cat.id)}
                onClick={() => onNavigateCategory(cat.id)}
              />
            ))}
          </div>
        </motion.div>
      </section>

      {/* ===== DIGITAL CATALOG ===== */}
      <section style={{
        padding: '48px 16px', textAlign: 'center', position: 'relative',
        background: 'linear-gradient(180deg, rgba(248,249,250,0.95) 0%, rgba(255,255,255,0.9) 100%)',
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

      {/* ===== GALLERY ===== */}
      {galleryImages.length > 0 && (
        <section style={{
          padding: '48px 0', position: 'relative', overflow: 'hidden',
          background: `linear-gradient(135deg, ${COLORS.navyDark} 0%, ${COLORS.navy} 50%, ${COLORS.navyLight} 100%)`,
        }}>
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.05,
            backgroundImage: 'radial-gradient(circle, rgba(247,103,7,0.5) 1px, transparent 1px)',
            backgroundSize: '30px 30px', pointerEvents: 'none',
          }} />

          <div style={{ padding: '0 16px', marginBottom: 28, textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <motion.h2 {...fadeUp} style={{
              fontFamily: '"Playfair Display", serif', fontSize: '1.35rem',
              fontWeight: 600, color: COLORS.white, marginBottom: 8,
            }}>
              Nuestra Galeria
            </motion.h2>
            <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}>
              <div className="elegant-divider" style={{ background: 'linear-gradient(90deg, #f76707, #d4a574)', marginBottom: 8 }} />
            </motion.div>
            <p style={{
              fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem',
              color: 'rgba(255,255,255,0.65)', fontStyle: 'italic',
            }}>
              Una muestra de nuestras piezas mas destacadas
            </p>
          </div>

          <div style={{
            display: 'flex', gap: 14, overflowX: 'auto', padding: '0 16px 20px',
            scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none', position: 'relative', zIndex: 1,
          }}>
            {galleryImages.map((item, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
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
                  fontFamily: '"Outfit", sans-serif', fontSize: '0.68rem',
                  color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 8,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{item.text}</p>
              </motion.div>
            ))}
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
        background: 'rgba(255,255,255,0.95)', borderTop: `1px solid ${COLORS.borderLight}`,
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
