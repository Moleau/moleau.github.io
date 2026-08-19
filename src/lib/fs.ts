// Thin wrapper around the File System Access API with an IndexedDB-backed
// persistence of the directory handle, plus a graceful fallback to download
// when the API is unavailable (Firefox/Safari or non-secure contexts).

const DB_NAME = 'aifall-blog';
const STORE = 'handles';
const KEY = 'project-root';

const isSupported = typeof (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker === 'function';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getStoredHandle(): Promise<FileSystemDirectoryHandle | null> {
  if (!isSupported) return null;
  try {
    const db = await openDb();
    return await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const r = tx.get(KEY);
      r.onsuccess = () => resolve(r.result || null);
      r.onerror = () => reject(r.error);
    });
  } catch {
    return null;
  }
}

export async function storeHandle(h: FileSystemDirectoryHandle): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(h, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function pickProjectRoot(): Promise<FileSystemDirectoryHandle | null> {
  if (!isSupported) return null;
  try {
    const handle = await (window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker();
    await storeHandle(handle);
    return handle;
  } catch {
    return null;
  }
}

export async function verifyPermission(h: FileSystemDirectoryHandle, write = true): Promise<boolean> {
  const anyH = h as unknown as { requestPermission?: (opts: unknown) => Promise<PermissionState> };
  if (!anyH.requestPermission) return true;
  const opts = { mode: write ? 'readwrite' : 'read' };
  const queryAny = (anyH as unknown as { queryPermission?: (opts: unknown) => Promise<PermissionState> }).queryPermission;
  if (queryAny && (await queryAny(opts)) === 'granted') return true;
  if ((await anyH.requestPermission!(opts)) === 'granted') return true;
  return false;
}

async function getRoot(): Promise<FileSystemDirectoryHandle | null> {
  const h = await getStoredHandle();
  if (!h) return null;
  if (!(await verifyPermission(h, true))) return null;
  return h;
}

async function getSubdir(name: string): Promise<FileSystemDirectoryHandle | null> {
  const root = await getRoot();
  if (!root) return null;
  try {
    return await root.getDirectoryHandle(name, { create: true });
  } catch {
    return null;
  }
}

export async function readFile(relPath: string): Promise<string | null> {
  const root = await getRoot();
  if (!root) return null;
  try {
    const parts = relPath.split('/');
    let dir = root;
    for (let i = 0; i < parts.length - 1; i++) {
      dir = await dir.getDirectoryHandle(parts[i]);
    }
    const fh = await dir.getFileHandle(parts[parts.length - 1]);
    const file = await fh.getFile();
    return await file.text();
  } catch {
    return null;
  }
}

export async function writeFile(relPath: string, content: string): Promise<boolean> {
  const root = await getRoot();
  if (!root) {
    downloadFile(relPath.split('/').pop() || 'file.txt', content);
    return false;
  }
  try {
    const parts = relPath.split('/');
    let dir = root;
    for (let i = 0; i < parts.length - 1; i++) {
      dir = await dir.getDirectoryHandle(parts[i], { create: true });
    }
    const fh = await dir.getFileHandle(parts[parts.length - 1], { create: true });
    const writable = await (fh as unknown as { createWritable: () => Promise<FileSystemWritableFileStream> }).createWritable();
    await writable.write(content);
    await writable.close();
    return true;
  } catch (e) {
    downloadFile(relPath.split('/').pop() || 'file.txt', content);
    return false;
  }
}

export async function listFiles(dirRel: string): Promise<string[]> {
  const dir = await getSubdir(dirRel);
  if (!dir) return [];
  const names: string[] = [];
  // @ts-expect-error values() exists on directory handles
  for await (const entry of dir.values()) {
    if (entry.kind === 'file') names.push(entry.name);
  }
  return names.sort();
}

export function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function isFsSupported(): boolean {
  return isSupported;
}
