import { SignatureConfig } from '../types/pdf';

/**
 * Keeps each user's own signatures (uploaded images, typed text, names,
 * and the signatures added or removed per obra) in this browser only.
 * Nothing is sent to a server, so real signatures are never bundled into
 * the published app.
 *
 * Uses IndexedDB: scanned seals easily exceed localStorage's ~5 MB quota
 */
const DB_NAME = 'firmapdf';
const STORE = 'kv';
const KEY = 'firmas';
/** First version kept the preset signatures' content in localStorage, by id */
const LEGACY_KEY = 'firmapdf:firmas:v1';

/** Placeholder signatures from earlier versions, replaced by real ones */
const TEST_SIGNATURES = ['Miguel A. Rojas', 'Patricia C. Huamán'];

type SavedSignatory =Omit<SignatureConfig['signatory'], 'date'>;
type SavedSignature = Omit<SignatureConfig, 'signatory'> & {
  signatory: SavedSignatory;
};
type LegacySignature = Pick<
  SignatureConfig,
  'type' | 'dataUrl' | 'textValue' | 'fontFamily' | 'color'
> & { signatory: SavedSignatory };

// Opened once and reused, so a save started while the page unloads begins
// its transaction right away instead of waiting for a new connection
let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }).catch((err) => {
    dbPromise = null;
    throw err;
  });
  return dbPromise;
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE).objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

const imageKey = (id: number) => `img:${id}`;

/**
 * Image of each signature as last written, so a save only rewrites the
 * images that changed: the rest of the list is a few KB and is saved on
 * every change (even while dragging) without slowing the page down
 */
const savedImages = new Map<number, string | null>();

/** Overlays the legacy localStorage content onto the presets */
function applyLegacy(presets: SignatureConfig[]): SignatureConfig[] {
  let saved: Record<string, LegacySignature> = {};
  try {
    saved = JSON.parse(localStorage.getItem(LEGACY_KEY) ?? '{}');
  } catch {
    // Unavailable or corrupt: start from the presets
  }
  return presets.map((sig) => {
    const s = saved[sig.id];
    if (!s || TEST_SIGNATURES.includes(s.textValue)) return sig;
    return {
      ...sig,
      type: s.type,
      dataUrl: s.dataUrl,
      textValue: s.textValue,
      fontFamily: s.fontFamily,
      color: s.color,
      signatory: { ...sig.signatory, ...s.signatory },
    };
  });
}

/** Signatures saved in this browser, or the presets when there are none */
export async function loadSignatures(
  presets: SignatureConfig[]
): Promise<SignatureConfig[]> {
  let saved: SavedSignature[] | undefined;
  try {
    saved = await idbGet<SavedSignature[]>(KEY);
    if (Array.isArray(saved)) {
      for (const s of saved) {
        // Older saves kept the image inline; they are moved out on next save
        if (s.dataUrl) continue;
        const img = await idbGet<string>(imageKey(s.id));
        s.dataUrl = img ?? null;
        savedImages.set(s.id, s.dataUrl);
      }
    }
  } catch {
    // IndexedDB unavailable (e.g. private mode): fall back below
    saved = undefined;
  }
  if (!Array.isArray(saved)) return applyLegacy(presets);
  // Always today's date: only identity fields are remembered
  const today = new Date().toISOString().split('T')[0];
  return saved.map((s) => {
    const preset = presets.find((p) => p.id === s.id && p.obra === s.obra);
    // Replace the typed test signatures the app used to ship with
    if (preset && TEST_SIGNATURES.includes(s.textValue)) return preset;
    return {
      ...s,
      // Keep the local image path in sync with the presets
      imagePath: preset ? preset.imagePath : s.imagePath,
      signatory: { ...s.signatory, date: today },
    };
  });
}

/** Resolves false when the browser refused to store them */
export async function saveSignatures(
  signatures: SignatureConfig[]
): Promise<boolean> {
  const list: SavedSignature[] = signatures.map((sig) => {
    const { date: _date, ...signatory } = sig.signatory;
    return { ...sig, dataUrl: null, signatory };
  });
  const changed = signatures.filter(
    (sig) => savedImages.get(sig.id) !== sig.dataUrl
  );
  const removed = [...savedImages.keys()].filter(
    (id) => !signatures.some((sig) => sig.id === id)
  );
  // Recorded before writing so overlapping saves don't repeat the images
  changed.forEach((sig) => savedImages.set(sig.id, sig.dataUrl));
  removed.forEach((id) => savedImages.delete(id));

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      store.put(list, KEY);
      for (const sig of changed) {
        if (sig.dataUrl) store.put(sig.dataUrl, imageKey(sig.id));
        else store.delete(imageKey(sig.id));
      }
      removed.forEach((id) => store.delete(imageKey(id)));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch {
    // Write them all again next time
    savedImages.clear();
    return false;
  }
  try {
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // Nothing to clean up
  }
  return true;
}
