// src/utils/store.js
import { saveToFirebase, saveProductToFirebase, saveProductImagesToFirebase, deleteProductFromFirebase } from './firebase';

const STORAGE_KEY = 'benito_store_data';

const DEFAULT_JEWELRY_CATEGORIES = [
  { id: 'ofertas', name: 'Ofertas Especiales', image: '', lottieUrl: 'https://lottie.host/f605aec1-2e91-496b-9b55-4982e2f75047/Ow0BUEgWTP.lottie', storeType: 'jewelry', order: 0, isOffers: true },
  { id: 'anillos', name: 'Anillos', image: '', lottieUrl: 'https://lottie.host/60f16af4-8158-4643-8208-d87861d241a9/73zzcGNGgg.lottie', storeType: 'jewelry', order: 1 },
  { id: 'collares', name: 'Collares', image: '', lottieUrl: 'https://lottie.host/127d2e9a-3ac9-457f-a3b5-447168c1b4a0/T2ntdUWyuk.lottie', storeType: 'jewelry', order: 2 },
  { id: 'collares-parejas', name: 'Collares para Parejas', image: '', lottieUrl: 'https://lottie.host/454dfe96-d4d9-4938-96f4-db32c761f5d0/SLbWwfzsQh.lottie', storeType: 'jewelry', order: 3 },
  { id: 'pulseras', name: 'Pulseras', image: '', lottieUrl: 'https://lottie.host/12dd8dcf-4152-449c-b7d0-bb9448664e7a/Tz7RkTie6i.lottie', storeType: 'jewelry', order: 4 },
  { id: 'packs-presentacion', name: 'Packs de Presentación', image: '', lottieUrl: 'https://lottie.host/f605aec1-2e91-496b-9b55-4982e2f75047/Ow0BUEgWTP.lottie', storeType: 'jewelry', order: 5, isPack: true },
  { id: 'detalles', name: 'Detalles', image: '', lottieUrl: 'https://lottie.host/f605aec1-2e91-496b-9b55-4982e2f75047/Ow0BUEgWTP.lottie', storeType: 'jewelry', order: 6 },
];

const DEFAULT_DELIVERY_LOCATIONS = [
  { id: 'loc1', name: 'Tupac Amaru', lat: -15.5006, lng: -70.1277 },
  { id: 'loc2', name: 'Real Plaza', lat: -15.4985, lng: -70.1234 },
  { id: 'loc3', name: 'Plaza Bolognesi', lat: -15.4977, lng: -70.1311 },
  { id: 'loc4', name: 'Plaza Zarumilla', lat: -15.4945, lng: -70.1290 },
  { id: 'loc5', name: 'Centro Comercial N2', lat: -15.5000, lng: -70.1305 },
  { id: 'loc6', name: 'Plaza de Armas', lat: -15.4963, lng: -70.1312 },
];

const DEFAULT_DATA = {
  categories: [...DEFAULT_JEWELRY_CATEGORIES],
  products: [],
  adminPassword: 'benito2026',
  whatsappNumber: '51970824366',
  deliveryLocations: [...DEFAULT_DELIVERY_LOCATIONS],
  shalomImage: '',
  sales: [],
  investments: [],
  shareholders: [],
  pendingSales: [],
  capital: [],
  frecuentClients: [],
  pagosAccionista: [],
};

let cacheData = null;

// ── Sistema de suscripción: notifica a React automáticamente en cada mutación ──
const _subscribers = new Set();
export function subscribeToStore(cb) {
  _subscribers.add(cb);
  return () => _subscribers.delete(cb);
}
function _notify() {
  const snap = loadStore();
  _subscribers.forEach(cb => cb(snap));
}

export function loadStore() {
  if (cacheData) return JSON.parse(JSON.stringify(cacheData));
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

// Debounce Firebase: espera 600ms de inactividad antes de enviar
// Evita múltiples writes seguidos (ej: editar un campo caracter a caracter)
let _saveTimer = null;
let _pendingData = null;

export function saveStore(data) {
  data._lastModified = Date.now();
  cacheData = data;
  _notify();
  // Siempre actualizar caché local de inmediato (instantáneo)
  try { localStorage.setItem('benito_cache_v2', JSON.stringify(data)); } catch {}
  // Firebase: debounce de 600ms
  _pendingData = data;
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    const toSave = _pendingData;
    _saveTimer = null;
    _pendingData = null;
    if (!toSave) return;
    const { products, ...meta } = toSave;
    const doSave = (attempt = 1) => {
      saveToFirebase({ ...meta, products: [] })
        .catch(err => {
          console.warn('Firebase save attempt', attempt, 'failed:', err);
          if (attempt < 4) setTimeout(() => doSave(attempt + 1), 1500 * attempt);
        });
    };
    doSave();
  }, 600);
}

