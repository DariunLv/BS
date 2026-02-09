// src/components/DeliverySection.jsx
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { IconMapPin, IconTruck, IconPackage, IconMapPinFilled } from '@tabler/icons-react';
import { COLORS } from '../utils/theme';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
};

function LeafletMap({ locations }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined') return;

    import('leaflet').then((L) => {
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // Custom styled orange marker
      const createCustomIcon = (name) => {
        return L.divIcon({
          className: 'custom-map-marker',
          html: `
            <div style="
              display: flex; flex-direction: column; align-items: center;
              filter: drop-shadow(0 3px 6px rgba(0,0,0,0.3));
            ">
              <div style="
                width: 36px; height: 36px; border-radius: 50% 50% 50% 0;
                background: linear-gradient(135deg, #f76707, #ff922b);
                transform: rotate(-45deg);
                display: flex; align-items: center; justify-content: center;
                border: 2px solid white;
                box-shadow: 0 2px 8px rgba(247,103,7,0.4);
              ">
                <div style="
                  transform: rotate(45deg); color: white;
                  font-size: 16px; font-weight: bold;
                ">📍</div>
              </div>
            </div>
          `,
          iconSize: [36, 42],
          iconAnchor: [18, 42],
          popupAnchor: [0, -42],
        });
      };

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const center = [-15.4980, -70.1290];
      const map = L.map(mapRef.current, {
        scrollWheelZoom: false,
        dragging: true,
        touchZoom: true,
        zoomControl: false,
      }).setView(center, 15);

      // Add zoom control to bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;

      // Prettier tile layer - CartoDB Voyager (cleaner, modern look)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      if (locations && locations.length > 0) {
        const bounds = [];
        locations.forEach((loc) => {
          if (loc.lat && loc.lng) {
            const icon = createCustomIcon(loc.name);
            const marker = L.marker([loc.lat, loc.lng], { icon }).addTo(map);
            marker.bindPopup(
              `<div style="
                font-family: 'Outfit', sans-serif; text-align: center; padding: 8px 4px; min-width: 140px;
              ">
                <div style="
                  font-size: 14px; font-weight: 600; color: #1a2744; margin-bottom: 4px;
                ">${loc.name}</div>
                <div style="
                  display: inline-flex; align-items: center; gap: 4px;
                  background: linear-gradient(135deg, #f76707, #ff922b);
                  color: white; padding: 3px 10px; border-radius: 12px;
                  font-size: 10px; font-weight: 500; letter-spacing: 0.5px;
                ">
                  📍 Punto de entrega
                </div>
              </div>`,
              { className: 'benito-popup', closeButton: false }
            );

            // Add a subtle pulsing circle around marker
            L.circle([loc.lat, loc.lng], {
              radius: 60,
              color: '#f76707',
              fillColor: '#f76707',
              fillOpacity: 0.08,
              weight: 1,
              opacity: 0.25,
            }).addTo(map);

            bounds.push([loc.lat, loc.lng]);
          }
        });

        if (bounds.length > 1) {
          map.fitBounds(bounds, { padding: [40, 40] });
        }
      }

      setTimeout(() => map.invalidateSize(), 200);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [locations]);

  return (
    <div style={{
      position: 'relative', borderRadius: 20, overflow: 'hidden',
      boxShadow: '0 12px 40px rgba(26,39,68,0.12)',
    }}>
      {/* Decorative top bar */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.navyLight} 100%)`,
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <IconMapPinFilled size={14} color={COLORS.orange} />
        <span style={{
          fontFamily: '"Outfit", sans-serif', fontSize: '0.7rem',
          color: 'rgba(255,255,255,0.75)', letterSpacing: '1.5px', textTransform: 'uppercase',
          fontWeight: 500,
        }}>
          Mapa de Puntos de Entrega — Juliaca
        </span>
      </div>

      {/* Map */}
      <div ref={mapRef} style={{ width: '100%', height: 340 }} />

      {/* Decorative bottom bar */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.navyLight} 100%)`,
        padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS.orange, opacity: 0.6 }} />
        <span style={{
          fontFamily: '"Cormorant Garamond", serif', fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.5)', fontStyle: 'italic',
        }}>
          Toca los marcadores para ver detalles
        </span>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS.orange, opacity: 0.6 }} />
      </div>
    </div>
  );
}

