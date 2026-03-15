// src/utils/inventory.js
// Gestión de inventario: stock, tallas, códigos de producto
import { getApps, initializeApp } from 'firebase/app';
import {
  getFirestore, doc, getDoc, setDoc, getDocs,
  collection, deleteDoc,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCWAs5LOcXvGkJ9QKz9WfHXBhkp2OAntWA",
  authDomain: "benito-store.firebaseapp.com",
  projectId: "benito-store",
  storageBucket: "benito-store.firebasestorage.app",
  messagingSenderId: "133305981902",
  appId: "1:133305981902:web:48bb76991a74295d42e99f",
};

// Reutilizar la instancia de Firebase si ya existe
const app = getApps()[0] || initializeApp(firebaseConfig);
const db = getFirestore(app);
const INV_COL = collection(db, 'inventory');

/* ============================================================
   ESTRUCTURAS DE DATOS
   ============================================================
   Producto normal:
   {
     productId: string,
     code: string,          // Ej: "COL-001"
     quantity: number,      // unidades totales
     isRing: false,
     updatedAt: number,
   }

   Anillo (isRing: true):
   {
     productId: string,
     code: string,
     isRing: true,
     sizeStock: {
       "V-6":  3,  // Varón talla 6 → 3 unidades
       "V-7":  0,  // Varón talla 7 → agotado
       "D-5":  2,  // Dama talla 5 → 2 unidades
       "D-6":  0,  // Dama talla 6 → agotado
     },
     updatedAt: number,
   }
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

/** Guarda/actualiza el inventario de UN producto */
export async function saveProductInventory(productId, data) {
  if (!productId) return;
  try {
    await setDoc(doc(db, 'inventory', productId), {
      ...data,
      productId,
      updatedAt: Date.now(),
    });
  } catch (e) {
    console.error('Error guardando inventario:', e);
  }
}

/**
 * Después de descontar, comprueba si el stock total llegó a 0.
 * Para anillos verifica si TODAS las tallas están en 0.
 * Devuelve true si el producto quedó completamente agotado.
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

/** Descuenta 1 unidad de una talla específica o del stock general */
export async function deductInventory(productId, sizeKey = null) {
  if (!productId) return;
  try {
    const snap = await getDoc(doc(db, 'inventory', productId));
    if (!snap.exists()) return;
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
    await setDoc(doc(db, 'inventory', productId), updated);
  } catch (e) {
    console.error('Error descontando inventario:', e);
  }
}

/** Agrega unidades al inventario (cuando se repone stock) */
export async function addToInventory(productId, sizeKey = null, amount = 1) {
  if (!productId) return;
  try {
    const snap = await getDoc(doc(db, 'inventory', productId));
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
    await setDoc(doc(db, 'inventory', productId), updated);
  } catch (e) {
    console.error('Error agregando al inventario:', e);
  }
}

/** Elimina el inventario de un producto (al eliminar el producto) */
export async function deleteProductInventory(productId) {
  if (!productId) return;
  try {
    await deleteDoc(doc(db, 'inventory', productId));
  } catch (e) {
    console.error('Error eliminando inventario:', e);
  }
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

/** Carga el inventario solo para los products indicados (para modal de catálogo) */
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
   HELPERS PUROS (sin Firebase)
   ============================================================ */

/** Total de unidades de un producto (normal o anillo) */
export function getTotalUnits(inv) {
  if (!inv) return null; // null = sin datos de inventario
  if (inv.isRing && inv.sizeStock) {
    return Object.values(inv.sizeStock)
      .reduce((sum, v) => sum + (parseInt(v) || 0), 0);
  }
  return parseInt(inv.quantity) || 0;
}

/** Stock de una talla específica (clave "V-6", "D-5", etc.) */
export function getSizeStock(inv, sizeKey) {
  if (!inv?.isRing || !inv.sizeStock) return null;
  const v = inv.sizeStock[sizeKey];
  return v === undefined ? null : parseInt(v) || 0;
}

/** True si esa talla está AGOTADA (stock === 0, no si es null = sin dato) */
export function isSizeOutOfStock(inv, sizeKey) {
  const stock = getSizeStock(inv, sizeKey);
  return stock !== null && stock === 0;
}

/** Nivel de stock: 'ok' | 'low' | 'out' | 'unknown' */
export function getStockLevel(inv) {
  if (!inv) return 'unknown';
  const total = getTotalUnits(inv);
  if (total === 0) return 'out';
  if (total <= 3) return 'low';
  return 'ok';
}

/** Inicializa un objeto de inventario vacío basado en el producto */
export function buildEmptyInventory(product) {
  const isRing = product.categoryId?.includes('anillo');
  if (isRing) {
    const sizeStock = {};
    (product.tallasVaron || []).forEach(t => { sizeStock[`V-${t}`] = 0; });
    (product.tallasDama  || []).forEach(t => { sizeStock[`D-${t}`] = 0; });
    (product.tallas      || []).forEach(t => { sizeStock[`V-${t}`] = 0; });
    return {
      productId: product.id,
      code: '',
      isRing: true,
      sizeStock,
      updatedAt: 0,
    };
  }
  return {
    productId: product.id,
    code: '',
    isRing: false,
    quantity: 0,
    updatedAt: 0,
  };
}