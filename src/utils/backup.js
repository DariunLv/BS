// src/utils/backup.js
// ─────────────────────────────────────────────────────────────────────────────
// SISTEMA DE RESPALDO MULTICAPA (para que NUNCA se pierdan las cuentas)
//
//  Capa 1: Auto-backup en Firebase → colección `backups/` con fecha.
//          Cada vez que hay ventas, se guarda un snapshot con timestamp.
//          Conserva los últimos 30 snapshots (1 por día como mínimo).
//
//  Capa 2: Backup local con fecha en localStorage (`benito_backup_cuentas`).
//          Sobrevive recargas. Red de seguridad si Firebase falla.
//
//  Capa 3: Exportar a archivo (.json) descargable → copia física en la PC.
//
//  Capa 4: Exportar a PDF legible (ventas/gastos/pagos del periodo).
//
//  Capa 5: Importar desde .json → restaurar TODO si algo sale mal.
//
//  Recordatorio mensual: avisa al admin que exporte su respaldo.
// ─────────────────────────────────────────────────────────────────────────────
import {
  getFirestore, doc, setDoc, getDoc, getDocs,
  collection, deleteDoc, query, orderBy, limit,
} from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyCWAs5LOcXvGkJ9QKz9WfHXBhkp2OAntWA",
  authDomain: "benito-store.firebaseapp.com",
  projectId: "benito-store",
  storageBucket: "benito-store.firebasestorage.app",
  messagingSenderId: "133305981902",
  appId: "1:133305981902:web:48bb76991a74295d42e99f"
};
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

const BACKUP_COL = collection(db, 'backups');
const LOCAL_BACKUP_KEY = 'benito_backup_cuentas';
const LAST_EXPORT_KEY  = 'benito_last_export_month';
const MAX_BACKUPS = 30; // conservar últimos 30 snapshots

/** Extrae solo los datos de cuentas (ligero, sin fotos) */
function extractCuentas(storeData) {
  return {
    sales:           storeData.sales           || [],
    investments:     storeData.investments     || [],
    pendingSales:    storeData.pendingSales     || [],
    pagosAccionista: storeData.pagosAccionista  || [],
    shareholders:    storeData.shareholders     || [],
    frecuentClients: (storeData.frecuentClients || []).map(({ foto, ...c }) => c),
  };
}

function isEmpty(cuentas) {
  return (cuentas.sales?.length || 0) === 0
    && (cuentas.investments?.length || 0) === 0
    && (cuentas.pendingSales?.length || 0) === 0
    && (cuentas.pagosAccionista?.length || 0) === 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// CAPA 1 + 2: Auto-backup (Firebase + local). Llamar tras cada cambio importante.
// ─────────────────────────────────────────────────────────────────────────────
export async function autoBackup(storeData) {
  try {
    const cuentas = extractCuentas(storeData);
    // PROTECCIÓN: nunca respaldar vacío (evita pisar un backup bueno con uno vacío)
    if (isEmpty(cuentas)) {
      console.warn('[autoBackup] cuentas vacías, no se respalda (protección)');
      return { ok: false, reason: 'empty' };
    }

    const now = new Date();
    const stamp = {
      fecha: now.toISOString(),
      fechaLegible: now.toLocaleString('es-PE'),
      resumen: {
        ventas: cuentas.sales.length,
        gastos: cuentas.investments.length,
        pendientes: cuentas.pendingSales.length,
        pagos: cuentas.pagosAccionista.length,
      },
      ...cuentas,
    };

    // Capa 2: local primero (instantáneo, sobrevive aunque Firebase falle)
    try { localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(stamp)); } catch {}

    // Capa 1: Firebase, con id = fecha del día (1 backup por día, se sobrescribe)
    const dayId = now.toISOString().slice(0, 10); // YYYY-MM-DD
    await setDoc(doc(db, 'backups', dayId), stamp);

    // Limpiar backups viejos (conservar últimos MAX_BACKUPS)
    await pruneOldBackups();

    return { ok: true, dayId };
  } catch (e) {
    console.error('[autoBackup] error:', e);
    return { ok: false, reason: e?.message };
  }
}