export default function DeliverySection({ deliveryLocations = [], shalomImage = '' }) {
  return (
    <>
      {/* ===== DELIVERY POINTS SECTION ===== */}
      <section style={{
        padding: '48px 16px', position: 'relative',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(254,252,249,0.95) 100%)',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, width: 3, height: '100%',
          background: `linear-gradient(180deg, ${COLORS.orange}, transparent)`,
        }} />

        <motion.div {...fadeUp}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <IconMapPin size={24} color={COLORS.orange} />
            </motion.div>
            <h2 style={{
              fontFamily: '"Playfair Display", serif', fontSize: '1.35rem',
              fontWeight: 600, color: COLORS.navy,
            }}>
              Puntos de Entrega en Juliaca
            </h2>
          </div>
          <p style={{
            fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem',
            color: COLORS.textMuted, fontStyle: 'italic', marginBottom: 22,
          }}>
            Realizamos entregas en los siguientes puntos de la ciudad
          </p>

          {/* Location Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {deliveryLocations.map((loc, i) => (
              <motion.div
                key={loc.id}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, type: 'spring', stiffness: 200 }}
                whileHover={{ scale: 1.05, y: -2 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'white', padding: '9px 16px', borderRadius: 30,
                  border: '1px solid rgba(247,103,7,0.15)',
                  boxShadow: '0 3px 12px rgba(26,39,68,0.06)',
                  cursor: 'default',
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f76707, #ff922b)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <IconMapPin size={11} color="white" />
                </div>
                <span style={{
                  fontFamily: '"Outfit", sans-serif', fontSize: '0.78rem',
                  color: COLORS.navy, fontWeight: 500,
                }}>
                  {loc.name}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Map */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <LeafletMap locations={deliveryLocations} />
          </motion.div>
        </motion.div>
      </section>

      {/* ===== SHALOM SHIPPING SECTION ===== */}
      <section style={{
        padding: '48px 16px', position: 'relative', textAlign: 'center',
        background: `linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.navyDark} 100%)`,
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'radial-gradient(circle, rgba(247,103,7,0.5) 1px, transparent 1px)',
          backgroundSize: '25px 25px', pointerEvents: 'none',
        }} />

        <motion.div {...fadeUp} style={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div style={{
              width: 70, height: 70, borderRadius: '50%', margin: '0 auto 16px',
              background: 'rgba(247,103,7,0.12)', border: '1px solid rgba(247,103,7,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconTruck size={32} color={COLORS.orange} />
            </div>
          </motion.div>

          <h2 style={{
            fontFamily: '"Playfair Display", serif', fontSize: '1.3rem',
            fontWeight: 600, color: COLORS.white, marginBottom: 8,
          }}>
            ¿No eres de Juliaca?
          </h2>

          <motion.div
            initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}
            style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}
          >
            <div style={{
              width: 50, height: 2, borderRadius: 1,
              background: 'linear-gradient(90deg, transparent, #f76707, transparent)',
            }} />
          </motion.div>

          <p style={{
            fontFamily: '"Outfit", sans-serif', fontSize: '0.9rem',
            color: 'rgba(255,255,255,0.75)', marginBottom: 6, lineHeight: 1.6,
          }}>
            ¡No te preocupes! Hacemos envíos a todo el Peru
          </p>
          <p style={{
            fontFamily: '"Outfit", sans-serif', fontSize: '1.05rem',
            color: COLORS.white, marginBottom: 28, fontWeight: 600,
          }}>
            mediante <span style={{
              color: COLORS.orange,
              background: 'rgba(247,103,7,0.12)',
              padding: '4px 14px', borderRadius: 20,
              border: '1px solid rgba(247,103,7,0.25)',
            }}>SHALOM</span>
          </p>

          {/* Shalom Image */}
          {shalomImage ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              style={{
                maxWidth: 320, margin: '0 auto',
                borderRadius: 20, overflow: 'hidden',
                border: '2px solid rgba(247,103,7,0.3)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
              }}
            >
              <img src={shalomImage} alt="envíos por Shalom"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              style={{
                maxWidth: 280, margin: '0 auto', padding: '32px 24px',
                borderRadius: 20, border: '2px dashed rgba(247,103,7,0.25)',
                background: 'rgba(247,103,7,0.04)',
              }}
            >
              <IconPackage size={48} color="rgba(255,255,255,0.25)" style={{ marginBottom: 12 }} />
              <p style={{
                fontFamily: '"Outfit", sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)',
              }}>
                Imagen de Shalom (subir desde admin)
              </p>
            </motion.div>
          )}

          <motion.p
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={{ once: true }} transition={{ delay: 0.5 }}
            style={{
              fontFamily: '"Cormorant Garamond", serif', fontSize: '0.85rem',
              color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', marginTop: 24,
            }}
          >
            Entregas rápidas y seguras a nivel nacional
          </motion.p>
        </motion.div>
      </section>
    </>
  );
}
