// src/utils/saveQueue.js
// ─────────────────────────────────────────────────────────────────────────────
// Sistema robusto de guardado con:
//  - Cola persistente en localStorage (sobrevive a recargas)
//  - Reintentos exponenciales automáticos
//  - Flush forzado al cerrar/recargar/cambiar de pestaña (NO se pierde data)
//  - Estado global suscribible (idle / saving / saved / error / offline)
//  - Coalescencia: writes seguidos del MISMO tipo se fusionan
// ─────────────────────────────────────────────────────────────────────────────

const QUEUE_KEY  = 'benito_save_queue_v1';
const STATUS_KEY = 'benito_save_status_v1';

/**
 * Estados posibles:
 *  - 'idle'    : sin operaciones pendientes
 *  - 'saving'  : guardando ahora mismo
 *  - 'saved'   : se guardó hace poco (se vuelve 'idle' tras 2s)
 *  - 'error'   : falló, reintentando
 *  - 'offline' : sin conexión, esperando
 */
let _status   = 'idle';
let _lastErr  = null;
let _pending  = 0;
const _statusSubs = new Set();

function _emit() {
  _statusSubs.forEach(cb => { try { cb({ status: _status, pending: _pending, error: _lastErr }); } catch {} });
}

export function subscribeSaveStatus(cb) {
  _statusSubs.add(cb);
  // Estado inicial
  try { cb({ status: _status, pending: _pending, error: _lastErr }); } catch {}
  return () => _statusSubs.delete(cb);
}

export function getSaveStatus() {
  return { status: _status, pending: _pending, error: _lastErr };
}

// ─────────────────────────────────────────────────────────────────────────────
// COLA INTERNA
// La cola guarda "tareas" tipadas. Cada tarea tiene:
//   { id, type, payload, attempts, lastTry }
// Tipos soportados:
//   'fullSave'           → payload: { metaData } (sin productos)
//   'productMeta'        → payload: { product }  (sin imágenes)
//   'productImages'      → payload: { productId, images }
//   'deleteProduct'      → payload: { productId }
// ─────────────────────────────────────────────────────────────────────────────

let _queue = [];              // Tareas en memoria
let _processing = false;      // Lock para evitar procesos concurrentes
let _flushTimer = null;       // Timer del debounce inicial (corto)
let _retryTimer = null;       // Timer del backoff de reintentos

const DEBOUNCE_MS   = 250;    // Antes era 600ms, ahora 250ms → más responsivo
const MAX_ATTEMPTS  = 8;      // Hasta 8 intentos antes de marcar error permanente
const BACKOFF_BASE  = 1200;   // 1.2s base, sube exponencial

function _persist() {
  try {
    // Persistir solo las tareas que NO contengan imágenes pesadas
    // (las imágenes son demasiado grandes para localStorage; van a cargarse
    //  desde la cache de imageCache al reintentar)
    const slim = _queue.map(t => {
      if (t.type === 'productImages') {
        // Para imágenes, solo guardamos el ID; al reintentar buscaremos en cache
        return { ...t, payload: { productId: t.payload.productId, _imagesFromCache: true } };
      }
      return t;
    });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(slim));
  } catch (e) {
    // localStorage lleno: limpiar viejos y reintentar
    try { localStorage.removeItem(QUEUE_KEY); } catch {}
  }
}

function _hydrate() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) _queue = arr;
    }
  } catch {}
}
_hydrate();

/**
 * Encola una tarea. Coalesce: si ya hay una tarea del mismo tipo con la misma
 * clave (ej. mismo productId o "fullSave"), se reemplaza por la nueva.
 */
function _enqueue(task) {
  // Coalescencia
  const key = _taskKey(task);
  const idx = _queue.findIndex(t => _taskKey(t) === key && t.attempts === 0);
  if (idx !== -1) {
    _queue[idx] = task; // reemplaza
  } else {
    _queue.push(task);
  }
  _pending = _queue.length;
  _persist();
  _scheduleFlush();
  _emit();
}

function _taskKey(t) {
  if (t.type === 'fullSave')       return 'fullSave';
  if (t.type === 'productMeta')    return `pm:${t.payload?.product?.id}`;
  if (t.type === 'productImages')  return `pi:${t.payload?.productId}`;
  if (t.type === 'deleteProduct')  return `dp:${t.payload?.productId}`;
  if (t.type === 'ringSizeGuide')  return 'ringSizeGuide';
  return `unk:${Math.random()}`;
}

function _scheduleFlush() {
  if (_processing) return;
  if (_flushTimer) clearTimeout(_flushTimer);
  _flushTimer = setTimeout(() => { _flushTimer = null; _process(); }, DEBOUNCE_MS);
}

// ─────────────────────────────────────────────────────────────────────────────
// EJECUTORES DE TAREAS
// ─────────────────────────────────────────────────────────────────────────────

async function _runTask(task) {
  // Import dinámico para evitar ciclo de dependencias
  const fb = await import('./firebase');

  switch (task.type) {
    case 'fullSave': {
      const meta = task.payload?.metaData;
      if (!meta) return true;
      await fb.saveMetaToFirebase(meta);
      return true;
    }
    case 'productMeta': {
      const p = task.payload?.product;
      if (!p?.id) return true;
      await fb.saveProductToFirebase(p);
      return true;
    }
    case 'productImages': {
      let imgs = task.payload?.images;
      const pid = task.payload?.productId;
      if (!pid) return true;
      // Si la tarea fue rehidratada desde localStorage, no trae las imágenes:
      // buscarlas en imageCache
      if (task.payload?._imagesFromCache) {
        try {
          const ic = await import('./imageCache');
          imgs = ic.getImages(pid) || [];
        } catch { imgs = []; }
      }
      await fb.saveProductImagesToFirebase(pid, imgs || []);
      return true;
    }
    case 'deleteProduct': {
      const pid = task.payload?.productId;
      if (!pid) return true;
      await fb.deleteProductFromFirebase(pid);
      return true;
    }
    case 'ringSizeGuide': {
      const guide = task.payload?.guide;
      if (!guide) return true;
      await fb.saveRingSizeGuideToFirebase(guide);
      return true;
    }
    default:
      return true; // tarea desconocida → drop
  }
}

