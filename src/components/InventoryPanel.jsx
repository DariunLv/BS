// src/components/InventoryPanel.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Text, NumberInput, TextInput } from '@mantine/core';
import { IconChevronDown, IconDiamond, IconRefresh } from '@tabler/icons-react';
import {
  loadAllInventory, saveProductInventory, getTotalUnits,
  getStockLevel, buildEmptyInventory,
} from '../utils/inventory';
import { preloadImagesInBatches, getImages, subscribeToImages } from '../utils/imageCache';
import { COLORS } from '../utils/theme';

// Hook local para obtener la miniatura de un producto desde imageCache
function useThumb(productId, fallback) {
  const [rev, setRev] = useState(0);
  useEffect(() => {
    if (!productId) return;
    const unsub = subscribeToImages(() => setRev(r => r + 1));
    return unsub;
  }, [productId]);
  const cached = getImages(productId);
  return cached?.length ? cached[0] : (fallback || '');
}

const LC = {
  ok:      { bg: '#e6f9e6', border: '#2d8a2d', text: '#1a5c1a', dot: '#2d8a2d' },
  low:     { bg: '#fff8e6', border: '#d97706', text: '#92400e', dot: '#d97706' },
  out:     { bg: '#fee6e6', border: '#e11d48', text: '#9b1c1c', dot: '#e11d48' },
  unknown: { bg: '#f3f4f6', border: '#9ca3af', text: '#6b7280', dot: '#9ca3af' },
};

function useDebounce(fn, delay) {
  const timer = useRef(null);
  return useCallback((...args) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  }, []); // eslint-disable-line
}