export function setCacheData(data) {
  if (!data.sales) data.sales = [];
  if (!data.investments) data.investments = [];
  if (!data.shareholders) data.shareholders = [];
  if (!data.pendingSales) data.pendingSales = [];
  if (!data.capital) data.capital = [];
  if (!data.frecuentClients) data.frecuentClients = [];
  if (!data.pagosAccionista) data.pagosAccionista = [];
  if (!data.whatsappNumber) data.whatsappNumber = '51970824366';

  // Asegurar que todas las categorías por defecto existen (merge sin duplicar)
  const existingIds = (data.categories || []).map(c => c.id);
  DEFAULT_JEWELRY_CATEGORIES.forEach(defCat => {
    if (!existingIds.includes(defCat.id)) {
      data.categories = [...(data.categories || []), defCat];
    }
  });

  cacheData = data;
}

/* ====== CATEGORIAS ====== */
export function getCategories(storeType = 'jewelry') {
  const data = loadStore();
  return data.categories.filter(c => c.storeType === storeType).sort((a, b) => a.order - b.order);
}

export function getAllCategories() {
  const data = loadStore();
  return data.categories.sort((a, b) => a.order - b.order);
}

export function addCategory(category) {
  const data = loadStore();
  data.categories.push(category);
  saveStore(data);
  return data;
}

export function reorderCategories(storeType, fromIdx, toIdx) {
  const data = loadStore();
  // Separar por storeType y ordenar
  const typeCats = data.categories
    .filter(c => c.storeType === storeType)
    .sort((a, b) => a.order - b.order);
  const otherCats = data.categories.filter(c => c.storeType !== storeType);

  // Mover
  const [moved] = typeCats.splice(fromIdx, 1);
  typeCats.splice(toIdx, 0, moved);

  // Reasignar order
  typeCats.forEach((c, i) => { c.order = i; });

  data.categories = [...otherCats, ...typeCats];
  saveStore(data);
  return data;
}

export function updateCategory(id, updates) {
  const data = loadStore();
  const idx = data.categories.findIndex(c => c.id === id);
  if (idx !== -1) {
    data.categories[idx] = { ...data.categories[idx], ...updates };
    saveStore(data);
  }
  return data;
}

export function deleteCategory(id) {
  const data = loadStore();
  const defaultIds = DEFAULT_JEWELRY_CATEGORIES.map(c => c.id);
  if (defaultIds.includes(id)) return data;
  // Eliminar productos de Firebase individualmente (fix: antes quedaban huerfanos)
  const orphanProducts = data.products.filter(p => p.categoryId === id);
  orphanProducts.forEach(p => deleteProductFromFirebase(p.id));
  data.categories = data.categories.filter(c => c.id !== id);
  data.products = data.products.filter(p => p.categoryId !== id);
  cacheData = data;
  saveStore(data);
  return data;
}

/* ====== WHATSAPP CONFIG ====== */
export function getWhatsappNumber() {
  const data = loadStore();
  return data.whatsappNumber || '51970824366';
}

export function updateWhatsappNumber(number) {
  const data = loadStore();
  data.whatsappNumber = number;
  saveStore(data);
  return data;
}

/* ====== PRODUCTOS ====== */
export function getProducts(categoryId) {
  const data = loadStore();
  if (categoryId) return data.products.filter(p => p.categoryId === categoryId);
  return data.products;
}

export function getProductsByStore(storeType) {
  const data = loadStore();
  const catIds = data.categories.filter(c => c.storeType === storeType).map(c => c.id);
  return data.products.filter(p => catIds.includes(p.categoryId));
}

export function getOfferProducts() {
  const data = loadStore();
  return data.products.filter(p => p.categoryId === 'ofertas');
}

/* ====== HISTORIAL DE PRECIOS (localStorage) ====== */
const PRICE_HISTORY_KEY = 'benito_price_history';

