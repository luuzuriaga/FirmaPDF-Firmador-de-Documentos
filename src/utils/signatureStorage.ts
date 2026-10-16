import { SignatureConfig } from '../types/pdf';

/**
 * Keeps each user's own signatures (uploaded images, typed text, names)
 * in this browser only. Nothing is sent to a server, so real signatures
 * are never bundled into the published app.
 */
const STORAGE_KEY = 'firmapdf:firmas:v1';

type SavedSignature = Pick<
  SignatureConfig,
  'type' | 'dataUrl' | 'textValue' | 'fontFamily' | 'color'
> & {
  signatory: Omit<SignatureConfig['signatory'], 'date'>;
};

function readSaved(): Record<string, SavedSignature> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Overlays the signatures saved in this browser onto the presets */
export function applySavedSignatures(
  presets: SignatureConfig[]
): SignatureConfig[] {
  const saved = readSaved();
  return presets.map((sig) => {
    const s = saved[sig.id];
    if (!s) return sig;
    return {
      ...sig,
      type: s.type,
      dataUrl: s.dataUrl,
      textValue: s.textValue,
      fontFamily: s.fontFamily,
      color: s.color,
      // Keep today's date: only identity fields are remembered
      signatory: { ...sig.signatory, ...s.signatory },
    };
  });
}

/** Returns false when the browser refused to store them (e.g. quota exceeded) */
export function saveSignatures(signatures: SignatureConfig[]): boolean {
  const data: Record<string, SavedSignature> = {};
  for (const sig of signatures) {
    const { date: _date, ...signatory } = sig.signatory;
    data[sig.id] = {
      type: sig.type,
      dataUrl: sig.dataUrl,
      textValue: sig.textValue,
      fontFamily: sig.fontFamily,
      color: sig.color,
      signatory,
    };
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