async function pruneOldBackups() {
  try {
    const snap = await getDocs(BACKUP_COL);
    const ids = [];
    snap.forEach(d => ids.push(d.id));
    if (ids.length <= MAX_BACKUPS) return;
    // Ordenar por id (fecha YYYY-MM-DD) ascendente y borrar los más viejos
    ids.sort();
    const toDelete = ids.slice(0, ids.length - MAX_BACKUPS);
    await Promise.all(toDelete.map(id => deleteDoc(doc(db, 'backups', id)).catch(() => {})));
  } catch (e) {
    console.warn('[pruneOldBackups] no crítico:', e?.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Listar backups disponibles en Firebase
// ─────────────────────────────────────────────────────────────────────────────
export async function listBackups() {
  try {
    const snap = await getDocs(BACKUP_COL);
    const list = [];
    snap.forEach(d => {
      const data = d.data();
      list.push({
        id: d.id,
        fecha: data.fechaLegible || data.fecha || d.id,
        resumen: data.resumen || {},
      });
    });
    list.sort((a, b) => b.id.localeCompare(a.id)); // más reciente primero
    return list;
  } catch (e) {
    console.error('[listBackups] error:', e);
    return [];
  }
}

/** Restaurar las cuentas desde un backup de Firebase (devuelve los datos) */
export async function getBackup(backupId) {
  try {
    const snap = await getDoc(doc(db, 'backups', backupId));
    if (!snap.exists()) return null;
    return snap.data();
  } catch (e) {
    console.error('[getBackup] error:', e);
    return null;
  }
}

/** Obtener el backup local más reciente */
export function getLocalBackup() {
  try {
    const raw = localStorage.getItem(LOCAL_BACKUP_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CAPA 3: Exportar a archivo .json descargable
// ─────────────────────────────────────────────────────────────────────────────
export function exportBackupJSON(storeData) {
  const cuentas = extractCuentas(storeData);
  const now = new Date();
  const payload = {
    _tipo: 'benito_backup_cuentas',
    _version: 1,
    fechaExport: now.toISOString(),
    fechaLegible: now.toLocaleString('es-PE'),
    ...cuentas,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const stamp = now.toISOString().slice(0, 10);
  link.download = `respaldo-benito-${stamp}.json`;
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  // Marcar que ya exportó este mes
  try { localStorage.setItem(LAST_EXPORT_KEY, now.toISOString().slice(0, 7)); } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// CAPA 5: Importar desde .json (devuelve las cuentas para que el caller las aplique)
// ─────────────────────────────────────────────────────────────────────────────
export function parseBackupFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data._tipo !== 'benito_backup_cuentas') {
          // Aceptar también formato directo (sales/investments...)
          if (!data.sales && !data.investments) {
            reject(new Error('El archivo no es un respaldo válido de Benito Store.'));
            return;
          }
        }
        resolve({
          sales:           data.sales           || [],
          investments:     data.investments     || [],
          pendingSales:    data.pendingSales     || [],
          pagosAccionista: data.pagosAccionista  || [],
          shareholders:    data.shareholders     || [],
          frecuentClients: data.frecuentClients  || [],
          fechaLegible:    data.fechaLegible     || '',
        });
      } catch (err) {
        reject(new Error('No se pudo leer el archivo. ¿Está dañado?'));
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo.'));
    reader.readAsText(file);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Recordatorio mensual: ¿ya exportó este mes?
// ─────────────────────────────────────────────────────────────────────────────
export function needsMonthlyExport() {
  try {
    const last = localStorage.getItem(LAST_EXPORT_KEY); // 'YYYY-MM'
    const thisMonth = new Date().toISOString().slice(0, 7);
    return last !== thisMonth;
  } catch {
    return true;
  }
}