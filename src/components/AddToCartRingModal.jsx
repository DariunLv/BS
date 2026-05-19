// src/components/AddToCartRingModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Modal de personalización del anillo. Reglas finales:
//   - Packs: SELECCIONABLES (botón Añadir/Quitar). SUMAN al subtotal en vivo.
//   - Packs: además tienen botón "Ver detalle" que abre overlay con info.
//   - Agregados: seleccionables. Si tienen precio se SUMA; si no, GRATIS.
//   - Extras: SIEMPRE GRATIS (no se suman).
//   - Cajas: automáticas e incluidas (info, no se selecciona).
//   - Al confirmar: se agrega el ANILLO al carrito + cada PACK seleccionado
//     como item separado.
//   - Confirmación al cerrar si hay cambios sin agregar.
//   - Aviso de pre-orden si el producto está agotado.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconX, IconCheck, IconShoppingBagPlus, IconGift, IconBox,
  IconMinus, IconPlus, IconPackage,
  IconSparkles, IconStar, IconBrandWhatsapp, IconEye,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { COLORS } from '../utils/theme';
import { useCart } from '../utils/CartContext';
import {
  buildProductSnapshot, detectCajaForProduct, formatSoles,
  buildSingleProductWhatsAppMessage,
} from '../utils/cart';
import { getWhatsappNumber } from '../utils/store';
import useImages from '../hooks/useImages';

