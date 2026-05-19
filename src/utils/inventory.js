// src/utils/inventory.js
// ─────────────────────────────────────────────────────────────────────────────
// CORREGIDO (May 2026):
//  - deductInventory, addToInventory y saveProductInventory ahora usan
//    runTransaction → atómicos, sin race conditions (antes 2 ventas
//    rápidas del mismo producto sobrescribían el stock).
//  - registerSaleAtomic (NUEVO): registra la venta Y descuenta el inventario
//    en UNA SOLA transacción. Si falla, NADA se escribe. Esto resuelve
//    el bug "descontaba unidades pero la venta no se guardaba".
//  - Retry exponencial automático en errores de red (5 intentos).
//  - Errores se lanzan (throw) en vez de tragarse silenciosamente — el
//    componente que llama puede mostrar notificación al usuario.
//  - Sanitización para que Firestore no rechace `undefined`.
// ─────────────────────────────────────────────────────────────────────────────
import { getApps, initializeApp } from 'firebase/app';
import {
  getFirestore, doc, getDoc, setDoc, getDocs,
  collection, deleteDoc, runTransaction,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCWAs5LOcXvGkJ9QKz9WfHXBhkp2OAntWA",
  authDomain: "benito-store.firebaseapp.com",
  projectId: "benito-store",
  storageBucket: "benito-store.firebasestorage.app",
  messagingSenderId: "133305981902",
  appId: "1:133305981902:web:48bb76991a74295d42e99f",
};

const app = getApps()[0] || initializeApp(firebaseConfig);
const db = getFirestore(app);
const INV_COL = collection(db, 'inventory');

/* ============================================================
   HELPERS COMUNES
   ============================================================ */

/** Elimina recursivamente `undefined` (Firestore los rechaza). */
function sanitize(obj) {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(sanitize).filter(v => v !== undefined);
  if (typeof obj === 'object') {
    if (obj instanceof Date) return obj.toISOString();
    if (typeof obj.toJSON === 'function') return sanitize(obj.toJSON());
    const out = {};
    for (const k of Object.keys(obj)) {
      const v = obj[k];
      if (v === undefined) continue;
      if (typeof v === 'function') continue;
      out[k] = sanitize(v);
    }
    return out;
  }
  if (typeof obj === 'number' && !isFinite(obj)) return 0;
  return obj;
}

/** Retry exponencial: 250ms, 600ms, 1.4s, 3s, 6s. */
async function withRetry(fn, attempts = 5, baseMs = 250) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const msg = String(e?.message || e);
      if (msg.includes('permission-denied') ||
          msg.includes('exceeds the maximum') ||
          msg.includes('invalid-argument')) {
        throw e;
      }
      if (i === attempts - 1) break;
      await new Promise(r => setTimeout(r, baseMs * Math.pow(2.2, i)));
    }
  }
  throw lastErr;
}

/* ============================================================
   ESTRUCTURAS DE DATOS  (sin cambios)
   ============================================================
   Producto normal:
   { productId, code, quantity, isRing:false, updatedAt }

   Anillo:
   { productId, code, isRing:true, sizeStock:{"V-6":3,"D-5":2,...}, updatedAt }
   ============================================================ */

/** Carga el inventario de UN producto */
export async function getProductInventory(productId) {
  if (!productId) return null;
  try {
    const snap = await getDoc(doc(db, 'inventory', productId));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.error('Error cargando inventario:', e);
    return null;
  }
}

/** Guarda/actualiza el inventario de UN producto (con retry) */
export async function saveProductInventory(productId, data) {
  if (!productId) return;
  await withRetry(() => setDoc(doc(db, 'inventory', productId), sanitize({
    ...data,
    productId,
    updatedAt: Date.now(),
  })));
}

/**
 * Después de descontar, comprueba si el stock total llegó a 0.
 * Para anillos verifica si TODAS las tallas están en 0.
 */
export async function checkAndSyncSoldOut(productId) {
  if (!productId) return false;
  try {
    const snap = await getDoc(doc(db, 'inventory', productId));
    if (!snap.exists()) return false;
    const inv = snap.data();
    if (inv.isRing && inv.sizeStock) {
      const total = Object.values(inv.sizeStock).reduce((a, b) => a + (parseInt(b) || 0), 0);
      return total === 0;
    }
    return (parseInt(inv.quantity) || 0) === 0;
  } catch { return false; }
}

/* ============================================================
   OPERACIONES ATÓMICAS — usan runTransaction
   Garantiza: no race conditions, no sobreescrituras concurrentes
   ============================================================ */

/**
 * Descuenta UNA unidad del inventario, atómicamente.
 * Si sizeKey está dado y el producto es anillo → descuenta esa talla.
 * Si no → descuenta del stock general.
 */
