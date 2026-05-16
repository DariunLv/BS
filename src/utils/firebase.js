// src/utils/firebase.js
// ─────────────────────────────────────────────────────────────────────────────
// CORREGIDO (May 2026):
//  - syncCollection ahora resetea el batch tras cada commit (BUG arreglado)
//  - syncCollection ahora SÍ borra documentos que ya no existen
//  - Todas las operaciones tienen retry exponencial automático
//  - Sanitización de objetos antes de enviar (Firestore rechaza undefined)
//  - saveMetaToFirebase: nueva función que NO toca productos (saves rápidos)
// ─────────────────────────────────────────────────────────────────────────────
import { initializeApp } from 'firebase/app';
import {
  getFirestore, doc, getDoc, setDoc, getDocs,
  collection, writeBatch, deleteDoc
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCWAs5LOcXvGkJ9QKz9WfHXBhkp2OAntWA",
  authDomain: "benito-store.firebaseapp.com",
  projectId: "benito-store",
  storageBucket: "benito-store.firebasestorage.app",
  messagingSenderId: "133305981902",
  appId: "1:133305981902:web:48bb76991a74295d42e99f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Colecciones (separadas para no superar el limite de 1MB por documento)
const META_REF       = doc(db, 'store', 'meta');
const OLD_DATA_REF   = doc(db, 'store', 'data');
const PROD_COL       = collection(db, 'products');
const IMG_COL        = collection(db, 'productImages');
const CLI_PHOTOS_COL = collection(db, 'clientPhotos');
const SALES_COL      = collection(db, 'sales');
const INVEST_COL     = collection(db, 'investments');
const PENDING_COL    = collection(db, 'pendingSales');

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Elimina recursivamente claves con `undefined` (Firestore las rechaza).
 * También convierte Date a ISO y descarta funciones.
 */
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

/** Retry exponencial: 250ms, 600ms, 1.4s, 3s, 6s (5 intentos por defecto). */
async function withRetry(fn, attempts = 5, baseMs = 250) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const msg = String(e?.message || e);
      // Errores que NO tienen sentido reintentar
      if (msg.includes('permission-denied') ||
          msg.includes('exceeds the maximum') ||
          msg.includes('invalid-argument')) {
        throw e;
      }
      if (i === attempts - 1) break;
      const delay = baseMs * Math.pow(2.2, i);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

/**
 * Sincroniza una colección con un array de items.
 *  - Crea/actualiza los items presentes
 *  - BORRA los documentos cuya id ya no está en items (antes NO lo hacía)
 *  - Usa batches con reset correcto cada 490 ops (antes CRASHEABA)
 */
async function syncCollection(col, items, buildDoc) {
  // 1. Leer ids existentes para detectar los que hay que borrar
  let existingIds = new Set();
  try {
    const snap = await getDocs(col);
    snap.forEach(d => existingIds.add(d.id));
  } catch (e) {
    console.warn('[syncCollection] lectura previa falló:', e?.message);
  }

  const wantedIds = new Set(items.filter(it => it && it.id).map(it => String(it.id)));
  const toDelete  = [...existingIds].filter(id => !wantedIds.has(String(id)));

  // 2. Procesar con batches que SÍ se resetean
  let batch  = writeBatch(db);
  let opCount = 0;
  const commitAndReset = async () => {
    if (opCount === 0) return;
    await batch.commit();
    batch = writeBatch(db);
    opCount = 0;
  };

  for (const item of items) {
    if (!item || !item.id) continue;
    batch.set(doc(db, col.id, String(item.id)), sanitize(buildDoc(item)));
    opCount++;
    if (opCount >= 490) await commitAndReset();
  }

  for (const id of toDelete) {
    batch.delete(doc(db, col.id, id));
    opCount++;
    if (opCount >= 490) await commitAndReset();
  }

  await commitAndReset();
}

/* ============================================================
   CARGA COMPLETA - Leer todo al iniciar la app
   ============================================================ */
export async function loadFromFirebase() {
  try {
    let meta = null;
    const metaSnap = await getDoc(META_REF);
    if (metaSnap.exists()) {
      meta = metaSnap.data();
    } else {
      // Compatibilidad: documento viejo store/data
      const oldSnap = await getDoc(OLD_DATA_REF);
      if (oldSnap.exists()) {
        const oldData = oldSnap.data();
        const { products: oldProducts = [], ...oldMeta } = oldData;
        meta = { ...oldMeta, products: [] };
        await setDoc(META_REF, sanitize(meta));
        if (oldProducts.length > 0) {
          let b = writeBatch(db);
          let n = 0;
          for (const p of oldProducts) {
            const { images, ...pMeta } = p;
            b.set(doc(db, 'products', p.id), sanitize(pMeta));
            n++;
            if (images && images.length > 0) {
              b.set(doc(db, 'productImages', p.id), { images });
              n++;
            }
            if (n >= 490) { await b.commit(); b = writeBatch(db); n = 0; }
          }
          if (n > 0) await b.commit();
        }
        return { ...oldMeta, products: oldProducts };
      }
    }

    if (!meta) return null;

    const [prodSnap, cliPhotoSnap, salesSnap, investSnap, pendingSnap] = await Promise.all([
      getDocs(PROD_COL),
      getDocs(CLI_PHOTOS_COL),
      getDocs(SALES_COL),
      getDocs(INVEST_COL),
      getDocs(PENDING_COL),
    ]);

    const products = [];
    prodSnap.forEach(d => products.push(d.data()));
    const productsWithImages = products.map(p => ({ ...p, images: p.images || [] }));

    const clientPhotosMap = {};
    cliPhotoSnap.forEach(d => { clientPhotosMap[d.id] = d.data().foto || ''; });
    const frecuentClientsWithPhotos = (meta.frecuentClients || []).map(c => ({
      ...c,
      foto: clientPhotosMap[c.id] || c.foto || '',
    }));

    const sales = [];        salesSnap.forEach(d => sales.push(d.data()));
    const investments = [];  investSnap.forEach(d => investments.push(d.data()));
    const pendingSales = []; pendingSnap.forEach(d => pendingSales.push(d.data()));

    return {
      ...meta,
      frecuentClients: frecuentClientsWithPhotos,
      sales: sales.length > 0 ? sales : (meta.sales || []),
      investments: investments.length > 0 ? investments : (meta.investments || []),
      pendingSales: pendingSales.length > 0 ? pendingSales : (meta.pendingSales || []),
      products: productsWithImages,
    };
  } catch (e) {
    console.error('Error leyendo Firebase:', e);
    return null;
  }
}

/* ============================================================
   GUARDADO DE METADATA (rápido, NO toca productos/imágenes)
   ============================================================ */
export async function saveMetaToFirebase(data) {
  const { products = [], ...meta } = data;

  const frecuentClientsRaw = (meta.frecuentClients || []).map(c => ({ ...c }));
  const salesRaw           = meta.sales        || [];
  const investmentsRaw     = meta.investments  || [];
  const pendingSalesRaw    = meta.pendingSales || [];

  const metaToSave = sanitize({
    ...meta,
    frecuentClients: frecuentClientsRaw.map(({ foto, ...rest }) => rest),
    sales: [],
    investments: [],
    pendingSales: [],
  });

  // 1. Metadatos centrales (con retry)
  await withRetry(() => setDoc(META_REF, metaToSave));

  // 2. Colecciones grandes en paralelo
  await Promise.all([
    withRetry(() => syncCollection(CLI_PHOTOS_COL, frecuentClientsRaw, c => ({ foto: c.foto || '' }))),
    withRetry(() => syncCollection(SALES_COL,       salesRaw,       s => s)),
    withRetry(() => syncCollection(INVEST_COL,      investmentsRaw, i => i)),
    withRetry(() => syncCollection(PENDING_COL,     pendingSalesRaw, p => p)),
  ]);
}

/* ============================================================
   GUARDADO COMPLETO (compatibilidad — incluye productos)
   ============================================================ */
export async function saveToFirebase(data) {
  try {
    const { products = [] } = data;
    await saveMetaToFirebase(data);

    let batch = writeBatch(db);
    let opCount = 0;
    const commitReset = async () => {
      if (opCount === 0) return;
      await batch.commit();
      batch = writeBatch(db);
      opCount = 0;
    };

    for (const product of products) {
      const { images, ...productWithoutImages } = product;
      batch.set(doc(db, 'products', product.id), sanitize(productWithoutImages));
      opCount++;
      if (images && images.length > 0) {
        batch.set(doc(db, 'productImages', product.id), { images });
        opCount++;
      }
      if (opCount >= 490) await commitReset();
    }
    await commitReset();
  } catch (e) {
    console.error('Error guardando en Firebase:', e);
    throw e;
  }
}

/* ============================================================
   OPERACIONES INDIVIDUALES — con retry automático
   ============================================================ */
export async function saveProductToFirebase(product) {
  if (!product?.id) return;
  const { images, ...productWithoutImages } = product;
  await withRetry(() => setDoc(
    doc(db, 'products', product.id),
    sanitize(productWithoutImages)
  ));
}

export async function saveProductImagesToFirebase(productId, images) {
  if (!productId) return;
  try {
    await withRetry(() => setDoc(doc(db, 'productImages', productId), { images: images || [] }));
  } catch (e) {
    const msg = String(e?.message || '');
    if (msg.includes('exceeds the maximum')) {
      console.warn('[saveProductImages] doc > 1MB, intentando reducir...');
      let n = (images || []).length;
      while (n > 1) {
        n = Math.max(1, Math.floor(n * 0.7));
        try {
          await withRetry(() =>
            setDoc(doc(db, 'productImages', productId), { images: images.slice(0, n) })
          , 2);
          console.warn(`[saveProductImages] guardadas solo ${n} imágenes (caben en 1MB)`);
          return;
        } catch (e2) { /* sigue muy grande, reducir más */ }
      }
      try {
        await setDoc(doc(db, 'productImages', productId), { images: (images || []).slice(0, 1) });
      } catch (e3) {
        console.error('No se pudieron guardar imágenes:', e3);
        throw e3;
      }
    } else {
      throw e;
    }
  }
}

/** Carga imágenes SOLO para los productos indicados (lazy load por categoría). */
export async function loadCategoryImages(productIds) {
  if (!productIds || productIds.length === 0) return {};
  try {
    const snaps = await Promise.all(
      productIds.map(id => getDoc(doc(db, 'productImages', id)))
    );
    const map = {};
    snaps.forEach((snap, i) => {
      if (snap.exists()) map[productIds[i]] = snap.data().images || [];
    });
    return map;
  } catch (e) {
    console.error('Error cargando imágenes de categoría:', e);
    return {};
  }
}

/** Elimina un producto de Firebase (con retry). */
export async function deleteProductFromFirebase(productId) {
  if (!productId) return;
  await Promise.all([
    withRetry(() => deleteDoc(doc(db, 'products', productId)), 4),
    withRetry(() => deleteDoc(doc(db, 'productImages', productId)), 4),
  ]).catch(e => {
    console.error('Error eliminando producto:', e);
    throw e;
  });
}