// src/utils/store.js
import { saveToFirebase } from './firebase';

const STORAGE_KEY = 'benito_store_data';

const DEFAULT_JEWELRY_CATEGORIES = [
  { id: 'ofertas', name: 'Ofertas Especiales', image: '', lottieUrl: 'https://lottie.host/f605aec1-2e91-496b-9b55-4982e2f75047/Ow0BUEgWTP.lottie', storeType: 'jewelry', order: 0, isOffers: true },
  { id: 'anillos', name: 'Anillos', image: '', lottieUrl: 'https://lottie.host/60f16af4-8158-4643-8208-d87861d241a9/73zzcGNGgg.lottie', storeType: 'jewelry', order: 1 },
  { id: 'collares', name: 'Collares', image: '', lottieUrl: 'https://lottie.host/127d2e9a-3ac9-457f-a3b5-447168c1b4a0/T2ntdUWyuk.lottie', storeType: 'jewelry', order: 2 },
  { id: 'collares-parejas', name: 'Collares para Parejas', image: '', lottieUrl: 'https://lottie.host/454dfe96-d4d9-4938-96f4-db32c761f5d0/SLbWwfzsQh.lottie', storeType: 'jewelry', order: 3 },
  { id: 'pulseras', name: 'Pulseras', image: '', lottieUrl: 'https://lottie.host/12dd8dcf-4152-449c-b7d0-bb9448664e7a/Tz7RkTie6i.lottie', storeType: 'jewelry', order: 4 },
];

const DEFAULT_DELIVERY_LOCATIONS = [
  { id: 'loc1', name: 'Tupac Amaru', lat: -15.5006, lng: -70.1277 },
  { id: 'loc2', name: 'Real Plaza', lat: -15.4985, lng: -70.1234 },
  { id: 'loc3', name: 'Plaza Bolognesi', lat: -15.4977, lng: -70.1311 },
  { id: 'loc4', name: 'Plaza Zarumilla', lat: -15.4945, lng: -70.1290 },
  { id: 'loc5', name: 'Centro Comercial N°2', lat: -15.5000, lng: -70.1305 },
  { id: 'loc6', name: 'Plaza de Armas', lat: -15.4963, lng: -70.1312 },
];

const DEFAULT_DATA = {
  categories: [...DEFAULT_JEWELRY_CATEGORIES],
  products: [],
  adminPassword: 'benito2026',
  deliveryLocations: [...DEFAULT_DELIVERY_LOCATIONS],
  shalomImage: '',
  sales: [],
  investments: [],
  shareholders: [],
  pendingSales: [],
};

let cacheData = null;

export function loadStore() {
  if (cacheData) return cacheData;
  return DEFAULT_DATA;
}

export function saveStore(data) {
  cacheData = data;
  saveToFirebase(data);
}

export function setCacheData(data) {
  if (!data.sales) data.sales = [];
  if (!data.investments) data.investments = [];
  if (!data.shareholders) data.shareholders = [];
  if (!data.pendingSales) data.pendingSales = [];
  cacheData = data;
}

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
  data.categories = data.categories.filter(c => c.id !== id);
  data.products = data.products.filter(p => p.categoryId !== id);
  saveStore(data);
  return data;
}

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

export function addProduct(product) {
  const data = loadStore();
  data.products.push(product);
  saveStore(data);
  return data;
}

export function updateProduct(id, updates) {
  const data = loadStore();
  const idx = data.products.findIndex(p => p.id === id);
  if (idx !== -1) {
    data.products[idx] = { ...data.products[idx], ...updates };
    saveStore(data);
  }
  return data;
}

export function deleteProduct(id) {
  const data = loadStore();
  data.products = data.products.filter(p => p.id !== id);
  saveStore(data);
  return data;
}

export function toggleSoldOut(id) {
  const data = loadStore();
  const idx = data.products.findIndex(p => p.id === id);
  if (idx !== -1) {
    data.products[idx].soldOut = !data.products[idx].soldOut;
    saveStore(data);
  }
  return data;
}

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

/* ========= VENTAS (SALES) ========= */
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

/* ========= INVERSIONES (INVESTMENTS) ========= */
export function getInvestments() {
  const data = loadStore();
  return data.investments || [];
}

export function addInvestment(investment) {
  const data = loadStore();
  if (!data.investments) data.investments = [];
  data.investments.push(investment);
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

/* ========= ACCIONISTAS (SHAREHOLDERS) ========= */
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

/* ========= VENTAS PENDIENTES ========= */
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
    data.pendingSales[idx].completedDate = new Date().toISOString().split('T')[0];
    saveStore(data);
  }
  return data;
}

/* ========= UTILIDADES ========= */
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

export function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 600;
        let w = img.width;
        let h = img.height;
        if (w > h) { if (w > MAX) { h = h * MAX / w; w = MAX; } }
        else { if (h > MAX) { w = w * MAX / h; h = MAX; } }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}