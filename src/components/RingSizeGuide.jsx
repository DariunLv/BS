// src/components/RingSizeGuide.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Bloque "¿No sabes tu talla?" que se muestra DEBAJO de la descripción
// SOLO en productos de categoría "anillos" cuando el admin ha configurado
// al menos un video o una foto.
//
// Estilo: combina con el resto del modal (icono navy en círculo orangePale,
// tipografía Outfit/Playfair, bordes redondeados, paleta navy/orange).
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconRulerMeasure, IconPlayerPlayFilled, IconPhoto, IconX, IconZoomIn } from '@tabler/icons-react';
import { COLORS } from '../utils/theme';

/**
 * Detecta el tipo de URL de video y devuelve la URL embebible apropiada.
 * Soporta: YouTube (varios formatos), Vimeo, y cualquier URL de archivo de video (.mp4, etc.)
 */
function detectVideo(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  // YouTube: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/shorts/ID
  const yt = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
  if (yt) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1`,
    };
  }
  // Vimeo: vimeo.com/123456789
  const vm = trimmed.match(/vimeo\.com\/(\d+)/);
  if (vm) {
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vm[1]}`,
    };
  }
  // Drive (link de Google Drive público) — formato /file/d/ID/view
  const gd = trimmed.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (gd) {
    return {
      type: 'gdrive',
      embedUrl: `https://drive.google.com/file/d/${gd[1]}/preview`,
    };
  }
  // Asumir URL directa de video
  return { type: 'direct', embedUrl: trimmed };
}

export default function RingSizeGuide({ guide }) {
  const [videoOpen, setVideoOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);

  const videoInfo = useMemo(() => detectVideo(guide?.videoUrl), [guide?.videoUrl]);
  const hasVideo = !!videoInfo;
  const hasPhoto = !!guide?.photo;
  const text = guide?.text || '¿No sabes tu talla? Mira este video para descubrirlo';

  if (!hasVideo && !hasPhoto) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        style={{ marginBottom: 24 }}
      >
        {/* Header con icono — mismo estilo que "Descripción" y "Especificaciones" */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: COLORS.orangePale, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(247,103,7,0.1)',
          }}>
            <IconRulerMeasure size={14} color={COLORS.orange} />
          </div>
          <span style={{
            fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem',
            color: COLORS.navy, fontWeight: 600,
          }}>Guía de tallas</span>
        </div>

        {/* Tarjeta principal */}
        <div style={{
          padding: '14px 16px',
          borderRadius: 14,
          background: `linear-gradient(135deg, ${COLORS.orangePale} 0%, ${COLORS.offWhite} 100%)`,
          border: `1px solid ${COLORS.borderLight}`,
        }}>
          <p style={{
            margin: '0 0 12px 0',
            fontFamily: '"Cormorant Garamond", serif',
            fontStyle: 'italic',
            fontSize: '0.98rem',
            color: COLORS.navy,
            lineHeight: 1.45,
          }}>
            {text}
          </p>

          {/* Botones para ver video y foto */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {hasVideo && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setVideoOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 16px', borderRadius: 999,
                  background: `linear-gradient(135deg, ${COLORS.orange}, #ff922b)`,
                  border: 'none', cursor: 'pointer',
                  color: '#fff', fontFamily: '"Outfit", sans-serif',
                  fontWeight: 600, fontSize: '0.78rem',
                  boxShadow: '0 4px 12px rgba(247,103,7,0.28)',
                  flex: hasPhoto ? '1 1 auto' : '1 1 100%',
                  justifyContent: 'center',
                  minWidth: 130,
                }}
              >
                <IconPlayerPlayFilled size={14} />
                <span>Ver video</span>
              </motion.button>
            )}
            {hasPhoto && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setPhotoOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 16px', borderRadius: 999,
                  background: COLORS.white,
                  border: `1.5px solid ${COLORS.navy}`,
                  cursor: 'pointer',
                  color: COLORS.navy, fontFamily: '"Outfit", sans-serif',
                  fontWeight: 600, fontSize: '0.78rem',
                  flex: hasVideo ? '1 1 auto' : '1 1 100%',
                  justifyContent: 'center',
                  minWidth: 130,
                }}
              >
                <IconPhoto size={14} />
                <span>Ver guía</span>
              </motion.button>
            )}
          </div>

          {/* Miniatura clickeable de la foto (si solo hay foto, o como complemento visual) */}
          {hasPhoto && (
            <motion.div
              whileHover={{ scale: 1.01 }}
              onClick={() => setPhotoOpen(true)}
              style={{
                marginTop: 12,
                borderRadius: 10,
                overflow: 'hidden',
                cursor: 'pointer',
                position: 'relative',
                border: `1px solid ${COLORS.borderLight}`,
                background: COLORS.white,
              }}
            >
              <img
                src={guide.photo}
                alt="Guía de tallas"
                style={{ width: '100%', display: 'block', maxHeight: 200, objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 50%)',
                pointerEvents: 'none',
              }}>
                <div style={{
                  background: 'rgba(255,255,255,0.95)', borderRadius: 999,
                  padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 5,
                  position: 'absolute', bottom: 10, right: 10,
                  fontFamily: '"Outfit", sans-serif', fontSize: '0.65rem',
                  color: COLORS.navy, fontWeight: 600,
                }}>
                  <IconZoomIn size={12} />
                  Ampliar
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ───── Modal del VIDEO ───── */}
      <AnimatePresence>
        {videoOpen && hasVideo && (
          <Lightbox onClose={() => setVideoOpen(false)} title="Guía de tallas">
            <VideoEmbed info={videoInfo} />
          </Lightbox>
        )}
      </AnimatePresence>

      {/* ───── Modal de la FOTO (zoom) ───── */}
      <AnimatePresence>
        {photoOpen && hasPhoto && (
          <Lightbox onClose={() => setPhotoOpen(false)} title="Guía de tallas">
            <img
              src={guide.photo}
              alt="Guía de tallas ampliada"
              style={{
                maxWidth: '100%', maxHeight: '78vh',
                display: 'block', margin: '0 auto',
                borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
              }}
            />
          </Lightbox>
        )}
      </AnimatePresence>
    </>
  );
}

