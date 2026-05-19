// src/components/CartDrawer.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Drawer principal del carrito. Mejoras:
//   - Muestra agregados, extras y packInfo de cada item
//   - Botón "Ver detalle" en items que son packs (abre overlay)
//   - Items ordenados por más reciente arriba (con badge "Nuevo" al recién agregado)
//   - Aviso si carrito está lleno
//   - Tras enviar por WhatsApp → se vacía totalmente
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconX, IconShoppingBag, IconTrash, IconMinus, IconPlus,
  IconBrandWhatsapp, IconGift, IconAlertTriangle, IconUser,
  IconEye, IconSparkles, IconPackage,
} from '@tabler/icons-react';
import { COLORS } from '../utils/theme';
import { useCart } from '../utils/CartContext';
import { cartTotal, cartUnitCount, formatSoles, itemSubtotal, buildWhatsAppMessage } from '../utils/cart';
import { getWhatsappNumber, loadStore } from '../utils/store';
import PackDetailOverlay from './PackDetailOverlay';

export default function CartDrawer() {
  const {
    items, orderedItems, customerName, open, isFull, maxItems,
    updateQuantity, removeFromCart, clearCart,
    setCustomerName, setCartOpen,
  } = useCart();

  const [confirmClear, setConfirmClear] = useState(false);
  const [packToView, setPackToView] = useState(null);
  const total = cartTotal(items);
  const unitCount = cartUnitCount(items);
  const isEmpty = items.length === 0;

  // Reset confirmClear cuando se cierra el drawer
  useEffect(() => {
    if (!open) setConfirmClear(false);
  }, [open]);

  const handleSendWhatsApp = () => {
    if (isEmpty) return;
    const number = getWhatsappNumber();
    const { encoded } = buildWhatsAppMessage({
      items, customerName, whatsappNumber: number,
    });
    const url = `https://wa.me/${number}?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    // VACIAR carrito TOTALMENTE tras enviar
    setTimeout(() => {
      clearCart();
      setCartOpen(false);
    }, 600);
  };

  // Para "Ver detalle" de un pack desde el carrito, buscamos el producto en storeData
  const handleViewPackDetail = (packId) => {
    try {
      const store = loadStore();
      const pack = (store.products || []).find(p => p.id === packId);
      if (pack) setPackToView(pack);
    } catch {}
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(15,26,46,0.55)', backdropFilter: 'blur(4px)',
              zIndex: 10000,
            }}
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            style={{
              position: 'fixed',
              top: 0, right: 0,
              height: '100dvh', width: '100%', maxWidth: 440,
              background: COLORS.cream, zIndex: 10001,
              display: 'flex', flexDirection: 'column',
              boxShadow: '-12px 0 40px rgba(0,0,0,0.18)',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '16px 18px',
              borderBottom: `1px solid ${COLORS.borderLight || '#e9ecef'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: COLORS.white,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `linear-gradient(135deg, ${COLORS.navy}, ${COLORS.navyLight})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff',
                }}>
                  <IconShoppingBag size={18} />
                </div>
                <div>
                  <div style={{
                    fontFamily: '"Playfair Display", serif',
                    fontSize: '1.1rem', fontWeight: 600, color: COLORS.navy,
                  }}>Mi pedido</div>
                  <div style={{
                    fontFamily: '"Outfit", sans-serif',
                    fontSize: '0.7rem', color: '#868e96',
                  }}>
                    {unitCount === 0 ? 'Vacío'
                      : unitCount === 1 ? '1 unidad'
                      : `${unitCount} unidades`}
                    {items.length > 0 && ` · ${items.length} producto${items.length > 1 ? 's' : ''}`}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  border: 'none', background: '#f1f3f5',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: COLORS.navy,
                }}
                aria-label="Cerrar carrito"
              >
                <IconX size={16} />
              </button>
            </div>

            {/* Aviso de carrito lleno */}
            {isFull && (
              <div style={{
                padding: '8px 16px',
                background: '#fff8e6',
                borderBottom: '1px solid #ffd966',
                display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: '"Outfit", sans-serif',
                fontSize: '0.74rem', color: '#92580a', fontWeight: 600,
              }}>
                <IconAlertTriangle size={13} />
                Carrito lleno ({maxItems} productos máximo). Envíalo y crea uno nuevo.
              </div>
            )}

            {/* Lista de items o estado vacío */}
            <div style={{
              flex: 1, overflowY: 'auto',
              padding: isEmpty ? 0 : '12px 14px 24px',
              WebkitOverflowScrolling: 'touch',
            }}>
              {isEmpty ? (
                <EmptyState onClose={() => setCartOpen(false)} />
              ) : (
                <>
                  {orderedItems.map((it, idx) => (
                    <CartItemRow
                      key={it.id}
                      item={it}
                      isNewest={idx === 0 && (Date.now() - (it.addedAt || 0) < 5000)}
                      onQtyChange={(q) => updateQuantity(it.id, q)}
                      onRemove={() => removeFromCart(it.id)}
                      onViewPackDetail={() => handleViewPackDetail(it.productId)}
                    />
                  ))}
                  <div style={{ textAlign: 'center', marginTop: 8 }}>
                    {confirmClear ? (
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button onClick={() => { clearCart(); setConfirmClear(false); }}
                          style={btnSmallDanger}>Sí, vaciar todo</button>
                        <button onClick={() => setConfirmClear(false)}
                          style={btnSmallGhost}>Cancelar</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmClear(true)}
                        style={{
                          background: 'none', border: 'none',
                          color: '#c92a2a', cursor: 'pointer',
                          fontFamily: '"Outfit", sans-serif', fontSize: '0.75rem',
                          textDecoration: 'underline',
                          padding: 8,
                        }}>
                        Vaciar carrito
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {!isEmpty && (
              <div style={{
                borderTop: `1px solid ${COLORS.borderLight || '#e9ecef'}`,
                background: COLORS.white,
                padding: '14px 16px 16px',
                boxShadow: '0 -8px 20px rgba(0,0,0,0.05)',
              }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{
                    fontFamily: '"Outfit", sans-serif',
                    fontSize: '0.7rem', color: '#868e96',
                    display: 'flex', alignItems: 'center', gap: 6,
                    marginBottom: 4,
                  }}>
                    <IconUser size={12} />
                    Tu nombre (opcional)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ej: María Pérez"
                    maxLength={50}
                    style={{
                      width: '100%', padding: '8px 12px',
                      border: '1px solid #dee2e6', borderRadius: 8,
                      fontFamily: '"Outfit", sans-serif', fontSize: '0.85rem',
                      color: COLORS.navy, outline: 'none',
                      transition: 'border-color 0.15s',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = COLORS.orange; }}
                    onBlur={(e) => { e.target.style.borderColor = '#dee2e6'; }}
                  />
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                  marginBottom: 12,
                }}>
                  <span style={{
                    fontFamily: '"Outfit", sans-serif',
                    fontSize: '0.85rem', color: '#495057', fontWeight: 500,
                  }}>Total</span>
                  <span style={{
                    fontFamily: '"Playfair Display", serif',
                    fontSize: '1.5rem', fontWeight: 700, color: COLORS.navy,
                  }}>{formatSoles(total)}</span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSendWhatsApp}
                  style={{
                    width: '100%', padding: '14px 16px',
                    border: 'none', borderRadius: 999,
                    background: 'linear-gradient(135deg, #25D366, #128C7E)',
                    color: '#fff',
                    fontFamily: '"Outfit", sans-serif',
                    fontWeight: 600, fontSize: '0.92rem',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 6px 18px rgba(37,211,102,0.32)',
                  }}
                >
                  <IconBrandWhatsapp size={20} stroke={2} />
                  Enviar pedido por WhatsApp
                </motion.button>
                <div style={{
                  marginTop: 8, textAlign: 'center',
                  fontFamily: '"Outfit", sans-serif',
                  fontSize: '0.68rem', color: '#868e96',
                  lineHeight: 1.4,
                }}>
                  Tras enviar, el carrito se vaciará automáticamente
                </div>
              </div>
            )}
          </motion.div>

          {/* Detalle del pack (cuando el cliente pulsa "Ver detalle" en un item del carrito) */}
          {packToView && (
            <PackDetailOverlay
              pack={packToView}
              ringProduct={null}
              onClose={() => setPackToView(null)}
              hideAction={true}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────── ITEM ROW ─────────────────── */

function CartItemRow({ item, isNewest, onQtyChange, onRemove, onViewPackDetail }) {
  const p = item.productSnapshot || {};
  const qty = parseInt(item.quantity) || 1;
  const subtotal = itemSubtotal(item);
  const isPack = !!p.isPack || !!item.packInfo;

  // Chips de opciones
  const chips = [];
  if (item.tallaVaron)  chips.push(`Talla Varón: ${item.tallaVaron}`);
  if (item.tallaDama)   chips.push(`Talla Dama: ${item.tallaDama}`);
  if (item.tallaLegacy) chips.push(`Talla: ${item.tallaLegacy}`);
  if (item.isAjustable) chips.push('Ajustable');
  if (p.material)       chips.push(p.material);
  if (p.platingType && p.plating) chips.push(`${p.platingType}: ${p.plating}`);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.18 }}
      style={{
        background: COLORS.white,
        border: `1px solid ${isNewest ? 'rgba(247,103,7,0.4)' : (COLORS.borderLight || '#e9ecef')}`,
        borderRadius: 14,
        padding: 12,
        marginBottom: 10,
        position: 'relative',
      }}
    >
      {isNewest && (
        <div style={{
          position: 'absolute', top: -7, left: 12,
          background: COLORS.orange,
          color: '#fff',
          fontFamily: '"Outfit", sans-serif',
          fontSize: '0.55rem', fontWeight: 700,
          padding: '2px 7px', borderRadius: 999,
          textTransform: 'uppercase', letterSpacing: '0.8px',
        }}>Nuevo</div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 10,
          background: COLORS.offWhite || '#f8f9fa',
          flexShrink: 0, overflow: 'hidden',
          border: `1px solid ${COLORS.borderLight || '#e9ecef'}`,
        }}>
          {p.image ? (
            <img src={p.image} alt={p.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ced4da',
            }}>
              {isPack ? <IconPackage size={28} /> : <IconShoppingBag size={28} />}
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <h4 style={{
              margin: 0,
              fontFamily: '"Playfair Display", serif',
              fontSize: '0.92rem', fontWeight: 600, color: COLORS.navy,
              lineHeight: 1.25,
              overflow: 'hidden',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>{p.title}</h4>
            <button onClick={onRemove}
              style={{
                background: 'none', border: 'none',
                width: 28, height: 28, flexShrink: 0,
                borderRadius: '50%', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#c92a2a',
              }}
              aria-label="Eliminar"
            ><IconTrash size={14} /></button>
          </div>

          {/* Botón "Ver detalle" para packs */}
          {isPack && onViewPackDetail && (
            <button onClick={onViewPackDetail}
              style={{
                marginTop: 6,
                padding: '3px 8px',
                background: 'rgba(247,103,7,0.08)',
                border: '1px solid rgba(247,103,7,0.25)',
                borderRadius: 999,
                cursor: 'pointer',
                fontFamily: '"Outfit", sans-serif',
                fontSize: '0.62rem', fontWeight: 600,
                color: COLORS.orange,
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}>
              <IconEye size={11} /> Ver detalle del pack
            </button>
          )}

          {chips.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {chips.map((c, i) => (
                <span key={i} style={chipStyle}>{c}</span>
              ))}
            </div>
          )}

          {/* Caja */}
          {item.caja && item.caja.title && (
            <div style={includeRowStyle}>
              <IconGift size={11} color="#1a7c3e" />
              <span>Incluye: <strong>{item.caja.title}</strong></span>
            </div>
          )}

          {/* Agregados */}
          {item.agregadosIncluidos && item.agregadosIncluidos.length > 0 && (
            <div style={includeRowStyle}>
              <IconGift size={11} color="#1a7c3e" />
              <span>Gratis: <strong>{item.agregadosIncluidos.map(a => a.title).filter(Boolean).join(', ')}</strong></span>
            </div>
          )}

          {/* Extras */}
          {item.extrasIncluidos && item.extrasIncluidos.length > 0 && (
            <div style={includeRowStyle}>
              <IconSparkles size={11} color={COLORS.orange} />
              <span>Extras: <strong>{item.extrasIncluidos.map(a => a.title).filter(Boolean).join(', ')}</strong></span>
            </div>
          )}

          {/* PackInfo (item es un pack que viene con un anillo) */}
          {item.packInfo && item.packInfo.ringTitle && (
            <div style={includeRowStyle}>
              <IconPackage size={11} color={COLORS.navy} />
              <span style={{ fontSize: '0.66rem' }}>
                Combinado con: <strong>{item.packInfo.ringTitle}</strong>
              </span>
            </div>
          )}

          {item.note && item.note.trim() && (
            <div style={{
              marginTop: 4,
              fontFamily: '"Outfit", sans-serif',
              fontSize: '0.7rem',
              fontStyle: 'italic',
              color: '#495057',
            }}>"{item.note.trim()}"</div>
          )}

          {item.stockWarning && (
            <div style={{
              marginTop: 6,
              display: 'flex', alignItems: 'center', gap: 4,
              fontFamily: '"Outfit", sans-serif',
              fontSize: '0.68rem',
              color: '#c92a2a',
            }}>
              <IconAlertTriangle size={11} />
              <span>{item.stockWarning}</span>
            </div>
          )}

          {/* Cantidad + precio */}
          <div style={{
            marginTop: 10,
            display: 'flex',
            alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center',
              border: `1px solid ${COLORS.borderLight || '#e9ecef'}`,
              borderRadius: 999, overflow: 'hidden',
            }}>
              <button onClick={() => onQtyChange(qty - 1)} disabled={qty <= 1}
                style={{ ...qtyBtn, opacity: qty <= 1 ? 0.4 : 1 }}>
                <IconMinus size={12} />
              </button>
              <span style={{
                minWidth: 28, textAlign: 'center',
                fontFamily: '"Outfit", sans-serif',
                fontSize: '0.85rem', fontWeight: 600, color: COLORS.navy,
              }}>{qty}</span>
              <button onClick={() => onQtyChange(qty + 1)} disabled={qty >= 99}
                style={qtyBtn}>
                <IconPlus size={12} />
              </button>
            </div>
            <div style={{ textAlign: 'right' }}>
              {qty > 1 && (
                <div style={{
                  fontFamily: '"Outfit", sans-serif',
                  fontSize: '0.65rem', color: '#868e96',
                }}>{formatSoles(p.price)} c/u</div>
              )}
              <div style={{
                fontFamily: '"Outfit", sans-serif',
                fontSize: '0.95rem', fontWeight: 700, color: COLORS.orange,
              }}>{formatSoles(subtotal)}</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState({ onClose }) {
  return (
    <div style={{
      height: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 40, textAlign: 'center',
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: COLORS.orangePale,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
      }}>
        <IconShoppingBag size={36} color={COLORS.orange} />
      </div>
      <h3 style={{
        margin: 0,
        fontFamily: '"Playfair Display", serif',
        fontSize: '1.2rem', color: COLORS.navy,
        marginBottom: 8,
      }}>Tu carrito está vacío</h3>
      <p style={{
        margin: 0,
        fontFamily: '"Outfit", sans-serif',
        fontSize: '0.85rem', color: '#868e96',
        lineHeight: 1.5, maxWidth: 260,
      }}>
        Explora el catálogo y agrega los productos que te gusten. Cuando estés listo,
        envíanos tu pedido completo por WhatsApp.
      </p>
      <button onClick={onClose}
        style={{
          marginTop: 20,
          padding: '10px 20px',
          border: `1.5px solid ${COLORS.navy}`,
          background: 'transparent',
          color: COLORS.navy,
          borderRadius: 999,
          cursor: 'pointer',
          fontFamily: '"Outfit", sans-serif',
          fontWeight: 600, fontSize: '0.82rem',
        }}
      >
        Seguir explorando
      </button>
    </div>
  );
}

const chipStyle = {
  fontFamily: '"Outfit", sans-serif',
  fontSize: '0.65rem', fontWeight: 500,
  color: COLORS.navy,
  background: COLORS.orangePale,
  padding: '2px 8px', borderRadius: 999,
  border: '1px solid rgba(247,103,7,0.15)',
};
const includeRowStyle = {
  marginTop: 4,
  display: 'flex', alignItems: 'center', gap: 4,
  fontFamily: '"Outfit", sans-serif',
  fontSize: '0.7rem',
  color: '#495057',
};
const qtyBtn = {
  width: 26, height: 26,
  border: 'none', background: 'none', cursor: 'pointer',
  color: COLORS.navy,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const btnSmallDanger = {
  background: '#c92a2a', color: '#fff', border: 'none',
  padding: '6px 14px', borderRadius: 999,
  fontFamily: '"Outfit", sans-serif', fontSize: '0.72rem', fontWeight: 600,
  cursor: 'pointer',
};
const btnSmallGhost = {
  background: '#f1f3f5', color: COLORS.navy, border: 'none',
  padding: '6px 14px', borderRadius: 999,
  fontFamily: '"Outfit", sans-serif', fontSize: '0.72rem', fontWeight: 600,
  cursor: 'pointer',
};