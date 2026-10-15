export interface SignatoryInfo {
  name: string;
  role: string;
  idNumber: string;
  date: string;
  showDetails: boolean;
}

export type SignatureType = 'draw' | 'type' | 'upload';

export interface SignatureConfig {
  id: 1 | 2 | 3;
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
}

export interface PdfDocumentState {
  file: File | null;
  name: string;
  bytes: Uint8Array | null;
  numPages: number;
  currentPage: number;
  pageDimensions: { width: number; height: number }[];
}
