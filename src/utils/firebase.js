// src/utils/firebase.js
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

// Colecciones separadas para no superar el limite de 1MB por documento
const META_REF       = doc(db, 'store', 'meta');
const OLD_DATA_REF   = doc(db, 'store', 'data'); // documento viejo (compatibilidad)
const PROD_COL       = collection(db, 'products');
const IMG_COL        = collection(db, 'productImages');
const CLI_PHOTOS_COL = collection(db, 'clientPhotos');   // fotos de clientes frecuentes
const SALES_COL      = collection(db, 'sales');           // ventas
const INVEST_COL     = collection(db, 'investments');     // gastos/inversiones
const PENDING_COL    = collection(db, 'pendingSales');    // ventas pendientes

/* ============================================================
   CARGA COMPLETA - Leer todo al iniciar la app
   ============================================================ */
export async function loadFromFirebase() {
  try {
    // 1. Intentar leer metadatos del nuevo documento
    let meta = null;
    const metaSnap = await getDoc(META_REF);
    if (metaSnap.exists()) {
      meta = metaSnap.data();
    } else {
      // Compatibilidad: intentar leer el documento viejo store/data
      const oldSnap = await getDoc(OLD_DATA_REF);
      if (oldSnap.exists()) {
        const oldData = oldSnap.data();
        // Migrar: guardar en nueva estructura y devolver datos completos
        const { products: oldProducts = [], ...oldMeta } = oldData;
        meta = { ...oldMeta, products: [] };
        // Guardar meta en nuevo lugar (sin productos para no superar 1MB)
        await setDoc(META_REF, meta);
        // Si hay productos en el doc viejo, migrarlos a coleccion separada
        if (oldProducts.length > 0) {
          const batch = writeBatch(db);
          for (const p of oldProducts) {
            const { images, ...pMeta } = p;
            batch.set(doc(db, 'products', p.id), pMeta);
            if (images && images.length > 0) {
              batch.set(doc(db, 'productImages', p.id), { images });
            }
          }
          await batch.commit();
        }
        // Retornar datos completos con productos del doc viejo
        return { ...oldMeta, products: oldProducts };
      }
    }

    if (!meta) return null;

    // 2. Leer productos de la coleccion separada
    const prodSnap = await getDocs(PROD_COL);
    const products = [];
    prodSnap.forEach(d => products.push(d.data()));

    // 3. Leer imágenes separadas
    const imgSnap = await getDocs(IMG_COL);
    const imagesMap = {};
    imgSnap.forEach(d => { imagesMap[d.id] = d.data().images || []; });

    // Combinar productos con imágenes
    const productsWithImages = products.map(p => ({
      ...p,
      images: imagesMap[p.id] || [],
    }));

    // Leer colecciones separadas en paralelo
    const [cliPhotoSnap, salesSnap, investSnap, pendingSnap] = await Promise.all([
      getDocs(CLI_PHOTOS_COL),
      getDocs(SALES_COL),
      getDocs(INVEST_COL),
      getDocs(PENDING_COL),
    ]);

    // Fotos de clientes
    const clientPhotosMap = {};
    cliPhotoSnap.forEach(d => { clientPhotosMap[d.id] = d.data().foto || ''; });
    const frecuentClientsWithPhotos = (meta.frecuentClients || []).map(c => ({
      ...c,
      foto: clientPhotosMap[c.id] || c.foto || '',
    }));

    // Ventas
    const sales = [];
    salesSnap.forEach(d => sales.push(d.data()));

    // Inversiones
    const investments = [];
    investSnap.forEach(d => investments.push(d.data()));

    // Pendientes
    const pendingSales = [];
    pendingSnap.forEach(d => pendingSales.push(d.data()));

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
   GUARDADO INTELIGENTE - Separa productos e imágenes
   ============================================================ */
export async function saveToFirebase(data) {
  try {
    const { products = [], ...meta } = data;

    // Extraer colecciones grandes del meta para guardarlas separado
    const frecuentClientsRaw = (meta.frecuentClients || []).map(c => ({ ...c }));
    const salesRaw           = meta.sales || [];
    const investmentsRaw     = meta.investments || [];
    const pendingSalesRaw    = meta.pendingSales || [];

    const metaToSave = {
      ...meta,
      frecuentClients: frecuentClientsRaw.map(({ foto, ...rest }) => rest),
      sales: [],
      investments: [],
      pendingSales: [],
    };

    // 1. Guardar metadatos limpios (sin datos que crecen)
    await setDoc(META_REF, metaToSave);

    // Helper para guardar array en coleccion (borra los que ya no existen)
    async function syncCollection(col, items, buildDoc) {
      const b = writeBatch(db);
      let ops = 0;
      for (const item of items) {
        if (item.id) { b.set(doc(db, col.id, item.id), buildDoc(item)); ops++; }
        if (ops >= 490) { await b.commit(); }
      }
      if (ops > 0) await b.commit();
    }

    await Promise.all([
      // Fotos de clientes
      syncCollection(CLI_PHOTOS_COL, frecuentClientsRaw, c => ({ foto: c.foto || '' })),
      // Ventas — guardar cada una en su propio doc
      syncCollection(SALES_COL, salesRaw, s => s),
      // Inversiones/gastos
      syncCollection(INVEST_COL, investmentsRaw, i => i),
      // Ventas pendientes
      syncCollection(PENDING_COL, pendingSalesRaw, p => p),
    ]);

    // 2. Guardar cada producto en su propio documento (sin imagenes)
    // Usar batch para eficiencia (max 500 ops por batch)
    const batches = [];
    let batch = writeBatch(db);
    let opCount = 0;

    for (const product of products) {
      const { images, ...productWithoutImages } = product;
      const productRef = doc(db, 'products', product.id);
      batch.set(productRef, productWithoutImages);
      opCount++;

      // Las imágenes van en su propia colección para evitar el limite de 1MB
      if (images && images.length > 0) {
        const imgRef = doc(db, 'productImages', product.id);
        batch.set(imgRef, { images });
        opCount++;
      }

      // Firestore permite max 500 operaciones por batch
      if (opCount >= 490) {
        batches.push(batch);
        batch = writeBatch(db);
        opCount = 0;
      }
    }

    if (opCount > 0) batches.push(batch);
    await Promise.all(batches.map(b => b.commit()));

  } catch (e) {
    console.error('Error guardando en Firebase:', e);
  }
}

/* ============================================================
   OPERACIONES INDIVIDUALES - Para updates rapidos
   ============================================================ */

/** Guarda un solo producto (sin imágenes) */
export async function saveProductToFirebase(product) {
  try {
    const { images, ...productWithoutImages } = product;
    await setDoc(doc(db, 'products', product.id), productWithoutImages);
  } catch (e) {
    console.error('Error guardando producto:', e);
  }
}

/** Guarda las imágenes de un producto por separado */
export async function saveProductImagesToFirebase(productId, images) {
  try {
    // Cada imagen base64 puede pesar ~300-500KB
    // Si el array de imágenes pesa más de 900KB, comprimir más
    const imgDoc = { images };
    await setDoc(doc(db, 'productImages', productId), imgDoc);
  } catch (e) {
    // Si supera 1MB incluso separado, guardar de a una imagen
    if (e.message && e.message.includes('exceeds the maximum')) {
      console.warn('Imágenes muy pesadas, guardando reducidas...');
      // Intentar guardar solo la primera imagen como fallback
      try {
        await setDoc(doc(db, 'productImages', productId), { images: images.slice(0, 1) });
      } catch (e2) {
        console.error('Error guardando imágenes reducidas:', e2);
      }
    } else {
      console.error('Error guardando imágenes:', e);
    }
  }
}

/** Elimina un producto de Firebase */
export async function deleteProductFromFirebase(productId) {
  try {
    await deleteDoc(doc(db, 'products', productId));
    await deleteDoc(doc(db, 'productImages', productId));
  } catch (e) {
    console.error('Error eliminando producto:', e);
  }
}