export function recordPriceChange(productId, productTitle, oldPrice, newPrice) {
  if (!productId || oldPrice === newPrice) return;
  try {
    const raw = localStorage.getItem(PRICE_HISTORY_KEY);
    const history = raw ? JSON.parse(raw) : {};
    if (!history[productId]) history[productId] = [];
    history[productId].unshift({
      date: new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      from: parseFloat(oldPrice) || 0,
      to: parseFloat(newPrice) || 0,
      title: productTitle,
    });
    // Máximo 10 entradas por producto
    history[productId] = history[productId].slice(0, 10);
    localStorage.setItem(PRICE_HISTORY_KEY, JSON.stringify(history));
  } catch {}
}

export function addProduct(product) {
  const data = loadStore();
  // Auto-registrar fecha de creacion si no tiene
  if (!product.createdAt) {
    const d = new Date();
    product.createdAt = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  data.products.push(product);
  cacheData = data;
  _notify();
  // Guardar metadatos del producto (sin imágenes) y las imágenes por separado
  const { images, ...productMeta } = product;
  saveProductToFirebase(productMeta);
  if (images && images.length > 0) {
    saveProductImagesToFirebase(product.id, images);
    // Inyectar en imageCache para que se vean de inmediato sin re-fetch
    import('./imageCache').then(({ injectImages }) => injectImages(product.id, images));
  }
  return data;
}

export function updateProduct(id, updates) {
  const data = loadStore();
  const idx = data.products.findIndex(p => p.id === id);
  if (idx !== -1) {
    const prev = data.products[idx];
    // Detectar cambio de precio y registrarlo
    if (updates.price !== undefined && String(updates.price) !== String(prev.price)) {
      recordPriceChange(id, prev.title || updates.title || '', prev.price, updates.price);
    }
    data.products[idx] = { ...prev, ...updates };
    cacheData = data;
    _notify();
    const { images, ...productMeta } = data.products[idx];
    saveProductToFirebase(productMeta);
    if (images !== undefined) {
      saveProductImagesToFirebase(id, images || []);
      if (images?.length > 0) {
        import('./imageCache').then(({ injectImages }) => injectImages(id, images));
      }
    }
  }
  return data;
}

export function reorderProducts(categoryId, fromIdx, toIdx) {
  const data = loadStore();
  // Extraer productos de esa categoría (en orden actual)
  const catProducts = data.products
    .filter(p => p.categoryId === categoryId)
    .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
  const others = data.products.filter(p => p.categoryId !== categoryId);

  // Mover
  const [moved] = catProducts.splice(fromIdx, 1);
  catProducts.splice(toIdx, 0, moved);

  // Reasignar sortOrder
  catProducts.forEach((p, i) => { p.sortOrder = i; });

  data.products = [...others, ...catProducts];
  cacheData = data;

  // Guardar solo los afectados en Firebase
  catProducts.forEach(p => {
    const { images, ...meta } = p;
    saveProductToFirebase(meta);
  });
  return data;
}

export function deleteProduct(id) {
  const data = loadStore();
  data.products = data.products.filter(p => p.id !== id);
  cacheData = data;
  deleteProductFromFirebase(id);
  return data;
}

export function toggleSoldOut(id) {
  const data = loadStore();
  const idx = data.products.findIndex(p => p.id === id);
  if (idx !== -1) {
    data.products[idx].soldOut = !data.products[idx].soldOut;
    cacheData = data;
    const { images, ...productMeta } = data.products[idx];
    saveProductToFirebase(productMeta);
  }
  return data;
}

export function toggleHidden(id) {
  const data = loadStore();
  const idx = data.products.findIndex(p => p.id === id);
  if (idx !== -1) {
    data.products[idx].hidden = !data.products[idx].hidden;
    cacheData = data;
    const { images, ...productMeta } = data.products[idx];
    saveProductToFirebase(productMeta);
  }
  return data;
}

/* ====== DELIVERY LOCATIONS ====== */
export function addDeliveryLocation(location) {
  const data = loadStore();
  data.deliveryLocations.push(location);
  saveStore(data);
  return data;
}

export function updateDeliveryLocation(id, updates) {
  const data = loadStore();
  const idx = data.deliveryLocations.findIndex(l => l.id === id);
  if (idx !== -1) {
    data.deliveryLocations[idx] = { ...data.deliveryLocations[idx], ...updates };
    saveStore(data);
  }
  return data;
}

export function deleteDeliveryLocation(id) {
  const data = loadStore();
  data.deliveryLocations = data.deliveryLocations.filter(l => l.id !== id);
  saveStore(data);
  return data;
}

export function updateShalomImage(imageBase64) {
  const data = loadStore();
  data.shalomImage = imageBase64;
  saveStore(data);
  return data;
}

/* ====== VENTAS ====== */
export function getSales() {
  const data = loadStore();
  return data.sales || [];
}

export function addSale(sale) {
  const data = loadStore();
  if (!data.sales) data.sales = [];
  data.sales.push(sale);
  saveStore(data);
  return data;
}

export function updateSale(id, updates) {
  const data = loadStore();
  if (!data.sales) data.sales = [];
  const idx = data.sales.findIndex(s => s.id === id);
  if (idx !== -1) {
    data.sales[idx] = { ...data.sales[idx], ...updates };
    saveStore(data);
  }
  return data;
}

export function deleteSale(id) {
  const data = loadStore();
  if (!data.sales) data.sales = [];
  data.sales = data.sales.filter(s => s.id !== id);
  saveStore(data);
  return data;
}

/* ====== INVERSIONES / GASTOS ====== */
export function getInvestments() {
  const data = loadStore();
  return data.investments || [];
}

export function addInvestment(inv) {
  const data = loadStore();
  if (!data.investments) data.investments = [];
  data.investments.push(inv);
  saveStore(data);
  return data;
}

export function updateInvestment(id, updates) {
  const data = loadStore();
  if (!data.investments) data.investments = [];
  const idx = data.investments.findIndex(i => i.id === id);
  if (idx !== -1) {
    data.investments[idx] = { ...data.investments[idx], ...updates };
    saveStore(data);
  }
  return data;
}

export function deleteInvestment(id) {
  const data = loadStore();
  if (!data.investments) data.investments = [];
  data.investments = data.investments.filter(i => i.id !== id);
  saveStore(data);
  return data;
}

/* ====== ACCIONISTAS ====== */
export function getShareholders() {
  const data = loadStore();
  return data.shareholders || [];
}

export function addShareholder(sh) {
  const data = loadStore();
  if (!data.shareholders) data.shareholders = [];
  data.shareholders.push(sh);
  saveStore(data);
  return data;
}

export function updateShareholder(id, updates) {
  const data = loadStore();
  if (!data.shareholders) data.shareholders = [];
  const idx = data.shareholders.findIndex(s => s.id === id);
  if (idx !== -1) {
    data.shareholders[idx] = { ...data.shareholders[idx], ...updates };
    saveStore(data);
  }
  return data;
}

export function deleteShareholder(id) {
  const data = loadStore();
  if (!data.shareholders) data.shareholders = [];
  data.shareholders = data.shareholders.filter(s => s.id !== id);
  saveStore(data);
  return data;
}

/* ====== VENTAS PENDIENTES ====== */
export function getPendingSales() {
  const data = loadStore();
  return data.pendingSales || [];
}

export function addPendingSale(ps) {
  const data = loadStore();
  if (!data.pendingSales) data.pendingSales = [];
  data.pendingSales.push(ps);
  saveStore(data);
  return data;
}

export function updatePendingSale(id, updates) {
  const data = loadStore();
  if (!data.pendingSales) data.pendingSales = [];
  const idx = data.pendingSales.findIndex(p => p.id === id);
  if (idx !== -1) {
    data.pendingSales[idx] = { ...data.pendingSales[idx], ...updates };
    saveStore(data);
  }
  return data;
}

export function deletePendingSale(id) {
  const data = loadStore();
  if (!data.pendingSales) data.pendingSales = [];
  data.pendingSales = data.pendingSales.filter(p => p.id !== id);
  saveStore(data);
  return data;
}

export function completePendingSale(id) {
  const data = loadStore();
  if (!data.pendingSales) data.pendingSales = [];
  const idx = data.pendingSales.findIndex(p => p.id === id);
  if (idx !== -1) {
    data.pendingSales[idx].completed = true;
    data.pendingSales[idx].completedDate = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
    saveStore(data);
  }
  return data;
}

/* ====== CAPITAL / ACTIVOS ====== */
export function getCapital() {
  const data = loadStore();
  return data.capital || [];
}

export function addCapital(item) {
  const data = loadStore();
  if (!data.capital) data.capital = [];
  data.capital.push(item);
  saveStore(data);
  return data;
}

export function deleteCapital(id) {
  const data = loadStore();
  if (!data.capital) data.capital = [];
  data.capital = data.capital.filter(c => c.id !== id);
  saveStore(data);
  return data;
}

/* ====== CLIENTES FRECUENTES ====== */
export function getFrecuentClients() {
  const data = loadStore();
  return data.frecuentClients || [];
}

export function addFrecuentClient(client) {
  const data = loadStore();
  if (!data.frecuentClients) data.frecuentClients = [];
  data.frecuentClients.push(client);
  saveStore(data);
  return data;
}

export function updateFrecuentClient(id, updates) {
  const data = loadStore();
  if (!data.frecuentClients) data.frecuentClients = [];
  const idx = data.frecuentClients.findIndex(c => c.id === id);
  if (idx !== -1) {
    data.frecuentClients[idx] = { ...data.frecuentClients[idx], ...updates };
    saveStore(data);
  }
  return data;
}

export function deleteFrecuentClient(id) {
  const data = loadStore();
  if (!data.frecuentClients) data.frecuentClients = [];
  data.frecuentClients = data.frecuentClients.filter(c => c.id !== id);
  saveStore(data);
  return data;
}

/* ====== PAGOS ACCIONISTA ====== */
export function getPagosAccionista() {
  const data = loadStore();
  return data.pagosAccionista || [];
}

export function addPagoAccionista(pago) {
  const data = loadStore();
  if (!data.pagosAccionista) data.pagosAccionista = [];
  data.pagosAccionista.push(pago);
  saveStore(data);
  return data;
}

export function deletePagoAccionista(id) {
  const data = loadStore();
  if (!data.pagosAccionista) data.pagosAccionista = [];
  data.pagosAccionista = data.pagosAccionista.filter(p => p.id !== id);
  saveStore(data);
  return data;
}

/**
 * OBSOLETO — las imágenes ahora se gestionan en imageCache.js.
 * Se mantiene la firma para no romper llamadas existentes, pero ya no
 * inyecta imágenes en el cacheData (eso era lo que causaba los clones lentos).
 */
export function mergeProductImages(imagesMap, checkedIds = []) {
  // No-op intencional. Las imágenes viven en imageCache.js fuera del state de React.
}

/* ====== AUTH & UTILS ====== */
export function verifyPassword(pw) {
  const data = loadStore();
  return pw === data.adminPassword;
}

export function changePassword(newPw) {
  const data = loadStore();
  data.adminPassword = newPw;
  saveStore(data);
  return data;
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Convierte un File a base64 con alta calidad.
 * Uso interno para luego subir a Firebase Storage.
 */
export function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // 1200px y calidad 0.88: equilibrio perfecto calidad/peso (~150-200KB por foto)
        const MAX = 1200;
        let w = img.width;
        let h = img.height;
        if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
        else { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Convierte un File a base64 de alta calidad.
 * Se guarda en la coleccion productImages separada para no superar 1MB en Firestore.
 */
export async function uploadImage(file) {
  return await imageToBase64(file);
}
export function updateCapital(id, updates) {
  const data = loadStore();
  if (!data.capital) data.capital = [];
  data.capital = data.capital.map(c => c.id === id ? { ...c, ...updates } : c);
  saveStore(data);
  return data;
}

/* ====== VISTAS DE PRODUCTOS (localStorage) ====== */
const VIEWS_KEY = 'benito_product_views';

export function trackProductView(productId) {
  if (!productId) return;
  try {
    const raw = localStorage.getItem(VIEWS_KEY);
    const views = raw ? JSON.parse(raw) : {};
    views[productId] = (views[productId] || 0) + 1;
    localStorage.setItem(VIEWS_KEY, JSON.stringify(views));
  } catch {}
}

export function getProductViews() {
  try {
    const raw = localStorage.getItem(VIEWS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function resetProductViews() {
  try { localStorage.removeItem(VIEWS_KEY); } catch {}
}


export function getPriceHistory(productId) {
  try {
    const raw = localStorage.getItem(PRICE_HISTORY_KEY);
    const history = raw ? JSON.parse(raw) : {};
    return history[productId] || [];
  } catch { return []; }
}