// src/components/DeliverySection.jsx
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { IconMapPin, IconTruck, IconPackage, IconMapPinFilled, IconNavigation } from '@tabler/icons-react';
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

      // SVG marker profesional (sin emojis)
      const createCustomIcon = (index) => {
        return L.divIcon({
          className: 'benito-marker',
          html: `
            <div style="
              display: flex; flex-direction: column; align-items: center;
              filter: drop-shadow(0 4px 8px rgba(26,39,68,0.35));
              transform: translate(-50%, -100%);
            ">
              <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26s16-14 16-26C32 7.163 24.837 0 16 0z" fill="url(#grad_${index})"/>
                <circle cx="16" cy="15" r="7" fill="white" opacity="0.95"/>
                <circle cx="16" cy="15" r="3.5" fill="#f76707"/>
                <defs>
                  <linearGradient id="grad_${index}" x1="0" y1="0" x2="32" y2="42" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#f76707"/>
                    <stop offset="1" stop-color="#e8590c"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          `,
          iconSize: [32, 42],
          iconAnchor: [16, 42],
          popupAnchor: [0, -44],
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

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      mapInstanceRef.current = map;

      // Tile layer limpio y moderno
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      if (locations && locations.length > 0) {
        const bounds = [];
        locations.forEach((loc, i) => {
          if (loc.lat && loc.lng) {
            const icon = createCustomIcon(i);
            const marker = L.marker([loc.lat, loc.lng], { icon }).addTo(map);

            marker.bindPopup(
              `<div style="
                font-family: 'Outfit', sans-serif;
                text-align: center;
                padding: 10px 8px 8px;
                min-width: 160px;
              ">
                <div style="
                  width: 32px; height: 32px; border-radius: 50%;
                  background: linear-gradient(135deg, #fff4e6, #ffe8cc);
                  display: flex; align-items: center; justify-content: center;
                  margin: 0 auto 8px;
                  border: 1.5px solid rgba(247,103,7,0.2);
                ">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f76707" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                <div style="
                  font-size: 13px; font-weight: 600; color: #1a2744;
                  margin-bottom: 6px; line-height: 1.3;
                ">${loc.name}</div>
                <div style="
                  display: inline-flex; align-items: center; gap: 5px;
                  background: linear-gradient(135deg, #1a2744, #2c4a80);
                  color: white; padding: 4px 12px; border-radius: 14px;
                  font-size: 9.5px; font-weight: 500; letter-spacing: 0.5px;
                  text-transform: uppercase;
                ">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  Punto de entrega
                </div>
              </div>`,
              {
                className: 'benito-popup',
                closeButton: false,
                maxWidth: 200,
              }
            );

            // Circulo sutil de area
            L.circle([loc.lat, loc.lng], {
              radius: 50,
              color: '#f76707',
              fillColor: '#f76707',
              fillOpacity: 0.06,
              weight: 1,
              opacity: 0.2,
              dashArray: '4 4',
            }).addTo(map);

            bounds.push([loc.lat, loc.lng]);
          }
        });

        if (bounds.length > 1) {
          map.fitBounds(bounds, { padding: [50, 50] });
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
      position: 'relative', borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(26,39,68,0.12)',
      border: `1px solid ${COLORS.borderLight}`,
    }}>
      {/* Header del mapa */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.navyLight} 100%)`,
        padding: '12px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'rgba(247,103,7,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(247,103,7,0.25)',
          }}>
            <IconNavigation size={14} color={COLORS.orange} />
          </div>
          <div>
            <span style={{
              fontFamily: '"Outfit", sans-serif', fontSize: '0.75rem',
              color: 'white', fontWeight: 600, letterSpacing: '0.3px',
              display: 'block', lineHeight: 1.2,
            }}>
              Puntos de Entrega
            </span>
            <span style={{
              fontFamily: '"Outfit", sans-serif', fontSize: '0.6rem',
              color: 'rgba(255,255,255,0.5)', fontWeight: 400,
            }}>
              Juliaca, Puno
            </span>
          </div>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '3px 10px', borderRadius: 12,
          fontFamily: '"Outfit", sans-serif', fontSize: '0.6rem',
          color: 'rgba(255,255,255,0.6)', fontWeight: 500,
        }}>
          {locations?.length || 0} ubicaciones
        </div>
      </div>

      {/* Mapa */}
      <div ref={mapRef} style={{ width: '100%', height: 360 }} />

      {/* Footer del mapa */}
      <div style={{
        background: 'white',
        padding: '10px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        borderTop: `1px solid ${COLORS.borderLight}`,
      }}>
        <IconMapPinFilled size={12} color={COLORS.orange} />
        <span style={{
          fontFamily: '"Outfit", sans-serif', fontSize: '0.68rem',
          color: COLORS.textMuted, fontWeight: 400,
        }}>
          Toca los marcadores para ver detalles
        </span>
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
            No eres de Juliaca?
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
            No te preocupes! Hacemos envios a todo el Peru
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
              <img src={shalomImage} alt="envios por Shalom"
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
            Entregas rapidas y seguras a nivel nacional
          </motion.p>
        </motion.div>
      </section>
    </>
  );
}