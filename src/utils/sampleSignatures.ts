import { ObraId, SignatureConfig } from '../types/pdf';

/**
 * Default slots for the 2 signatures of an obra, fitted to the ORDEN DE COMPRA
 * template: left of the totals box, just below "CONSIDERACIONES"
 */
export const GROUP_X_POSITIONS = [4, 33];
export const GROUP_Y_PERCENT = 85;

/**
 * Creates the pre-generated signatures, grouped by obra:
 * 2 signatures each for Tayamarca, Uchumarca, Huancabamba and Valcer
 */
export function getPresetSignatures(): SignatureConfig[] {
  const today = new Date().toISOString().split('T')[0];

  const base = {
    type: 'type' as const,
    dataUrl: null,
    pageNumber: 1,
    yPercent: GROUP_Y_PERCENT,
    widthPercent: 26,
    aspectRatio: 2.0,
  };

  return [
    {
      ...base,
      id: 1,
      obra: 'tayamarca' as ObraId,
      title: 'Tayamarca · Firma 1',
      color: '#1d4ed8', // Royal blue ink
      themeColor: 'blue',
      textValue: 'Carlos M. Arismendi',
      fontFamily: 'Dancing Script',
      signatory: {
        name: 'Ing. Carlos M. Arismendi',
        role: 'Residente de Obra · Tayamarca',
        date: today,
        showDetails: true,
      },
      xPercent: GROUP_X_POSITIONS[0],
    },
    {
      ...base,
      id: 2,
      obra: 'tayamarca' as ObraId,
      title: 'Tayamarca · Firma 2',
      color: '#0f172a', // Slate black ink
      themeColor: 'indigo',
      textValue: 'Valeria R. Santillana',
      fontFamily: 'Caveat',
      signatory: {
        name: 'Ing. Valeria Santillana',
        role: 'Supervisor de Obra · Tayamarca',
        date: today,
        showDetails: true,
      },
      xPercent: GROUP_X_POSITIONS[1],
    },
    {
      ...base,
      id: 3,
      obra: 'uchumarca' as ObraId,
      title: 'Uchumarca · Firma 1',
      color: '#0369a1', // Sky/ocean blue ink
      themeColor: 'emerald',
      textValue: 'Fernando L. Vega',
      fontFamily: 'Great Vibes',
      signatory: {
        name: 'Ing. Fernando L. Vega',
        role: 'Residente de Obra · Uchumarca',
        date: today,
        showDetails: true,
      },
      xPercent: GROUP_X_POSITIONS[0],
    },
    {
      ...base,
      id: 4,
      obra: 'uchumarca' as ObraId,
      title: 'Uchumarca · Firma 2',
      color: '#0f172a', // Slate black ink
      themeColor: 'amber',
      textValue: 'Rosa E. Quispe',
      fontFamily: 'Dancing Script',
      signatory: {
        name: 'Ing. Rosa E. Quispe',
        role: 'Supervisor de Obra · Uchumarca',
        date: today,
        showDetails: true,
      },
      xPercent: GROUP_X_POSITIONS[1],
    },
    {
      ...base,
      id: 5,
      obra: 'huancabamba' as ObraId,
      title: 'Huancabamba · Firma 1',
      color: '#1d4ed8', // Royal blue ink
      themeColor: 'rose',
      textValue: 'Jorge A. Mendoza',
      fontFamily: 'Caveat',
      signatory: {
        name: 'Ing. Jorge A. Mendoza',
        role: 'Residente de Obra · Huancabamba',
        date: today,
        showDetails: true,
      },
      xPercent: GROUP_X_POSITIONS[0],
    },
    {
      ...base,
      id: 6,
      obra: 'huancabamba' as ObraId,
      title: 'Huancabamba · Firma 2',
      color: '#0f172a', // Slate black ink
      themeColor: 'violet',
      textValue: 'Lucía M. Torres',
      fontFamily: 'Great Vibes',
      signatory: {
        name: 'Ing. Lucía M. Torres',
        role: 'Supervisor de Obra · Huancabamba',
        date: today,
        showDetails: true,
      },
      xPercent: GROUP_X_POSITIONS[1],
    },
    {
      ...base,
      id: 7,
      obra: 'valcer' as ObraId,
      title: 'Valcer · Firma 1',
      color: '#0369a1', // Sky/ocean blue ink
      themeColor: 'cyan',
      textValue: 'Miguel A. Rojas',
      fontFamily: 'Dancing Script',
      signatory: {
        name: 'Ing. Miguel A. Rojas',
        role: 'Residente de Obra · Valcer',
        date: today,
        showDetails: true,
      },
      xPercent: GROUP_X_POSITIONS[0],
    },
    {
      ...base,
      id: 8,
      obra: 'valcer' as ObraId,
      title: 'Valcer · Firma 2',
      color: '#0f172a', // Slate black ink
      themeColor: 'fuchsia',
      textValue: 'Patricia C. Huamán',
      fontFamily: 'Caveat',
      signatory: {
        name: 'Ing. Patricia C. Huamán',
        role: 'Supervisor de Obra · Valcer',
        date: today,
        showDetails: true,
      },
      xPercent: GROUP_X_POSITIONS[1],
    },
  ];
}