/* ───────────────────── COMPONENTES INTERNOS ───────────────────── */

function Lightbox({ children, onClose, title }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.85)',
        zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 20 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%', maxWidth: 760,
          maxHeight: '90vh',
        }}
      >
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: -42, right: 0,
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.25)',
            color: '#fff', borderRadius: 999,
            width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 2,
          }}
          aria-label="Cerrar"
        >
          <IconX size={18} />
        </button>
        {/* Título */}
        {title && (
          <div style={{
            position: 'absolute', top: -36, left: 0,
            color: '#fff', fontFamily: '"Playfair Display", serif',
            fontWeight: 500, fontSize: '1rem',
            opacity: 0.9,
          }}>{title}</div>
        )}
        {children}
      </motion.div>
    </motion.div>
  );
}

function VideoEmbed({ info }) {
  if (!info) return null;
  // iframe para YouTube / Vimeo / Drive
  if (info.type === 'youtube' || info.type === 'vimeo' || info.type === 'gdrive') {
    return (
      <div style={{
        position: 'relative',
        width: '100%',
        paddingTop: '56.25%', /* 16:9 */
        borderRadius: 12,
        overflow: 'hidden',
        background: '#000',
        boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
      }}>
        <iframe
          src={info.embedUrl}
          title="Guía de tallas"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
          }}
        />
      </div>
    );
  }
  // Tag de video directo
  return (
    <video
      src={info.embedUrl}
      controls
      autoPlay
      playsInline
      style={{
        width: '100%', maxHeight: '78vh',
        display: 'block',
        borderRadius: 12, background: '#000',
        boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
      }}
    />
  );
}