export default function AddToCartRingModal({
  open, onClose, product, storeData,
}) {
  const { addToCart, setCartOpen, customerName } = useCart();
  const [qty, setQty] = useState(1);
  const [addedAgregados, setAddedAgregados] = useState(new Set());
  const [addedExtras, setAddedExtras] = useState(new Set());
  const [selectedPacks, setSelectedPacks] = useState(new Set());
  const [feedback, setFeedback] = useState(null);
  const [packDetail, setPackDetail] = useState(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const feedbackTimerRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQty(1);
      setAddedAgregados(new Set());
      setAddedExtras(new Set());
      setSelectedPacks(new Set());
      setFeedback(null);
      setPackDetail(null);
      setShowCloseConfirm(false);
    } else {
      // Cuando cierra, asegurar que los overlays auxiliares también se cierran
      setPackDetail(null);
      setShowCloseConfirm(false);
    }
  }, [open]);

  // Limpiar timer al desmontar el componente — evita callbacks zombi
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = null;
      }
    };
  }, []);

  const caja = useMemo(
    () => detectCajaForProduct(product, storeData?.ringBoxes || {}),
    [product, storeData?.ringBoxes]
  );
  const allAgregados = useMemo(
    () => (storeData?.agregados || []).sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999)),
    [storeData?.agregados]
  );
  const allExtras = useMemo(
    () => (storeData?.ringExtras || []).sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999)),
    [storeData?.ringExtras]
  );
  const allPacks = useMemo(
    () => (storeData?.products || []).filter(p => p.categoryId?.includes('pack') && !p.hidden && !p.soldOut),
    [storeData?.products]
  );

  if (!product) return null;

  /** Verifica si hay cambios sin confirmar */
  const hasUnconfirmedChanges = () =>
    addedAgregados.size > 0 || addedExtras.size > 0 || selectedPacks.size > 0;

  /** Intenta cerrar; si hay cambios, pide confirmación */
  const handleClose = () => {
    if (feedback === 'added') { onClose(); return; }
    if (hasUnconfirmedChanges() && !showCloseConfirm) {
      setShowCloseConfirm(true);
      return;
    }
    onClose();
  };

  const togglePack = (id) => {
    setSelectedPacks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleAgregado = (id) => {
    setAddedAgregados(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleExtra = (id) => {
    setAddedExtras(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const buildCurrentConfiguration = () => ({
    caja,
    agregadosIncluidos: allAgregados
      .filter(a => addedAgregados.has(a.id))
      .map(a => ({ id: a.id, title: a.title || '', tag: a.tag || '', price: parseFloat(a.price) || 0 })),
    extrasIncluidos: allExtras
      .filter(x => addedExtras.has(x.id))
      .map(x => ({ id: x.id, title: x.title || '', tag: x.tag || '' })),
    packsSeleccionados: allPacks
      .filter(p => selectedPacks.has(p.id))
      .map(p => ({ id: p.id, title: p.title || '', price: parseFloat(p.price) || 0 })),
  });

  /** Confirmar: agrega el anillo + cada pack seleccionado como items separados */
  const handleConfirm = () => {
    const config = buildCurrentConfiguration();
    const stockWarning = product.soldOut ? 'Producto agotado · Tu pedido será pre-orden' : '';

    // 1. Agrega el anillo configurado
    addToCart({
      productId: product.id,
      productSnapshot: buildProductSnapshot(product),
      quantity: qty,
      caja: config.caja,
      agregadosIncluidos: config.agregadosIncluidos,
      extrasIncluidos: config.extrasIncluidos,
      note: '',
      stockWarning,
    });

    // 2. Agrega cada pack seleccionado como item separado en el carrito
    allPacks.forEach(pack => {
      if (selectedPacks.has(pack.id)) {
        addToCart({
          productId: pack.id,
          productSnapshot: buildProductSnapshot(pack),
          quantity: 1,
          caja: null,
          agregadosIncluidos: [],
          extrasIncluidos: [],
          note: '',
          packInfo: { ringId: product.id, ringTitle: product.title },
        });
      }
    });

    setFeedback('added');
    // Limpiar timer previo si lo hubiera
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      feedbackTimerRef.current = null;
      onClose();
      setCartOpen(true);
    }, 750);
  };

  /** Consultar WhatsApp con todo lo seleccionado */
  const handleWhatsApp = () => {
    const config = buildCurrentConfiguration();
    const number = getWhatsappNumber();
    const { encoded } = buildSingleProductWhatsAppMessage({
      product,
      configuration: { ...config, note: '', quantity: qty },
      customerName,
      whatsappNumber: number,
    });
    window.open(`https://wa.me/${number}?text=${encoded}`, '_blank', 'noopener,noreferrer');
  };

  // ── SUBTOTAL EN VIVO ──
  const basePrice = parseFloat(product.price) || 0;
  const packsExtra = allPacks
    .filter(p => selectedPacks.has(p.id))
    .reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0);
  const agregadosExtra = allAgregados
    .filter(a => addedAgregados.has(a.id))
    .reduce((sum, a) => sum + (parseFloat(a.price) || 0), 0);
  const unitPrice = basePrice + agregadosExtra;
  const subtotal = unitPrice * qty + packsExtra;

  // ─────────────────────────────────────────────────────────────────────
  // ESTRUCTURA: cada motion.div en su PROPIO AnimatePresence con `key`.
  // Esto evita que los nodos queden "zombi" capturando clicks cuando el
  // modal se cierra mientras se abre el carrito.
  // ─────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* BACKDROP del modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="ring-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(15,26,46,0.6)', backdropFilter: 'blur(4px)',
              zIndex: 10200,
            }}
          />
        )}
      </AnimatePresence>

      {/* BOTTOM SHEET del modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="ring-modal-sheet"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              maxHeight: '92vh', background: COLORS.cream,
              zIndex: 10201, borderRadius: '24px 24px 0 0',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 -16px 50px rgba(0,0,0,0.25)',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
              <div style={{ width: 40, height: 4, background: '#dee2e6', borderRadius: 999 }} />
            </div>

            {/* Header */}
            <div style={{
              padding: '12px 18px 14px',
              borderBottom: `1px solid ${COLORS.borderLight || '#e9ecef'}`,
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
              background: COLORS.white,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontFamily: '"Outfit", sans-serif',
                  fontSize: '0.6rem', fontWeight: 700,
                  color: COLORS.orange,
                  textTransform: 'uppercase', letterSpacing: '1.5px',
                  marginBottom: 4,
                }}>
                  <IconShoppingBagPlus size={12} stroke={2.2} />
                  Personaliza tu pedido
                </div>
                <h3 style={{
                  margin: 0,
                  fontFamily: '"Playfair Display", serif',
                  fontSize: '1.1rem', fontWeight: 600,
                  color: COLORS.navy, lineHeight: 1.25,
                  overflow: 'hidden',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>{product.title}</h3>
              </div>
              <button onClick={handleClose}
                style={{
                  width: 32, height: 32, borderRadius: '50%', border: 'none',
                  background: '#f1f3f5', cursor: 'pointer', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: COLORS.navy,
                }}
                aria-label="Cerrar"
              ><IconX size={16} /></button>
            </div>

            {/* Contenido scrollable */}
            <div style={{
              flex: 1, overflowY: 'auto',
              padding: '14px 16px 24px',
              WebkitOverflowScrolling: 'touch',
            }}>
              {/* Aviso si el producto está agotado */}
              {product.soldOut && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 12px',
                  background: '#fee6e6',
                  border: '1px solid #e11d4833',
                  borderRadius: 10,
                  marginBottom: 14,
                  fontFamily: '"Outfit", sans-serif',
                  fontSize: '0.75rem',
                  color: '#c92a2a', fontWeight: 600,
                }}>
                  <IconAlertTriangle size={14} />
                  Este producto está agotado. Tu pedido quedará como pre-orden.
                </div>
              )}

              {caja && (
                <Section title="Caja incluida" icon={<IconBox size={14} />} accent="green">
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: 10,
                    background: 'rgba(26,124,62,0.08)',
                    border: '1.5px solid rgba(26,124,62,0.25)',
                    borderRadius: 12,
                  }}>
                    <IconCheck size={16} color="#1a7c3e" stroke={2.5} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.85rem', fontWeight: 600, color: COLORS.navy }}>
                        {caja.title}
                      </div>
                      <div style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.7rem', color: '#1a7c3e', fontWeight: 600 }}>
                        Gratis · Asignada automáticamente
                      </div>
                    </div>
                  </div>
                </Section>
              )}

              {/* PACKS (seleccionables, suman al subtotal) */}
              {allPacks.length > 0 && (
                <Section title="Packs de Presentación" icon={<IconPackage size={14} />} accent="orange">
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: 10,
                  }}>
                    {allPacks.slice(0, 12).map(pack => (
                      <PackCard
                        key={pack.id}
                        pack={pack}
                        selected={selectedPacks.has(pack.id)}
                        onViewDetail={() => setPackDetail(pack)}
                        onToggle={() => togglePack(pack.id)}
                      />
                    ))}
                  </div>
                </Section>
              )}

              {/* AGREGADOS (pueden tener precio o ser gratis) */}
              {allAgregados.length > 0 && (
                <Section title="Incluye gratis con tu anillo" icon={<IconGift size={14} />} accent="green">
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: 10,
                  }}>
                    {allAgregados.map(ag => (
                      <OptionCard key={ag.id}
                        item={ag}
                        added={addedAgregados.has(ag.id)}
                        onToggle={() => toggleAgregado(ag.id)}
                        accent="green"
                      />
                    ))}
                  </div>
                </Section>
              )}

              {/* EXTRAS (siempre gratis) */}
              {allExtras.length > 0 && (
                <Section title="Extras adicionales" icon={<IconSparkles size={14} />} accent="orange">
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: 10,
                  }}>
                    {allExtras.map(ex => (
                      <OptionCard key={ex.id}
                        item={{ ...ex, price: 0 }}
                        added={addedExtras.has(ex.id)}
                        onToggle={() => toggleExtra(ex.id)}
                        accent="orange"
                      />
                    ))}
                  </div>
                </Section>
              )}

              <Section title="Cantidad" icon={<IconStar size={14} />} accent="navy">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    border: `1.5px solid ${COLORS.borderLight || '#e9ecef'}`,
                    borderRadius: 999, background: COLORS.white, overflow: 'hidden',
                  }}>
                    <button onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1}
                      style={{ ...qtyBtnStyle, opacity: qty <= 1 ? 0.4 : 1 }}>
                      <IconMinus size={14} />
                    </button>
                    <span style={qtyTextStyle}>{qty}</span>
                    <button onClick={() => setQty(q => Math.min(99, q + 1))} style={qtyBtnStyle}>
                      <IconPlus size={14} />
                    </button>
                  </div>
                </div>
              </Section>
            </div>

            {/* Footer con subtotal EN VIVO */}
            <div style={{
              borderTop: `1px solid ${COLORS.borderLight || '#e9ecef'}`,
              background: COLORS.white,
              padding: '12px 16px 14px',
              paddingBottom: 'max(14px, env(safe-area-inset-bottom))',
            }}>
              {(packsExtra > 0 || agregadosExtra > 0 || qty > 1) && (
                <div style={{
                  fontFamily: '"Outfit", sans-serif',
                  fontSize: '0.7rem', color: '#868e96',
                  marginBottom: 6,
                  display: 'flex', flexDirection: 'column', gap: 2,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Anillo {qty > 1 ? `(x${qty})` : ''}</span>
                    <span>{formatSoles(basePrice * qty)}</span>
                  </div>
                  {agregadosExtra > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Agregados {qty > 1 ? `(x${qty})` : ''}</span>
                      <span>+{formatSoles(agregadosExtra * qty)}</span>
                    </div>
                  )}
                  {packsExtra > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Packs ({selectedPacks.size})</span>
                      <span>+{formatSoles(packsExtra)}</span>
                    </div>
                  )}
                </div>
              )}

              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                marginBottom: 8,
              }}>
                <span style={{
                  fontFamily: '"Outfit", sans-serif',
                  fontSize: '0.78rem', color: '#868e96',
                }}>Total</span>
                <motion.span
                  key={subtotal}
                  initial={{ scale: 1.08 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    fontFamily: '"Playfair Display", serif',
                    fontSize: '1.4rem', fontWeight: 700, color: COLORS.navy,
                  }}>{formatSoles(subtotal)}</motion.span>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleConfirm}
                disabled={feedback === 'added'}
                style={{
                  width: '100%', padding: '14px 16px',
                  border: 'none', borderRadius: 999,
                  background: feedback === 'added'
                    ? 'linear-gradient(135deg, #20c997, #12b886)'
                    : `linear-gradient(135deg, ${COLORS.orange}, #ff8c42)`,
                  color: '#fff',
                  fontFamily: '"Outfit", sans-serif',
                  fontWeight: 700, fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 6px 18px rgba(247,103,7,0.35)',
                }}>
                <AnimatePresence mode="wait">
                  {feedback === 'added' ? (
                    <motion.span key="added" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <IconCheck size={18} stroke={2.5} /> Agregado al carrito
                    </motion.span>
                  ) : (
                    <motion.span key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <IconShoppingBagPlus size={18} stroke={2.2} /> Agregar al carrito
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                margin: '10px 0',
              }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.08)' }} />
                <span style={{
                  fontFamily: '"Outfit", sans-serif',
                  fontSize: '0.62rem', color: '#adb5bd',
                  textTransform: 'uppercase', letterSpacing: '1px',
                }}>o también</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.08)' }} />
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleWhatsApp}
                style={{
                  width: '100%', padding: '12px 16px',
                  borderRadius: 999,
                  background: COLORS.white, color: '#128C7E',
                  border: '1.5px solid #25D366',
                  fontFamily: '"Outfit", sans-serif',
                  fontWeight: 600, fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                <IconBrandWhatsapp size={17} stroke={2} /> Consultar por WhatsApp
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAY DE DETALLE DEL PACK (independiente del modal) */}
      <AnimatePresence>
        {packDetail && open && (
          <PackDetailOverlay
            key="pack-detail-overlay"
            pack={packDetail}
            ringProduct={product}
            isSelected={selectedPacks.has(packDetail.id)}
            onClose={() => setPackDetail(null)}
            onToggle={() => {
              togglePack(packDetail.id);
              setPackDetail(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* CONFIRMACIÓN DE DESCARTAR CAMBIOS (independiente del modal) */}
      <AnimatePresence>
        {showCloseConfirm && open && (
          <motion.div
            key="close-confirm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowCloseConfirm(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(15,26,46,0.78)',
              zIndex: 10400,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 24,
            }}>
            <motion.div onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: COLORS.white,
                borderRadius: 16, maxWidth: 340, width: '100%',
                padding: 20, textAlign: 'center',
                boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
              }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: '#fff8e6', margin: '0 auto 12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <IconAlertTriangle size={22} color="#f59f00" stroke={2.2} />
              </div>
              <h3 style={{
                margin: '0 0 6px',
                fontFamily: '"Playfair Display", serif',
                fontSize: '1rem', fontWeight: 600, color: COLORS.navy,
              }}>¿Descartar cambios?</h3>
              <p style={{
                margin: '0 0 16px',
                fontFamily: '"Outfit", sans-serif',
                fontSize: '0.8rem', color: '#495057', lineHeight: 1.45,
              }}>Tienes opciones seleccionadas. Si cierras sin agregar al carrito, se perderán.</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setShowCloseConfirm(false)}
                  style={{
                    flex: 1, padding: '10px 14px',
                    border: `1.5px solid ${COLORS.borderLight || '#e9ecef'}`,
                    background: COLORS.white,
                    color: COLORS.navy,
                    borderRadius: 999, cursor: 'pointer',
                    fontFamily: '"Outfit", sans-serif',
                    fontSize: '0.82rem', fontWeight: 600,
                  }}>Seguir editando</button>
                <button
                  onClick={() => { setShowCloseConfirm(false); onClose(); }}
                  style={{
                    flex: 1, padding: '10px 14px',
                    border: 'none',
                    background: '#c92a2a',
                    color: '#fff',
                    borderRadius: 999, cursor: 'pointer',
                    fontFamily: '"Outfit", sans-serif',
                    fontSize: '0.82rem', fontWeight: 700,
                  }}>Descartar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ────────────────── SUBCOMPONENTES ────────────────── */

function Section({ title, icon, accent = 'navy', children }) {
  const colors = {
    navy:   { bg: 'rgba(26,39,68,0.06)', fg: COLORS.navy },
    orange: { bg: 'rgba(247,103,7,0.08)', fg: COLORS.orange },
    green:  { bg: 'rgba(26,124,62,0.08)', fg: '#1a7c3e' },
  };
  const c = colors[accent] || colors.navy;
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 24, height: 24, borderRadius: 7,
          background: c.bg, color: c.fg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{icon}</div>
        <h4 style={{
          margin: 0,
          fontFamily: '"Outfit", sans-serif',
          fontSize: '0.78rem', fontWeight: 600,
          color: COLORS.navy,
          textTransform: 'uppercase', letterSpacing: '0.6px',
        }}>{title}</h4>
      </div>
      {children}
    </div>
  );
}

/** Tarjeta de Pack: clickeable, "Ver detalle" y "Añadir/Quitar" */
function PackCard({ pack, selected, onViewDetail, onToggle }) {
  const cachedImgs = useImages(pack.id);
  const firstImg = (cachedImgs && cachedImgs[0]) || (pack.images && pack.images[0]) || '';

  return (
    <div style={{
      background: selected ? 'rgba(247,103,7,0.06)' : COLORS.white,
      border: `1.5px solid ${selected ? 'rgba(247,103,7,0.4)' : (COLORS.borderLight || '#e9ecef')}`,
      borderRadius: 12, padding: 8,
      display: 'flex', flexDirection: 'column', gap: 6,
      transition: 'all 0.15s',
    }}>
      <button onClick={onViewDetail} aria-label="Ver detalle"
        style={{
          width: '100%', aspectRatio: '1 / 1',
          borderRadius: 8, overflow: 'hidden',
          background: COLORS.offWhite || '#f8f9fa',
          border: 'none', cursor: 'pointer', padding: 0,
          position: 'relative',
        }}>
        {firstImg ? (
          <img src={firstImg} alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ced4da',
          }}><IconPackage size={32} /></div>
        )}
        <div style={{
          position: 'absolute', bottom: 4, right: 4,
          background: 'rgba(26,39,68,0.85)',
          color: '#fff', borderRadius: 999,
          padding: '2px 6px',
          fontFamily: '"Outfit",sans-serif',
          fontSize: '0.55rem', fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 3,
        }}><IconEye size={9} /> Detalle</div>
      </button>
      <div style={{
        fontFamily: '"Outfit", sans-serif',
        fontSize: '0.72rem', fontWeight: 600, color: COLORS.navy,
        lineHeight: 1.2, minHeight: '2.5em',
        overflow: 'hidden',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
      }}>{pack.title}</div>
      {pack.price && parseFloat(pack.price) > 0 && (
        <div style={{
          fontFamily: '"Outfit", sans-serif',
          fontSize: '0.85rem', fontWeight: 700, color: COLORS.orange,
        }}>+{formatSoles(pack.price)}</div>
      )}
      <button onClick={onToggle}
        style={{
          marginTop: 2, width: '100%', padding: '7px 10px',
          border: selected ? `1.5px solid ${COLORS.orange}` : 'none',
          borderRadius: 999,
          background: selected
            ? 'transparent'
            : `linear-gradient(135deg, ${COLORS.orange}, #ff8c42)`,
          color: selected ? COLORS.orange : '#fff',
          fontFamily: '"Outfit", sans-serif',
          fontWeight: 700, fontSize: '0.72rem',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        }}>
        {selected
          ? <><IconCheck size={13} stroke={2.5} /> Añadido · Quitar</>
          : <><IconPlus size={13} stroke={2.5} /> Añadir</>}
      </button>
    </div>
  );
}

