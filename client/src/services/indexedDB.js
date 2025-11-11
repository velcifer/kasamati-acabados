// Helper para persistencia de attachments usando IndexedDB con fallback a localStorage.
const DB_NAME = 'ksamti_attachments_db';
const DB_VERSION = 1;
const STORE_NAME = 'attachments';

const LS_PREFIX = 'ksamti_attachments_';

function supportsIndexedDB() {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

function openDB() {
  return new Promise((resolve, reject) => {
    if (!supportsIndexedDB()) return reject(new Error('IndexedDB no disponible'));
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('projectNumber', 'projectNumber', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = (err) => reject(err);
  });
}

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = (e) => reject(e);
  reader.readAsDataURL(file);
});

const dataURLtoBlob = (dataurl) => {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new Blob([u8arr], { type: mime });
};

export async function saveAttachments(projectNumber, items) {
  if (supportsIndexedDB()) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      try {
        items.forEach(item => {
          const toStore = {
            id: item.id,
            projectNumber,
            name: item.name,
            size: item.size,
            type: item.type,
            file: item.file, // Blob
            uploaded: item.uploaded || false,
            savedAt: item.savedAt || new Date().toISOString()
          };
          store.put(toStore);
        });
      } catch (err) {
        reject(err);
      }
      tx.oncomplete = () => resolve(true);
      tx.onerror = (e) => reject(e.target.error);
    });
  }

  // fallback a localStorage: convertir a dataURL y guardar
  const key = `${LS_PREFIX}${projectNumber}`;
  const payload = await Promise.all(items.map(async (item) => ({
    id: item.id,
    name: item.name,
    size: item.size,
    type: item.type,
    dataUrl: await fileToDataUrl(item.file),
    uploaded: item.uploaded || false,
    savedAt: item.savedAt || new Date().toISOString()
  })));
  localStorage.setItem(key, JSON.stringify(payload));
  return true;
}

export async function getAttachments(projectNumber) {
  if (supportsIndexedDB()) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('projectNumber');
      const req = index.getAll(IDBKeyRange.only(projectNumber));
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  const key = `${LS_PREFIX}${projectNumber}`;
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return parsed.map(p => ({
      ...p,
      file: dataURLtoBlob(p.dataUrl)
    }));
  } catch (e) {
    return [];
  }
}

export async function deleteAttachmentById(id) {
  if (supportsIndexedDB()) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = (e) => reject(e.target.error);
    });
  }

  // fallback: eliminar de localStorage iterando keys
  const keys = Object.keys(localStorage).filter(k => k.startsWith(LS_PREFIX));
  for (const key of keys) {
    try {
      const arr = JSON.parse(localStorage.getItem(key) || '[]');
      const filtered = arr.filter(a => a.id !== id);
      localStorage.setItem(key, JSON.stringify(filtered));
    } catch (e) { /* ignore */ }
  }
  return true;
}

export async function markAttachmentUploaded(id) {
  if (supportsIndexedDB()) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        const val = req.result;
        if (!val) return resolve(false);
        val.uploaded = true;
        store.put(val);
        tx.oncomplete = () => resolve(true);
      };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  // fallback localStorage: buscar y marcar
  const keys = Object.keys(localStorage).filter(k => k.startsWith(LS_PREFIX));
  for (const key of keys) {
    try {
      const arr = JSON.parse(localStorage.getItem(key) || '[]');
      let changed = false;
      const mapped = arr.map(a => {
        if (a.id === id) { changed = true; return { ...a, uploaded: true }; }
        return a;
      });
      if (changed) localStorage.setItem(key, JSON.stringify(mapped));
    } catch (e) { /* ignore */ }
  }
  return true;
}

export default { saveAttachments, getAttachments, deleteAttachmentById, markAttachmentUploaded };