async function _process() {
  if (_processing) return;
  if (_queue.length === 0) {
    _status = 'idle';
    _pending = 0;
    _emit();
    return;
  }

  // Si estamos offline, marcar y esperar
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    _status = 'offline';
    _pending = _queue.length;
    _emit();
    return;
  }

  _processing = true;
  _status = 'saving';
  _pending = _queue.length;
  _emit();

  // Tomar la primera tarea
  const task = _queue[0];
  task.attempts = (task.attempts || 0) + 1;
  task.lastTry = Date.now();

  let success = false;
  let err = null;
  try {
    success = await _runTask(task);
  } catch (e) {
    err = e;
    success = false;
  }

  if (success) {
    _queue.shift();
    _pending = _queue.length;
    _persist();
    _processing = false;
    if (_queue.length === 0) {
      _status = 'saved';
      _lastErr = null;
      _emit();
      // Volver a idle tras 2 segundos
      setTimeout(() => {
        if (_status === 'saved' && _queue.length === 0) {
          _status = 'idle';
          _emit();
        }
      }, 2000);
    } else {
      // Quedan más tareas: seguir procesando
      _emit();
      setTimeout(() => _process(), 50);
    }
  } else {
    // Fallo: reintentar con backoff
    _processing = false;
    _lastErr = err?.message || 'Error al guardar';
    if (task.attempts >= MAX_ATTEMPTS) {
      // Demasiados intentos: descartar para no bloquear la cola
      console.error('[saveQueue] Tarea descartada tras', task.attempts, 'intentos:', task, err);
      _queue.shift();
      _persist();
      _pending = _queue.length;
      _status = _queue.length === 0 ? 'idle' : 'error';
      _emit();
      if (_queue.length > 0) setTimeout(() => _process(), 200);
    } else {
      _status = 'error';
      _pending = _queue.length;
      _emit();
      const delay = BACKOFF_BASE * Math.pow(1.6, task.attempts - 1); // 1.2s, 1.9s, 3s, 5s, 8s...
      if (_retryTimer) clearTimeout(_retryTimer);
      _retryTimer = setTimeout(() => { _retryTimer = null; _process(); }, Math.min(delay, 30000));
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// API PÚBLICA: las funciones que el resto del código va a usar
// ─────────────────────────────────────────────────────────────────────────────

export function enqueueFullSave(metaData) {
  _enqueue({ type: 'fullSave', payload: { metaData }, attempts: 0 });
}

export function enqueueProductMeta(product) {
  _enqueue({ type: 'productMeta', payload: { product }, attempts: 0 });
}

export function enqueueProductImages(productId, images) {
  _enqueue({ type: 'productImages', payload: { productId, images }, attempts: 0 });
}

export function enqueueDeleteProduct(productId) {
  _enqueue({ type: 'deleteProduct', payload: { productId }, attempts: 0 });
}

export function enqueueRingSizeGuide(guide) {
  _enqueue({ type: 'ringSizeGuide', payload: { guide }, attempts: 0 });
}

/**
 * Fuerza el procesamiento inmediato de la cola (sin esperar debounce).
 * Devuelve una promesa que resuelve cuando la cola está vacía o cuando se agotan reintentos.
 */
export async function flushSaveQueue(timeoutMs = 8000) {
  if (_flushTimer) { clearTimeout(_flushTimer); _flushTimer = null; }
  if (_retryTimer) { clearTimeout(_retryTimer); _retryTimer = null; }

  const start = Date.now();
  // Intentar procesar mientras haya tareas y no superemos el timeout
  while (_queue.length > 0 && (Date.now() - start) < timeoutMs) {
    if (!_processing) {
      await _process();
    } else {
      await new Promise(r => setTimeout(r, 50));
    }
  }
  return _queue.length === 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// FLUSH AUTOMÁTICO al cerrar/cambiar pestaña/recargar
// ─────────────────────────────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
  // Reanudar online
  window.addEventListener('online', () => {
    _lastErr = null;
    _scheduleFlush();
  });
  window.addEventListener('offline', () => {
    _status = 'offline';
    _emit();
  });

  // Al cerrar/recargar: SOLICITAR a Firebase que termine
  // (No podemos esperar de verdad, pero al menos disparamos las requests)
  const _onUnload = () => {
    if (_queue.length === 0) return;
    // Procesar lo que se pueda síncronamente (al menos dispararlo)
    _process();
    // Asegurar que la cola queda persistida
    _persist();
  };
  window.addEventListener('beforeunload', _onUnload);
  window.addEventListener('pagehide', _onUnload);

  // Cuando la pestaña vuelve a ser visible, intentar flush
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && _queue.length > 0) {
      _scheduleFlush();
    } else if (document.visibilityState === 'hidden' && _queue.length > 0) {
      // Al irse a background, intentar mandar lo que se pueda
      _process();
    }
  });

  // Si hay cola persistida de una sesión anterior, intentar procesarla al iniciar
  if (_queue.length > 0) {
    setTimeout(() => _scheduleFlush(), 500);
  }
}