/** Tarjeta de agregado/extra */
function OptionCard({ item, added, onToggle, accent = 'green' }) {
  const isGreen = accent === 'green';
  const price = parseFloat(item.price) || 0;
  const isFree = price === 0;
  return (
    <div style={{
      background: added ? (isGreen ? 'rgba(26,124,62,0.06)' : 'rgba(247,103,7,0.05)') : COLORS.white,
      border: `1.5px solid ${added ? (isGreen ? 'rgba(26,124,62,0.4)' : 'rgba(247,103,7,0.35)') : (COLORS.borderLight || '#e9ecef')}`,
      borderRadius: 12, padding: 8,
      display: 'flex', flexDirection: 'column', gap: 6,
      transition: 'all 0.15s',
    }}>
      <div style={{
        width: '100%', aspectRatio: '1 / 1',
        borderRadius: 8, overflow: 'hidden',
        background: COLORS.offWhite || '#f8f9fa',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#ced4da',
      }}>
        {item.photo ? (
          <img src={item.photo} alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <IconGift size={28} />
        )}
      </div>
      <div style={{
        fontFamily: '"Outfit", sans-serif',
        fontSize: '0.72rem', fontWeight: 600, color: COLORS.navy,
        lineHeight: 1.2, minHeight: '2.5em',
        overflow: 'hidden',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
      }}>{item.title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
        {isFree ? (
          <span style={{
            fontFamily: '"Outfit", sans-serif',
            fontSize: '0.6rem', fontWeight: 700,
            color: '#1a7c3e',
            background: 'rgba(26,124,62,0.1)',
            padding: '2px 6px', borderRadius: 999,
          }}>GRATIS</span>
        ) : (
          <span style={{
            fontFamily: '"Outfit", sans-serif',
            fontSize: '0.7rem', fontWeight: 700,
            color: COLORS.orange,
          }}>+{formatSoles(price)}</span>
        )}
        {item.tag && (
          <span style={{
            fontFamily: '"Outfit", sans-serif',
            fontSize: '0.6rem', color: '#868e96',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{item.tag}</span>
        )}
      </div>
      <button onClick={onToggle}
        style={{
          marginTop: 2, width: '100%', padding: '7px 10px',
          border: added ? `1.5px solid ${isGreen ? '#1a7c3e' : COLORS.orange}` : 'none',
          borderRadius: 999,
          background: added
            ? 'transparent'
            : `linear-gradient(135deg, ${COLORS.navy}, ${COLORS.navyLight})`,
          color: added ? (isGreen ? '#1a7c3e' : COLORS.orange) : '#fff',
          fontFamily: '"Outfit", sans-serif',
          fontWeight: 700, fontSize: '0.72rem',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        }}>
        {added
          ? <><IconCheck size={13} stroke={2.5} /> Añadido · Quitar</>
          : <><IconPlus size={13} stroke={2.5} /> Añadir</>}
      </button>
    </div>
  );
}

/** Overlay de detalle del pack. Renderizado en document.body via Portal
 *  para escapar del transform del bottom sheet padre (que rompería position:fixed). */
function PackDetailOverlay({ pack, ringProduct, isSelected, onClose, onToggle }) {
  const cachedImgs = useImages(pack.id);
  const images = (cachedImgs && cachedImgs.length > 0) ? cachedImgs : (pack.images || []);
  const [currentImg, setCurrentImg] = useState(0);
  const ringPrice = parseFloat(ringProduct?.price) || 0;
  const packPrice = parseFloat(pack?.price) || 0;
  const combo = ringPrice + packPrice;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,26,46,0.78)',
        backdropFilter: 'blur(6px)',
        zIndex: 10500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        boxSizing: 'border-box',
      }}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        style={{
          width: '100%',
          maxWidth: 440,
          maxHeight: '90vh',
          background: COLORS.white,
          borderRadius: 18,
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${COLORS.borderLight || '#e9ecef'}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <h3 style={{
            margin: 0,
            fontFamily: '"Playfair Display", serif',
            fontSize: '1.05rem', fontWeight: 600, color: COLORS.navy,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            paddingRight: 8,
          }}>{pack.title}</h3>
          <button onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: '50%', border: 'none',
              background: '#f1f3f5', cursor: 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: COLORS.navy,
            }}><IconX size={15} /></button>
        </div>

        <div style={{
          flex: 1, overflowY: 'auto',
          padding: 16, display: 'flex', flexDirection: 'column', gap: 14,
          WebkitOverflowScrolling: 'touch',
        }}>
          {images.length > 0 ? (
            <div style={{
              width: '100%', aspectRatio: '1/1',
              borderRadius: 12, overflow: 'hidden',
              background: COLORS.offWhite || '#f8f9fa',
            }}>
              <img src={images[currentImg]} alt={pack.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ) : (
            <div style={{
              width: '100%', aspectRatio: '1/1', borderRadius: 12,
              background: COLORS.offWhite || '#f8f9fa',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ced4da',
            }}><IconPackage size={48} /></div>
          )}
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
              {images.map((img, i) => (
                <img key={i} src={img} alt="" onClick={() => setCurrentImg(i)}
                  style={{
                    width: 48, height: 48, borderRadius: 8,
                    objectFit: 'cover', cursor: 'pointer', flexShrink: 0,
                    border: `2px solid ${i === currentImg ? COLORS.orange : 'transparent'}`,
                    opacity: i === currentImg ? 1 : 0.6,
                  }} />
              ))}
            </div>
          )}
          {pack.description && (
            <p style={{
              margin: 0,
              fontFamily: '"Outfit", sans-serif',
              fontSize: '0.82rem', color: '#495057',
              lineHeight: 1.5, whiteSpace: 'pre-wrap',
            }}>{pack.description}</p>
          )}

          {ringProduct && (
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{
                flex: 1, padding: '10px 12px',
                background: COLORS.orangePale,
                border: `1px solid rgba(247,103,7,0.18)`,
                borderRadius: 12, textAlign: 'center',
              }}>
                <div style={{
                  fontFamily: '"Outfit",sans-serif',
                  fontSize: '0.55rem', color: '#868e96',
                  textTransform: 'uppercase', letterSpacing: '0.9px',
                  fontWeight: 600, marginBottom: 2,
                }}>Pack</div>
                <div style={{
                  fontFamily: '"Outfit",sans-serif',
                  fontSize: '1.1rem', fontWeight: 800, color: COLORS.orange,
                }}>{formatSoles(packPrice)}</div>
              </div>
              <div style={{
                flex: 1, padding: '10px 12px',
                background: 'rgba(44,74,128,0.06)',
                border: '1px solid rgba(44,74,128,0.15)',
                borderRadius: 12, textAlign: 'center',
              }}>
                <div style={{
                  fontFamily: '"Outfit",sans-serif',
                  fontSize: '0.55rem', color: '#868e96',
                  textTransform: 'uppercase', letterSpacing: '0.9px',
                  fontWeight: 600, marginBottom: 2,
                }}>Anillo</div>
                <div style={{
                  fontFamily: '"Outfit",sans-serif',
                  fontSize: '1.1rem', fontWeight: 800, color: COLORS.navy,
                }}>{formatSoles(ringPrice)}</div>
              </div>
            </div>
          )}
          {ringProduct && (
            <div style={{
              padding: '10px 14px', textAlign: 'center',
              background: `linear-gradient(135deg, ${COLORS.navy}, ${COLORS.navyLight})`,
              color: '#fff', borderRadius: 12,
            }}>
              <div style={{
                fontFamily: '"Outfit",sans-serif',
                fontSize: '0.6rem', opacity: 0.85,
                textTransform: 'uppercase', letterSpacing: '1px',
                marginBottom: 3,
              }}>Combo total</div>
              <div style={{
                fontFamily: '"Playfair Display",serif',
                fontSize: '1.4rem', fontWeight: 700,
              }}>{formatSoles(combo)}</div>
            </div>
          )}
        </div>

        <div style={{
          padding: '12px 16px 14px',
          paddingBottom: 'max(14px, env(safe-area-inset-bottom))',
          borderTop: `1px solid ${COLORS.borderLight || '#e9ecef'}`,
          background: COLORS.white,
          flexShrink: 0,
        }}>
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={onToggle}
            style={{
              width: '100%', padding: '13px 16px',
              border: isSelected ? `1.5px solid ${COLORS.orange}` : 'none',
              borderRadius: 999,
              background: isSelected
                ? 'transparent'
                : `linear-gradient(135deg, ${COLORS.orange}, #ff8c42)`,
              color: isSelected ? COLORS.orange : '#fff',
              fontFamily: '"Outfit", sans-serif',
              fontWeight: 700, fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: isSelected ? 'none' : '0 6px 18px rgba(247,103,7,0.35)',
            }}>
            {isSelected
              ? <><IconCheck size={17} stroke={2.5} /> Pack añadido · Quitar</>
              : <><IconPlus size={17} stroke={2.5} /> Añadir este pack</>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

const qtyBtnStyle = {
  width: 36, height: 36,
  border: 'none', background: 'none', cursor: 'pointer',
  color: COLORS.navy,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const qtyTextStyle = {
  minWidth: 32, textAlign: 'center',
  fontFamily: '"Outfit", sans-serif',
  fontSize: '1rem', fontWeight: 700, color: COLORS.navy,
};