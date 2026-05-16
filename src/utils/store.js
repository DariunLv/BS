// src/utils/store.js
// ─────────────────────────────────────────────────────────────────────────────
// CORREGIDO (May 2026):
//  - Ya no usa debounce simple "se pierde si cierras". Ahora usa saveQueue
//    que es persistente (sobrevive a recargas) y con reintentos automáticos.
//  - saveStore es ahora más rápido (250ms vs 600ms antes)
//  - Operaciones de productos individuales TAMBIÉN pasan por la cola
//  - Helper validateData() detecta datos inválidos antes de guardar
// ─────────────────────────────────────────────────────────────────────────────
import {
  enqueueFullSave,
  enqueueProductMeta,
  enqueueProductImages,
  enqueueDeleteProduct,
  enqueueRingSizeGuide,
} from './saveQueue';

const STORAGE_KEY = 'benito_store_data';
const LOCAL_CACHE_KEY = 'benito_cache_v2';

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
  agregados: [],
  ringBoxes: {
    cheap:   { title: 'Caja de anillo', photo: '', label: 'Incluida' },
    premium: { title: 'Caja Premium',   photo: '', label: 'Incluida' },
  },
  ringSizeGuide: {
    videoUrl: '',
    photo: '',
    text: '¿No sabes tu talla? Mira este video para descubrirlo',
  },
};

let cacheData = null;

// ─────────────────────────────────────────────────────────────────────────────
// SUSCRIPCIÓN: notifica a React automáticamente en cada mutación
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// VALIDACIÓN: detecta datos rotos antes de guardar
// ─────────────────────────────────────────────────────────────────────────────
function validateData(data) {
  if (!data || typeof data !== 'object') return false;
  // Asegurar arrays mínimos
  for (const k of ['categories', 'products', 'sales', 'investments', 'shareholders',
                   'pendingSales', 'capital', 'frecuentClients', 'pagosAccionista',
                   'agregados', 'deliveryLocations']) {
    if (data[k] && !Array.isArray(data[k])) return false;
  }
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// GUARDADO PRINCIPAL
//   - Actualiza cache local INSTANTÁNEO (UI responde de inmediato)
//   - Actualiza localStorage INSTANTÁNEO (no se pierde si cierras)
//   - Encola guardado a Firebase con reintentos automáticos
// ─────────────────────────────────────────────────────────────────────────────
export function saveStore(data) {
  if (!validateData(data)) {
    console.error('[saveStore] datos inválidos, no se guardan:', data);
    return;
  }
  data._lastModified = Date.now();
  cacheData = data;
  _notify();

  // 1. Caché local inmediato (instantáneo)
  try { localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(data)); } catch (e) {
    // localStorage lleno: intentar limpiar caché de imágenes externo
    console.warn('[saveStore] localStorage lleno, limpiando...');
    try {
      // No tocamos otras keys del usuario, solo notificamos
      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(data));
    } catch {}
  }

  // 2. Firebase via cola persistente (con retry automático y flush al cerrar)
  const { products: _ignored, ...meta } = data;
  enqueueFullSave({ ...meta });
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
  if (!data.agregados) data.agregados = [];
  if (!data.ringBoxes) data.ringBoxes = {
    cheap:   { title: 'Caja de anillo', photo: '', label: 'Incluida' },
    premium: { title: 'Caja Premium',   photo: '', label: 'Incluida' },
  };
  if (!data.ringSizeGuide) data.ringSizeGuide = {
    videoUrl: '',
    photo: '',
    text: '¿No sabes tu talla? Mira este video para descubrirlo',
  };

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
  const typeCats = data.categories
    .filter(c => c.storeType === storeType)
    .sort((a, b) => a.order - b.order);
  const otherCats = data.categories.filter(c => c.storeType !== storeType);

  const [moved] = typeCats.splice(fromIdx, 1);
  typeCats.splice(toIdx, 0, moved);
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
  // Eliminar productos via cola (con retry)
  const orphanProducts = data.products.filter(p => p.categoryId === id);
  orphanProducts.forEach(p => enqueueDeleteProduct(p.id));
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
    history[productId] = history[productId].slice(0, 10);
    localStorage.setItem(PRICE_HISTORY_KEY, JSON.stringify(history));
  } catch {}
}

/**
 * Helper: persiste el cacheData en localStorage (sin disparar Firebase save).
 * Útil para mantener el caché local consistente en operaciones por-producto.
 */
function _persistLocalCache() {
  try {
    if (cacheData) {
      cacheData._lastModified = Date.now();
      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(cacheData));
    }
  } catch {}
}

