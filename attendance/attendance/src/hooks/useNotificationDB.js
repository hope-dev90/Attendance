/**
 * IndexedDB wrapper for notification history.
 * DB: staffnet_db  |  Store: notifications
 */

const DB_NAME    = 'staffnet_db';
const DB_VERSION = 1;
const STORE      = 'notifications';

const openDB = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('tag',       'tag',       { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('read',      'read',      { unique: false });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });

export const saveNotification = async (notif) => {
  const db    = await openDB();
  const tx    = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  store.add({ ...notif, timestamp: Date.now(), read: false });
  return new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });
};

export const getNotifications = async (limit = 50) => {
  const db    = await openDB();
  const tx    = db.transaction(STORE, 'readonly');
  const store = tx.objectStore(STORE);
  const idx   = store.index('timestamp');
  const req   = idx.openCursor(null, 'prev');
  const items = [];
  return new Promise((resolve) => {
    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor && items.length < limit) {
        items.push(cursor.value);
        cursor.continue();
      } else {
        resolve(items);
      }
    };
    req.onerror = () => resolve([]);
  });
};

export const markAllRead = async () => {
  const db    = await openDB();
  const tx    = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  const req   = store.openCursor();
  req.onsuccess = (e) => {
    const cursor = e.target.result;
    if (cursor) {
      cursor.update({ ...cursor.value, read: true });
      cursor.continue();
    }
  };
  return new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });
};

export const clearNotifications = async () => {
  const db    = await openDB();
  const tx    = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).clear();
  return new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });
};

export const getUnreadCount = async () => {
  const db    = await openDB();
  const tx    = db.transaction(STORE, 'readonly');
  const store = tx.objectStore(STORE);
  const idx   = store.index('read');
  const req   = idx.count(IDBKeyRange.only(false));
  return new Promise((resolve) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => resolve(0);
  });
};