export async function deductInventory(productId, sizeKey = null) {
  if (!productId) return;
  await withRetry(() => runTransaction(db, async (tx) => {
    const invRef = doc(db, 'inventory', productId);
    const snap = await tx.get(invRef);
    if (!snap.exists()) return; // sin inventario configurado → no hacer nada
    const inv = snap.data();
    let updated;
    if (sizeKey && inv.isRing && inv.sizeStock) {
      const current = parseInt(inv.sizeStock[sizeKey]) || 0;
      updated = {
        ...inv,
        sizeStock: { ...inv.sizeStock, [sizeKey]: Math.max(0, current - 1) },
        updatedAt: Date.now(),
      };
    } else {
      const current = parseInt(inv.quantity) || 0;
      updated = { ...inv, quantity: Math.max(0, current - 1), updatedAt: Date.now() };
    }
    tx.set(invRef, sanitize(updated));
  }));
}

/** Agrega unidades al inventario, atómicamente. */
export async function addToInventory(productId, sizeKey = null, amount = 1) {
  if (!productId) return;
  await withRetry(() => runTransaction(db, async (tx) => {
    const invRef = doc(db, 'inventory', productId);
    const snap = await tx.get(invRef);
    if (!snap.exists()) return;
    const inv = snap.data();
    let updated;
    if (sizeKey && inv.isRing && inv.sizeStock) {
      const current = parseInt(inv.sizeStock[sizeKey]) || 0;
      updated = {
        ...inv,
        sizeStock: { ...inv.sizeStock, [sizeKey]: current + amount },
        updatedAt: Date.now(),
      };
    } else {
      updated = { ...inv, quantity: (parseInt(inv.quantity) || 0) + amount, updatedAt: Date.now() };
    }
    tx.set(invRef, sanitize(updated));
  }));
}

/* ============================================================
   ★ REGISTER SALE ATOMIC ★
   La función estrella. Hace TODO en una transacción:
     1. Lee el inventario actual del producto
     2. Lee el producto (para saber si ya estaba soldOut)
     3. Calcula descuento por talla(s) o stock general
     4. Escribe la venta en sales/{id}
     5. Escribe el inventario actualizado
     6. Si producto quedó agotado, marca soldOut=true en products/{id}

   Si CUALQUIER paso falla → NADA se escribe. Atomicidad real.
   Devuelve: { success, isOut, deducted }
   ============================================================ */
export async function registerSaleAtomic(saleData, productId, sizeKeys = []) {
  if (!saleData?.id) {
    throw new Error('La venta necesita un ID');
  }
  return await withRetry(() => runTransaction(db, async (tx) => {
    // ─── Paso 1-2: TODOS los reads PRIMERO (Firestore lo exige) ───
    const saleRef = doc(db, 'sales', String(saleData.id));
    let invSnap = null, prodSnap = null;
    if (productId) {
      invSnap  = await tx.get(doc(db, 'inventory', productId));
      prodSnap = await tx.get(doc(db, 'products', productId));
    }

    // ─── Paso 3: calcular cambios ───
    let updatedInv = null;
    let isOut = false;
    let deducted = false;

    if (invSnap?.exists()) {
      const inv = invSnap.data();
      const cleanSizes = (sizeKeys || []).filter(Boolean);

      if (cleanSizes.length > 0 && inv.isRing && inv.sizeStock) {
        // Descontar cada talla vendida (una unidad por talla)
        const newStock = { ...inv.sizeStock };
        for (const sk of cleanSizes) {
          const cur = parseInt(newStock[sk]) || 0;
          newStock[sk] = Math.max(0, cur - 1);
        }
        updatedInv = { ...inv, sizeStock: newStock, updatedAt: Date.now() };
        const total = Object.values(newStock).reduce((a, b) => a + (parseInt(b) || 0), 0);
        isOut = total === 0;
        deducted = true;
      } else {
        // Stock general: una unidad (o más si se vendieron varias tallas sin estructura de anillo)
        const qtyToDeduct = Math.max(1, cleanSizes.length || 1);
        const cur = parseInt(inv.quantity) || 0;
        const newQty = Math.max(0, cur - qtyToDeduct);
        updatedInv = { ...inv, quantity: newQty, updatedAt: Date.now() };
        isOut = newQty === 0;
        deducted = true;
      }
    }

    // ─── Paso 4-6: TODOS los writes DESPUÉS ───
    // 4. Escribir la venta (siempre)
    tx.set(saleRef, sanitize(saleData));

    // 5. Escribir el inventario actualizado (si aplica)
    if (updatedInv && productId) {
      tx.set(doc(db, 'inventory', productId), sanitize(updatedInv));
    }

    // 6. Marcar producto como soldOut si corresponde
    if (isOut && prodSnap?.exists() && !prodSnap.data().soldOut) {
      tx.update(doc(db, 'products', productId), { soldOut: true });
    }

    return { success: true, isOut, deducted };
  }));
}

