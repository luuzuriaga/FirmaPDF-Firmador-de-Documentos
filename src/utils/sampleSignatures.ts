import { ObraId, SignatureConfig } from '../types/pdf';

/**
 * Default placement of an obra's signatures, fitted to the ORDEN DE COMPRA
 * template: just below "CONSIDERACIONES" and left of the totals box
 * (which starts at ~65% of the page width)
 */
export const GROUP_Y_PERCENT = 85;

export function groupSlot(
  index: number,
  groupSize: number
): { xPercent: number; widthPercent: number } {
  if (groupSize >= 3) {
    const xs = [1, 22, 43];
    return { xPercent: xs[index] ?? xs[0], widthPercent: 21 };
  }
  const xs = [4, 33];
  return { xPercent: xs[index] ?? xs[0], widthPercent: 26 };
}

interface SignatureSlot {
  obra: ObraId;
  title: string;
  name: string;
  role: string;
  /** false when the uploaded image already carries the seal with name and role */
  showDetails: boolean;
  /** typed placeholder; empty means the signature image must be uploaded */
  textValue?: string;
  fontFamily?: string;
  color?: string;
  /** image in public/firmas/ (local only, git-ignored), loaded when present */
  imagePath?: string;
}

/**
 * Signature slots per obra. Real signature images live in public/firmas/,
 * which is excluded from git and Vercel: they load automatically only on
 * the local copy. Elsewhere each user uploads them once via "Editar" and
 * they are kept in that browser (see signatureStorage.ts)
 */
const SLOTS: SignatureSlot[] = [
  {
    obra: 'tayamarca',
    title: 'Tayamarca · Representante Común',
    name: 'José Luis Bonilla Chávez',
    role: 'Representante Común · Consorcio Vial Tayamarca',
    showDetails: false,
    imagePath: '/firmas/tayamarca/firma_consorcio_tayamarca_HD.png',
  },
  {
    obra: 'uchumarca',
    title: 'Uchumarca · Administrador de Obra',
    name: 'CPC. Edgar Domínguez Solís',
    role: 'Administrador de Obra',
    showDetails: false,
    imagePath: '/firmas/uchumarca/sello_firma_administrador_obra.png',
  },
  {
    obra: 'uchumarca',
    title: 'Uchumarca · Jefe de Logística',
    name: 'Lucas Valerio Josué D.',
    role: 'Jefe Logístico',
    showDetails: false,
    imagePath: '/firmas/uchumarca/sello_firma_jefe_logistica.png',
  },
  {
    obra: 'uchumarca',
    title: 'Uchumarca · Residente de Obra',
    name: '',
    role: 'Residente de Obra',
    showDetails: false,
    imagePath: '/firmas/uchumarca/sello_firma_residente_obra.png',
  },
  {
    obra: 'huancabamba',
    title: 'Huancabamba · Administrador de Obra',
    name: '',
    role: 'Administrador de Obra',
    showDetails: true,
    imagePath: '/firmas/huancabamba/firma_administrador_obra.png',
  },
  {
    obra: 'huancabamba',
    title: 'Huancabamba · Residente de Obra',
    name: '',
    role: 'Residente de Obra',
    showDetails: true,
    imagePath: '/firmas/huancabamba/firma_residente_obra.png',
  },
  {
    obra: 'valcer',
    title: 'Valcer · Firma',
    name: 'Ing. Miguel A. Rojas',
    role: 'Residente de Obra · Valcer',
    showDetails: true,
    textValue: 'Miguel A. Rojas',
    fontFamily: 'Dancing Script',
    color: '#0369a1',
  },
];

export function getPresetSignatures(): SignatureConfig[] {
  const today = new Date().toISOString().split('T')[0];

  return SLOTS.map((slot, idx) => {
    const group = SLOTS.filter((s) => s.obra === slot.obra);
    const { xPercent, widthPercent } = groupSlot(group.indexOf(slot), group.length);
    return {
      id: idx + 1,
      obra: slot.obra,
      title: slot.title,
      color: slot.color ?? '#0f172a',
      themeColor: 'slate',
      type: slot.textValue ? 'type' : 'upload',
      dataUrl: null,
      textValue: slot.textValue ?? '',
      fontFamily: slot.fontFamily ?? 'Dancing Script',
      signatory: {
        name: slot.name,
        role: slot.role,
        date: today,
        showDetails: slot.showDetails,
      },
      pageNumber: 1,
      xPercent,
      yPercent: GROUP_Y_PERCENT,
      widthPercent,
      aspectRatio: 2.0,
      imagePath: slot.imagePath,
    };
  });
}

/** True when the signature has something to stamp (image or typed text) */
export function hasSignatureContent(sig: SignatureConfig): boolean {
  return !!sig.dataUrl || !!sig.textValue;
}