export default function InventoryPanel({ storeData }) {
  const [inventory,     setInventory]     = useState({});
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState({});
  const [expandedCats,  setExpandedCats]  = useState({});
  const [expandedRows,  setExpandedRows]  = useState({});

  useEffect(() => {
    loadAllInventory().then(data => { setInventory(data); setLoading(false); });
  }, []);

  const allProducts = useMemo(() =>
    (storeData?.products || []).filter(p => !p.hidden), [storeData]);
  const categories  = useMemo(() =>
    (storeData?.categories || []).sort((a, b) => a.order - b.order), [storeData]);

  const stats = useMemo(() => {
    let tp = allProducts.length, ws = 0, oo = 0, nd = 0, tu = 0;
    allProducts.forEach(p => {
      const lv = getStockLevel(inventory[p.id]);
      if (lv === 'unknown') { nd++; return; }
      const u = getTotalUnits(inventory[p.id]);
      tu += u;
      if (u === 0) oo++; else ws++;
    });
    return { tp, ws, oo, nd, tu };
  }, [allProducts, inventory]);

  const handleUpdate = useCallback((id, inv) => setInventory(prev => ({ ...prev, [id]: inv })), []);
  const handleSave   = useCallback(async (id, inv) => {
    setSaving(p => ({ ...p, [id]: true }));
    await saveProductInventory(id, inv);
    setSaving(p => ({ ...p, [id]: false }));
  }, []);

  const handleExpandCat = useCallback((catId) => {
    setExpandedCats(prev => {
      const next = { ...prev, [catId]: !prev[catId] };
      if (next[catId]) {
        const ids = allProducts.filter(p => p.categoryId === catId).map(p => p.id);
        if (ids.length) preloadImagesInBatches(ids, 6);
      }
      return next;
    });
  }, [allProducts]);

  if (loading) return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
        <IconRefresh size={28} color={COLORS.orange} />
      </motion.div>
      <Text size="sm" c="dimmed" mt={12} style={{ fontFamily: '"Outfit",sans-serif' }}>Cargando inventario...</Text>
    </div>
  );

  return (
    <div style={{ paddingBottom: 40 }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { l: 'Total productos',  v: stats.tp, c: COLORS.navy,     bg: '#f0f4ff' },
          { l: 'Unidades totales', v: stats.tu, c: '#1a5c1a',       bg: '#e6f9e6' },
          { l: 'Agotados',         v: stats.oo, c: '#9b1c1c',       bg: '#fee6e6' },
          { l: 'Sin registrar',    v: stats.nd, c: COLORS.textMuted, bg: '#f3f4f6' },
        ].map(s => (
          <div key={s.l} style={{ padding: '10px 14px', borderRadius: 12, background: s.bg, border: `1px solid ${s.c}22` }}>
            <div style={{ fontFamily: '"Outfit",sans-serif', fontSize: '1.3rem', fontWeight: 700, color: s.c }}>{s.v}</div>
            <div style={{ fontFamily: '"Outfit",sans-serif', fontSize: '0.62rem', color: COLORS.textMuted }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Categorías */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {categories.map(cat => {
          const prods = allProducts.filter(p => p.categoryId === cat.id);
          if (!prods.length) return null;
          const isOpen  = !!expandedCats[cat.id];
          const outCnt  = prods.filter(p => getStockLevel(inventory[p.id]) === 'out').length;

          return (
            <div key={cat.id} style={{ borderRadius: 14, border: `1px solid ${COLORS.borderLight}`, background: 'white', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>

              {/* Header categoría */}
              <button onClick={() => handleExpandCat(cat.id)}
                style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: `${COLORS.navy}15`, border: `1px solid ${COLORS.navy}22`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {cat.image
                    ? <img src={cat.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <IconDiamond size={16} color={COLORS.navy} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: '"Playfair Display",serif', fontSize: '0.88rem', fontWeight: 600, color: COLORS.navy }}>{cat.name}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: '"Outfit",sans-serif', fontSize: '0.6rem', color: COLORS.textMuted }}>{prods.length} productos</span>
                    {outCnt > 0 && <span style={{ fontFamily: '"Outfit",sans-serif', fontSize: '0.58rem', fontWeight: 700, color: '#9b1c1c', background: '#fee6e6', padding: '1px 7px', borderRadius: 8, border: '1px solid #e11d4833' }}>{outCnt} agotado{outCnt > 1 ? 's' : ''}</span>}
                  </div>
                </div>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <IconChevronDown size={18} color={COLORS.textMuted} />
                </motion.div>
              </button>

              {/* Productos */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: 'hidden' }}>
                    <div style={{ borderTop: `1px solid ${COLORS.borderLight}`, padding: '10px 12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {prods.map(product => {
                        return (
                          <ProductRow
                            key={product.id}
                            product={product}
                            inv={inventory[product.id] || buildEmptyInventory(product)}
                            saving={!!saving[product.id]}
                            expanded={!!expandedRows[product.id]}
                            onToggle={() => setExpandedRows(p => ({ ...p, [product.id]: !p[product.id] }))}
                            onChange={(inv) => handleUpdate(product.id, inv)}
                            onSave={(inv) => handleSave(product.id, inv)}
                          />
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProductRow({ product, inv, saving, expanded, onToggle, onChange, onSave }) {
  const isRing  = product.categoryId?.includes('anillo');
  const lv      = getStockLevel(inv);
  const lc      = LC[lv];
  const total   = getTotalUnits(inv);
  const dbSave  = useDebounce(onSave, 800);

  const upd = (next) => { onChange(next); dbSave(next); };

  const tallasV = product.tallasVaron || product.tallas || [];
  const tallasD = product.tallasDama  || [];
  const hasTallas = isRing && (tallasV.length > 0 || tallasD.length > 0);
  const thumb   = useThumb(product.id, product.images?.[0]);

  return (
    <div style={{ borderRadius: 12, border: `1px solid ${lc.border}44`, background: '#fafafa', overflow: 'hidden' }}>
      {/* Header fila */}
      <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 44, height: 44, borderRadius: 8, flexShrink: 0, background: COLORS.offWhite, border: `1px solid ${COLORS.borderLight}`, overflow: 'hidden', aspectRatio: '1/1' }}>
          {thumb
            ? <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconDiamond size={15} color={COLORS.borderLight} /></div>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: '"Outfit",sans-serif', fontSize: '0.8rem', fontWeight: 600, color: COLORS.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{product.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 10, background: lc.bg, border: `1px solid ${lc.border}55` }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: lc.dot }} />
              <span style={{ fontFamily: '"Outfit",sans-serif', fontSize: '0.57rem', fontWeight: 600, color: lc.text }}>{lv === 'unknown' ? 'Sin datos' : `${total} uds`}</span>
            </div>
            {saving && <motion.span animate={{ opacity: [0.4,1,0.4] }} transition={{ duration: 1, repeat: Infinity }} style={{ fontFamily: '"Outfit",sans-serif', fontSize: '0.54rem', color: COLORS.orange }}>guardando...</motion.span>}
          </div>
        </div>
        {hasTallas && (
          <button onClick={onToggle} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <IconChevronDown size={16} color={COLORS.textMuted} />
            </motion.div>
          </button>
        )}
      </div>

      {/* Campos */}
      <div style={{ padding: '0 12px 12px', display: 'flex', gap: 8 }}>
        <TextInput size="xs" radius="md" placeholder="Código Ej: ANI-001" label="Código"
          value={inv.code || ''} onChange={(e) => upd({ ...inv, code: e.currentTarget.value })}
          styles={{ root: { flex: 1 }, label: { fontFamily: '"Outfit",sans-serif', fontSize: '0.62rem' } }} />
        {!isRing && (
          <NumberInput size="xs" radius="md" min={0} placeholder="0" label="Unidades"
            value={inv.quantity ?? 0}
            onChange={(v) => upd({ ...inv, isRing: false, quantity: parseInt(v) || 0 })}
            styles={{ root: { width: 82 }, label: { fontFamily: '"Outfit",sans-serif', fontSize: '0.62rem' } }} />
        )}
        {isRing && !hasTallas && (
          <NumberInput size="xs" radius="md" min={0} placeholder="0" label="Unidades"
            value={total ?? 0}
            onChange={(v) => upd({ ...inv, isRing: false, quantity: parseInt(v) || 0 })}
            styles={{ root: { width: 82 }, label: { fontFamily: '"Outfit",sans-serif', fontSize: '0.62rem' } }} />
        )}
      </div>

      {/* Tallas */}
      <AnimatePresence initial={false}>
        {hasTallas && expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} style={{ overflow: 'hidden' }}>
            <div style={{ borderTop: `1px solid ${COLORS.borderLight}`, padding: '10px 12px 12px' }}>
              {tallasV.length > 0 && (
                <div style={{ marginBottom: tallasD.length > 0 ? 12 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#2c4a80' }} />
                    <span style={{ fontFamily: '"Outfit",sans-serif', fontSize: '0.62rem', fontWeight: 700, color: '#2c4a80', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Varón</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(60px,1fr))', gap: 6 }}>
                    {tallasV.map(t => <SizeCell key={`V-${t}`} label={t} sizeKey={`V-${t}`} stock={inv.sizeStock?.[`V-${t}`] ?? 0} color="#2c4a80"
                      onChange={(k, v) => upd({ ...inv, isRing: true, sizeStock: { ...inv.sizeStock, [k]: parseInt(v)||0 } })} />)}
                  </div>
                </div>
              )}
              {tallasD.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#c2255c' }} />
                    <span style={{ fontFamily: '"Outfit",sans-serif', fontSize: '0.62rem', fontWeight: 700, color: '#c2255c', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Dama</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(60px,1fr))', gap: 6 }}>
                    {tallasD.map(t => <SizeCell key={`D-${t}`} label={t} sizeKey={`D-${t}`} stock={inv.sizeStock?.[`D-${t}`] ?? 0} color="#c2255c"
                      onChange={(k, v) => upd({ ...inv, isRing: true, sizeStock: { ...inv.sizeStock, [k]: parseInt(v)||0 } })} />)}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SizeCell({ label, sizeKey, stock, color, onChange }) {
  const out = stock === 0;
  return (
    <div style={{ borderRadius: 8, overflow: 'hidden', border: `1.5px solid ${out ? '#e11d4833' : `${color}33`}`, background: out ? '#fff5f5' : 'white' }}>
      <div style={{ padding: '4px 4px 2px', textAlign: 'center', background: out ? '#fee6e6' : `${color}11`, borderBottom: `1px solid ${out ? '#e11d4822' : `${color}22`}` }}>
        <span style={{ fontFamily: '"Outfit",sans-serif', fontSize: '0.7rem', fontWeight: 700, color: out ? '#e11d48' : color }}>{label}</span>
        {out && <div style={{ fontFamily: '"Outfit",sans-serif', fontSize: '0.45rem', color: '#e11d48', fontWeight: 700 }}>AGOTADO</div>}
      </div>
      <NumberInput size="xs" min={0} variant="unstyled" value={stock}
        onChange={(v) => onChange(sizeKey, v)}
        styles={{ input: { textAlign: 'center', fontFamily: '"Outfit",sans-serif', fontSize: '0.8rem', fontWeight: 600, color: out ? '#e11d48' : color, padding: '4px 2px' } }} />
    </div>
  );
}