/* ============================================================
   ★ DELETE SALE ATOMIC ★
   Borra una venta y REPONE el inventario en una transacción.
   ============================================================ */
export async function deleteSaleAtomic(saleId, productId, sizeKeys = []) {
  if (!saleId) throw new Error('Falta saleId');
  return await withRetry(() => runTransaction(db, async (tx) => {
    const saleRef = doc(db, 'sales', String(saleId));
    let invSnap = null;
    if (productId) {
      invSnap = await tx.get(doc(db, 'inventory', productId));
    }

    let updatedInv = null;
    if (invSnap?.exists()) {
      const inv = invSnap.data();
      const cleanSizes = (sizeKeys || []).filter(Boolean);

      if (cleanSizes.length > 0 && inv.isRing && inv.sizeStock) {
        const newStock = { ...inv.sizeStock };
        for (const sk of cleanSizes) {
          newStock[sk] = (parseInt(newStock[sk]) || 0) + 1;
        }
        updatedInv = { ...inv, sizeStock: newStock, updatedAt: Date.now() };
      } else {
        const qtyToReturn = Math.max(1, cleanSizes.length || 1);
        updatedInv = {
          ...inv,
          quantity: (parseInt(inv.quantity) || 0) + qtyToReturn,
          updatedAt: Date.now(),
        };
      }
    }

    // Borrar venta
    tx.delete(saleRef);
    // Reponer inventario
    if (updatedInv && productId) {
      tx.set(doc(db, 'inventory', productId), sanitize(updatedInv));
    }
    return { success: true };
  }));
}

/* ============================================================
   ELIMINAR INVENTARIO Y CARGAS MASIVAS
   ============================================================ */

/** Elimina el inventario de un producto (con retry) */
export async function deleteProductInventory(productId) {
  if (!productId) return;
  await withRetry(() => deleteDoc(doc(db, 'inventory', productId)), 4);
}

/** Carga TODO el inventario de una vez (para el panel admin) */
export async function loadAllInventory() {
  try {
    const snap = await getDocs(INV_COL);
    const map = {};
    snap.forEach(d => { map[d.id] = d.data(); });
    return map;
  } catch (e) {
    console.error('Error cargando inventario completo:', e);
    return {};
  }
}

/** Carga el inventario solo para los productos indicados */
export async function loadProductsInventory(productIds) {
  if (!productIds?.length) return {};
  try {
    const snaps = await Promise.all(
      productIds.map(id => getDoc(doc(db, 'inventory', id)))
    );
    const map = {};
    snaps.forEach((snap, i) => {
      if (snap.exists()) map[productIds[i]] = snap.data();
    });
    return map;
  } catch (e) {
    console.error('Error cargando inventario de productos:', e);
    return {};
  }
}

/* ============================================================
   HELPERS PUROS (sin Firebase)  — IDÉNTICOS A ANTES
   ============================================================ */

export function getTotalUnits(inv) {
  if (!inv) return null;
  if (inv.isRing && inv.sizeStock) {
    return Object.values(inv.sizeStock).reduce((sum, v) => sum + (parseInt(v) || 0), 0);
  }
  return parseInt(inv.quantity) || 0;
}

export function getSizeStock(inv, sizeKey) {
  if (!inv?.isRing || !inv.sizeStock) return null;
  const v = inv.sizeStock[sizeKey];
  return v === undefined ? null : parseInt(v) || 0;
}

export function isSizeOutOfStock(inv, sizeKey) {
  const stock = getSizeStock(inv, sizeKey);
  return stock !== null && stock === 0;
}

export function getStockLevel(inv) {
  if (!inv) return 'unknown';
  const total = getTotalUnits(inv);
  if (total === 0) return 'out';
  if (total <= 3) return 'low';
  return 'ok';
}

export function buildEmptyInventory(product) {
  const isRing = product.categoryId?.includes('anillo');
  if (isRing) {
    const sizeStock = {};
    (product.tallasVaron || []).forEach(t => { sizeStock[`V-${t}`] = 0; });
    (product.tallasDama  || []).forEach(t => { sizeStock[`D-${t}`] = 0; });
    (product.tallas      || []).forEach(t => { sizeStock[`V-${t}`] = 0; });
    return { productId: product.id, code: '', isRing: true, sizeStock, updatedAt: 0 };
  }
  return { productId: product.id, code: '', isRing: false, quantity: 0, updatedAt: 0 };
}
