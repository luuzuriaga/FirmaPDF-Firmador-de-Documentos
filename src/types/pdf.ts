export interface SignatoryInfo {
  name: string;
  role: string;
  date: string;
  showDetails: boolean;
}

export type SignatureType = 'draw' | 'type' | 'upload';

export type ObraId = string;

export interface Obra {
  id: ObraId;
  name: string;
}

/** The obras offered in the app, in the order they are listed */
export const OBRAS: Obra[] = [
  { id: 'uchumarca', name: 'Uchumarca' },
  { id: 'tayamarca', name: 'Tayamarca' },
  { id: 'huancabamba', name: 'Huancabamba' },
  { id: 'valcer', name: 'Valcer' },
];

export interface SignatureConfig {
  id: number;
  obra: ObraId;
  title: string;
  color: string; // stroke/ink color (#0f172a, #1d4ed8, etc.)
  themeColor: string; // UI accent
  type: SignatureType;
  dataUrl: string | null; // transparent PNG of signature
  textValue: string; // for typed signature
  fontFamily: string; // cursive font
  signatory: SignatoryInfo;
  // Position on PDF
  pageNumber: number; // 1-indexed
  xPercent: number; // 0 to 100 (% of page width)
  yPercent: number; // 0 to 100 (% of page height from top)
  widthPercent: number; // e.g. 25% of page width
  aspectRatio: number; // width / height
  // Local image in public/firmas/ loaded automatically when present
  imagePath?: string;
}

export interface PdfDocumentState {
  file: File | null;
  name: string;
  bytes: Uint8Array | null;
  numPages: number;
  currentPage: number;
  pageDimensions: { width: number; height: number }[];
}
