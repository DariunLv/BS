// src/components/SaveIndicator.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Indicador flotante que muestra el estado real del guardado.
// Estados:
//   idle    → invisible
//   saving  → "Guardando…" (color naranja, con spinner)
//   saved   → "Guardado" (color verde, se oculta en 2s)
//   error   → "Reintentando…" (color amarillo, con contador de pendientes)
//   offline → "Sin conexión - se guardará al volver" (gris)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { IconCheck, IconAlertTriangle, IconCloudOff } from '@tabler/icons-react';
import { subscribeSaveStatus, flushSaveQueue } from '../utils/saveQueue';

export default function SaveIndicator({ visible = true }) {
  const [state, setState] = useState({ status: 'idle', pending: 0, error: null });

  useEffect(() => {
    const unsub = subscribeSaveStatus(setState);
    return unsub;
  }, []);

  if (!visible) return null;
  if (state.status === 'idle') return null;

  const config = {
    saving: {
      bg: 'linear-gradient(135deg, #f76707, #ff8c42)',
      icon: <Spinner />,
      text: state.pending > 1 ? `Guardando ${state.pending}…` : 'Guardando…',
    },
    saved: {
      bg: 'linear-gradient(135deg, #20c997, #12b886)',
      icon: <IconCheck size={15} stroke={2.5} />,
      text: 'Guardado',
    },
    error: {
      bg: 'linear-gradient(135deg, #f59f00, #f08c00)',
      icon: <IconAlertTriangle size={15} stroke={2} />,
      text: state.pending > 0
        ? `Reintentando (${state.pending} pendiente${state.pending > 1 ? 's' : ''})`
        : 'Reintentando…',
    },
    offline: {
      bg: 'linear-gradient(135deg, #868e96, #495057)',
      icon: <IconCloudOff size={15} stroke={2} />,
      text: state.pending > 0
        ? `Sin conexión · ${state.pending} pendiente${state.pending > 1 ? 's' : ''}`
        : 'Sin conexión',
    },
  };

  const cur = config[state.status] || config.saving;
  const handleForceFlush = () => { flushSaveQueue(15000); };

  return (
    <AnimatePresence>
      <motion.div
        key={state.status}
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        onClick={state.status === 'error' || state.status === 'offline' ? handleForceFlush : undefined}
        style={{
          position: 'fixed',
          bottom: 92,
          right: 16,
          zIndex: 9999,
          padding: '10px 14px',
          borderRadius: 999,
          background: cur.bg,
          color: '#fff',
          fontSize: 13,
          fontWeight: 600,
          fontFamily: 'Outfit, sans-serif',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.12)',
          cursor: (state.status === 'error' || state.status === 'offline') ? 'pointer' : 'default',
          userSelect: 'none',
          maxWidth: '85vw',
        }}
        title={state.error || ''}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 15 }}>{cur.icon}</span>
        <span>{cur.text}</span>
      </motion.div>
    </AnimatePresence>
  );
}

function Spinner() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 14,
        height: 14,
        borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.35)',
        borderTopColor: '#fff',
        animation: 'benitoSpin 0.7s linear infinite',
      }}
    />
  );
}

// Inyectar keyframes una sola vez
if (typeof document !== 'undefined' && !document.getElementById('benito-spin-kf')) {
  const s = document.createElement('style');
  s.id = 'benito-spin-kf';
  s.textContent = '@keyframes benitoSpin { to { transform: rotate(360deg); } }';
  document.head.appendChild(s);
}