export function addProduct(product) {
  const data = loadStore();
  if (!product.createdAt) {
    const d = new Date();
    product.createdAt = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  data.products.push(product);
  cacheData = data;
  _notify();
  _persistLocalCache();
  // Guardar via cola (con retry automático)
  const { images, ...productMeta } = product;
  enqueueProductMeta(productMeta);
  if (images && images.length > 0) {
    enqueueProductImages(product.id, images);
    import('./imageCache').then(({ injectImages }) => injectImages(product.id, images));
  }
  return data;
}

export function updateProduct(id, updates) {
  const data = loadStore();
  const idx = data.products.findIndex(p => p.id === id);
  if (idx !== -1) {
    const prev = data.products[idx];
    if (updates.price !== undefined && String(updates.price) !== String(prev.price)) {
      recordPriceChange(id, prev.title || updates.title || '', prev.price, updates.price);
    }
    data.products[idx] = { ...prev, ...updates };
    cacheData = data;
    _notify();
    _persistLocalCache();
    const { images, ...productMeta } = data.products[idx];
    enqueueProductMeta(productMeta);
    if (images !== undefined) {
      enqueueProductImages(id, images || []);
      if (images?.length > 0) {
        import('./imageCache').then(({ injectImages }) => injectImages(id, images));
      }
    }
  }
  return data;
}

export function reorderProducts(categoryId, fromIdx, toIdx) {
  const data = loadStore();
  const catProducts = data.products
    .filter(p => p.categoryId === categoryId)
    .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
  const others = data.products.filter(p => p.categoryId !== categoryId);

  const [moved] = catProducts.splice(fromIdx, 1);
  catProducts.splice(toIdx, 0, moved);
  catProducts.forEach((p, i) => { p.sortOrder = i; });

  data.products = [...others, ...catProducts];
  cacheData = data;
  _persistLocalCache();

  // Guardar solo los afectados via cola (cada uno con retry)
  catProducts.forEach(p => {
    const { images, ...meta } = p;
    enqueueProductMeta(meta);
  });
  return data;
}

export function deleteProduct(id) {
  const data = loadStore();
  data.products = data.products.filter(p => p.id !== id);
  cacheData = data;
  _notify();
  _persistLocalCache();
  enqueueDeleteProduct(id);
  return data;
}

export function toggleSoldOut(id) {
  const data = loadStore();
  const idx = data.products.findIndex(p => p.id === id);
  if (idx !== -1) {
    data.products[idx].soldOut = !data.products[idx].soldOut;
    cacheData = data;
    _notify();
    _persistLocalCache();
    const { images, ...productMeta } = data.products[idx];
    enqueueProductMeta(productMeta);
  }
  return data;
}

export function toggleHidden(id) {
  const data = loadStore();
  const idx = data.products.findIndex(p => p.id === id);
  if (idx !== -1) {
    data.products[idx].hidden = !data.products[idx].hidden;
    cacheData = data;
    _notify();
    _persistLocalCache();
    const { images, ...productMeta } = data.products[idx];
    enqueueProductMeta(productMeta);
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

/** OBSOLETO — las imágenes viven en imageCache.js. */
export function mergeProductImages(imagesMap, checkedIds = []) {
  // No-op intencional.
}

/* ====== AGREGADOS ====== */
export function getAgregados() {
  const data = loadStore();
  return (data.agregados || []).sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
}

export function addAgregado(ag) {
  const data = loadStore();
  if (!data.agregados) data.agregados = [];
  const maxOrder = data.agregados.reduce((m, a) => Math.max(m, a.order ?? 0), -1);
  ag.order = maxOrder + 1;
  data.agregados.push(ag);
  saveStore(data);
  return data;
}

export function updateAgregado(id, updates) {
  const data = loadStore();
  if (!data.agregados) data.agregados = [];
  const idx = data.agregados.findIndex(a => a.id === id);
  if (idx !== -1) {
    data.agregados[idx] = { ...data.agregados[idx], ...updates };
    saveStore(data);
  }
  return data;
}

export function deleteAgregado(id) {
  const data = loadStore();
  if (!data.agregados) data.agregados = [];
  data.agregados = data.agregados.filter(a => a.id !== id);
  saveStore(data);
  return data;
}

export function reorderAgregados(fromIdx, toIdx) {
  const data = loadStore();
  if (!data.agregados) data.agregados = [];
  const sorted = [...data.agregados].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
  const [moved] = sorted.splice(fromIdx, 1);
  sorted.splice(toIdx, 0, moved);
  sorted.forEach((a, i) => { a.order = i; });
  data.agregados = sorted;
  saveStore(data);
  return data;
}

/* ====== RING BOXES ====== */
export function getRingBoxes() {
  const data = loadStore();
  return data.ringBoxes || {
    cheap:   { title: 'Caja de anillo', photo: '', label: 'Incluida' },
    premium: { title: 'Caja Premium',   photo: '', label: 'Incluida' },
  };
}

export function updateRingBoxes(ringBoxes) {
  const data = loadStore();
  data.ringBoxes = ringBoxes;
  saveStore(data);
  return data;
}

/* ====== GUÍA DE TALLAS DE ANILLOS (video + foto + texto) ====== */
export function getRingSizeGuide() {
  const data = loadStore();
  return data.ringSizeGuide || {
    videoUrl: '',
    photo: '',
    text: '¿No sabes tu talla? Mira este video para descubrirlo',
  };
}

export function updateRingSizeGuide(guide) {
  const data = loadStore();
  const next = {
    videoUrl: guide?.videoUrl || '',
    photo: guide?.photo || '',
    text: guide?.text || '¿No sabes tu talla? Mira este video para descubrirlo',
  };
  data.ringSizeGuide = next;
  data._lastModified = Date.now();
  cacheData = data;
  _notify();
  // Actualizar caché local inmediato
  try { localStorage.setItem('benito_cache_v2', JSON.stringify(data)); } catch {}
  // Encolar guardado a Firebase EN SU PROPIO DOC (no infla meta)
  enqueueRingSizeGuide(next);
  return data;
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
 */
export function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
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