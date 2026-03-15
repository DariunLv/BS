// src/utils/imageCache.js
// Caché de imágenes completamente separado del estado de React.
// Las imágenes base64 NUNCA entran en JSON.parse/JSON.stringify ni en React state.
// Esto evita clonar megabytes de datos en cada actualización del store.

const _cache   = new Map(); // productId → string[] (base64 images)
const _pending = new Set(); // productIds actualmente en vuelo
const _subs    = new Set(); // callbacks de suscripción

/** Suscribirse a cambios del caché. Devuelve función de desuscripción. */
export function subscribeToImages(cb) {
  _subs.add(cb);
  return () => _subs.delete(cb);
}

function _notify() {
  _subs.forEach(cb => {
    try { cb(); } catch {}
  });
}

/** Obtiene imágenes del caché (o null si aún no se han cargado). */
export function getImages(productId) {
  if (!productId) return [];
  const cached = _cache.get(productId);
  return cached !== undefined ? cached : null; // null = no cargado aún
}

/** Inyecta imágenes directamente (cuando se guardan desde el admin). */
export function injectImages(productId, images) {
  if (!productId) return;
  _cache.set(productId, images || []);
  _notify();
}

/**
 * Carga imágenes de Firebase para los IDs indicados.
 * Ignora los que ya están en caché o en vuelo.
 * Las imágenes llegan por lotes y notifican a los suscriptores.
 */
export async function preloadImages(productIds) {
  if (!productIds?.length) return;

  const needed = productIds.filter(id => id && !_cache.has(id) && !_pending.has(id));
  if (!needed.length) return;

  needed.forEach(id => _pending.add(id));

  try {
    const { loadCategoryImages } = await import('./firebase');
    const map = await loadCategoryImages(needed);

    needed.forEach(id => {
      _pending.delete(id);
      // Guardar resultado (vacío [] si no tiene fotos — confirma que se consultó)
      _cache.set(id, map[id] || []);
    });

    _notify();
  } catch (e) {
    needed.forEach(id => _pending.delete(id));
    console.error('Error cargando imágenes:', e);
  }
}

/**
 * Precarga imágenes en paralelo por lotes de N para no saturar Firestore.
 * Útil al entrar a una categoría con muchos productos.
 */
export async function preloadImagesInBatches(productIds, batchSize = 8) {
  if (!productIds?.length) return;
  const needed = productIds.filter(id => id && !_cache.has(id) && !_pending.has(id));
  if (!needed.length) return;

  // Lanzar primer lote inmediatamente, el resto con pequeño delay para no bloquear UI
  for (let i = 0; i < needed.length; i += batchSize) {
    const batch = needed.slice(i, i + batchSize);
    if (i === 0) {
      preloadImages(batch); // primer lote: inmediato
    } else {
      const delay = Math.floor(i / batchSize) * 150; // 150ms entre lotes
      setTimeout(() => preloadImages(batch), delay);
    }
  }
}