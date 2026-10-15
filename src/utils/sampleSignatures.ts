import { SignatureConfig } from '../types/pdf';

/**
 * Creates 3 realistic pre-generated signatures for immediate instant testing
 */
export function getPresetSignatures(): SignatureConfig[] {
  const today = new Date().toISOString().split('T')[0];

  return [
    {
      id: 1,
      title: 'Firma 1 · Solicitante',
      color: '#1d4ed8', // Royal blue ink
      themeColor: 'blue',
      type: 'type',
      dataUrl: null,
      textValue: 'Carlos M. Arismendi',
      fontFamily: 'Dancing Script',
      signatory: {
        name: 'Lic. Carlos M. Arismendi',
        role: 'Gerente General / Solicitante',
        idNumber: 'ID-0928144-B',
        date: today,
        showDetails: true,
      },
      pageNumber: 1,
      xPercent: 7,
      yPercent: 77,
      widthPercent: 26,
      aspectRatio: 2.0,
    },
    {
      id: 2,
      title: 'Firma 2 · Proveedor',
      color: '#0f172a', // Slate black ink
      themeColor: 'indigo',
      type: 'type',
      dataUrl: null,
      textValue: 'Valeria R. Santillana',
      fontFamily: 'Caveat',
      signatory: {
        name: 'Ing. Valeria Santillana',
        role: 'Representante Legal / Proveedor',
        idNumber: 'ID-7819230-A',
        date: today,
        showDetails: true,
      },
      pageNumber: 1,
      xPercent: 37,
      yPercent: 77,
      widthPercent: 26,
      aspectRatio: 2.0,
    },
    {
      id: 3,
      title: 'Firma 3 · Supervisor',
      color: '#0369a1', // Sky/ocean blue ink
      themeColor: 'emerald',
      type: 'type',
      dataUrl: null,
      textValue: 'Dr. Fernando L. Vega',
      fontFamily: 'Great Vibes',
      signatory: {
        name: 'Dr. Fernando L. Vega',
        role: 'Supervisor Técnico / Testigo',
        idNumber: 'ID-4389012-C',
        date: today,
        showDetails: true,
      },
      pageNumber: 1,
      xPercent: 67,
      yPercent: 77,
      widthPercent: 26,
      aspectRatio: 2.0,
    },
  ];
}
