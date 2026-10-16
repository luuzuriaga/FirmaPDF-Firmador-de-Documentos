/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Upload,
  Download,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  FolderOpen,
  Info,
  HelpCircle,
  FileSignature,
} from 'lucide-react';
import { ObraId, OBRAS, SignatureConfig } from './types/pdf';
import {
  getPresetSignatures,
  groupSlot,
  GROUP_Y_PERCENT,
  hasSignatureContent,
} from './utils/sampleSignatures';
import {
  applySavedSignatures,
  saveSignatures,
} from './utils/signatureStorage';
import { loadImageAsDataUrl } from './utils/imageUtils';
import {
  getPdfInfo,
  stampSignaturesToPdf,
  triggerFileDownload,
} from './utils/pdfService';
import { UploadDropzone } from './components/UploadDropzone';
import { PdfPlacementCanvas } from './components/PdfPlacementCanvas';
import { SignatureSidebar } from './components/SignatureSidebar';
import { SignatureModal } from './components/SignatureModal';

export default function App() {
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pdfName, setPdfName] = useState<string>('');
  const [numPages, setNumPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadSuccessNotice, setDownloadSuccessNotice] = useState<boolean>(false);

  // All signatures, grouped by obra, with the ones saved in this browser
  const [signatures, setSignatures] = useState<SignatureConfig[]>(() =>
    applySavedSignatures(getPresetSignatures())
  );

  // Remember uploaded signatures in this browser only
  const [storageFailed, setStorageFailed] = useState(false);
  useEffect(() => {
    setStorageFailed(!saveSignatures(signatures));
  }, [signatures]);

  // Load local signature images (public/firmas/) into empty slots; on the
  // published app they are absent and the slots wait for a manual upload
  useEffect(() => {
    signatures
      .filter((s) => s.imagePath && !s.dataUrl && !s.textValue)
      .forEach((s) => {
        loadImageAsDataUrl(s.imagePath!)
          .then((dataUrl) =>
            setSignatures((prev) =>
              prev.map((p) =>
                p.id === s.id && !p.dataUrl
                  ? { ...p, type: 'upload', dataUrl }
                  : p
              )
            )
          )
          .catch(() => {
            // Image not present (e.g. on the published app): keep it empty
          });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Active obra: only its signatures are shown and stamped
  const [activeObra, setActiveObra] = useState<ObraId>('tayamarca');
  const obraSignatures = signatures.filter((s) => s.obra === activeObra);
  const activeObraName =
    OBRAS.find((o) => o.id === activeObra)?.name ?? activeObra;

  const handleChangeObra = (obra: ObraId) => {
    setActiveObra(obra);
    const first = signatures.find((s) => s.obra === obra);
    setSelectedSignatureId(first ? first.id : null);
  };

  // Selected signature for highlighting
  const [selectedSignatureId, setSelectedSignatureId] = useState<number | null>(
    1
  );

  // Modal editing
  const [editingSignature, setEditingSignature] =
    useState<SignatureConfig | null>(null);

  // Load the ORDEN DE COMPRA template as the sample document
  const handleLoadSamplePdf = async () => {
    setIsLoadingPdf(true);
    try {
      const res = await fetch('/plantilla-orden-de-compra.pdf');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const bytes = new Uint8Array(await res.arrayBuffer());
      await handleFileLoaded(bytes, 'ORDEN DE COMPRA.pdf');
    } catch (err) {
      console.error('Error cargando PDF de muestra:', err);
      setIsLoadingPdf(false);
    }
  };

  // Handle uploaded custom PDF file
  const handleFileLoaded = async (bytes: Uint8Array, fileName: string) => {
    setIsLoadingPdf(true);
    try {
      const info = await getPdfInfo(bytes);
      setPdfBytes(bytes);
      setPdfName(fileName);
      setNumPages(info.numPages);
      setCurrentPage(1);

      // Distribute each obra's signatures nicely on the last page or page 1
      const targetPage = info.numPages > 1 ? info.numPages : 1;
      setSignatures((prev) =>
        prev.map((s) => {
          const group = prev.filter((o) => o.obra === s.obra);
          return {
            ...s,
            ...groupSlot(group.indexOf(s), group.length),
            pageNumber: targetPage,
            yPercent: GROUP_Y_PERCENT,
          };
        })
      );
    } catch (err) {
      console.error('Error cargando documento PDF:', err);
      alert('Error al leer el archivo PDF. Verifica que sea un PDF válido.');
    } finally {
      setIsLoadingPdf(false);
    }
  };

  // Update a signature configuration
  const handleUpdateSignature = (updated: SignatureConfig) => {
    setSignatures((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
  };

  // Reset positions, keeping the signatures saved in this browser
  const handleLoadPresets = () => {
    const presets = applySavedSignatures(getPresetSignatures());
    setSignatures(
      presets.map((s) => ({
        ...s,
        pageNumber: currentPage,
      }))
    );
  };

  // Align the active obra's signatures along the bottom of the current page
  const handleAlignBottom = () => {
    setSignatures((prev) => {
      const group = prev.filter((s) => s.obra === activeObra);
      return prev.map((s) => {
        if (s.obra !== activeObra) return s;
        return {
          ...s,
          ...groupSlot(group.indexOf(s), group.length),
          pageNumber: currentPage,
          yPercent: GROUP_Y_PERCENT,
        };
      });
    });
  };

  // Final Stamp and Download
  const handleDownloadSignedPdf = async () => {
    if (!pdfBytes) return;
    const ready = obraSignatures.filter(hasSignatureContent);
    if (ready.length === 0) {
      alert(
        `Las firmas de ${activeObraName} aún no tienen imagen. Usa "Editar" en cada firma para subirla.`
      );
      return;
    }
    setIsDownloading(true);
    setDownloadSuccessNotice(false);

    try {
      const signedBytes = await stampSignaturesToPdf(pdfBytes, ready);
      const cleanBaseName = pdfName
        ? pdfName.replace(/\.pdf$/i, '')
        : 'documento';
      const outputFilename = `${cleanBaseName}_firmado_${activeObra}.pdf`;

      triggerFileDownload(signedBytes, outputFilename);

      setDownloadSuccessNotice(true);
      setTimeout(() => setDownloadSuccessNotice(false), 5000);
    } catch (err) {
      console.error('Error al generar PDF firmado:', err);
      alert(
        'Ocurrió un error al incrustar las firmas en el PDF. Intenta nuevamente.'
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Top Bar Contract: Zone 1 (Brand) — Zone 2 (Clean single line nav links) — Zone 3 (Primary Action) */}
      <header className="flex items-center justify-between gap-8 px-4 sm:px-8 py-3.5 bg-white border-b border-slate-200 sticky top-0 z-40">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
            <FileSignature className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900">
            FirmaPDF
          </span>
        </div>

        {/* Zone 2: Navigation / Process indicators (single line) */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-500 whitespace-nowrap shrink-0">
          <span
            className={
              !pdfBytes
                ? 'text-slate-900 font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }
          >
            1. Cargar PDF
          </span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span
            className={
              pdfBytes
                ? 'text-slate-900 font-semibold'
                : 'text-slate-400'
            }
          >
            2. Elegir Obra y Firmas
          </span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span
            className={
              pdfBytes
                ? 'text-slate-900 font-semibold'
                : 'text-slate-400'
            }
          >
            3. Posicionar y Descargar
          </span>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          {pdfBytes ? (
            <div className="flex items-center gap-2">
              <label className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors whitespace-nowrap shrink-0">
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Cambiar PDF</span>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      f.arrayBuffer().then((buf) =>
                        handleFileLoaded(new Uint8Array(buf), f.name)
                      );
                    }
                  }}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleDownloadSignedPdf}
                disabled={isDownloading}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isDownloading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Generando...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar PDF</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleLoadSamplePdf}
              disabled={isLoadingPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Ver ejemplo</span>
            </button>
          )}
        </div>
      </header>

      {storageFailed && (
        <div className="bg-amber-500 text-white px-4 py-2.5 text-xs text-center font-medium">
          El navegador no pudo guardar las firmas: se perderán al recargar la página.
        </div>
      )}

      {/* Optional Success Download Toast */}
      {downloadSuccessNotice && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 text-xs text-center font-medium shadow-xs flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-1">
          <CheckCircle2 className="w-4 h-4" />
          <span>
            ¡El documento PDF con las firmas de {activeObraName} ha sido generado y descargado con éxito!
          </span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-4 sm:p-6 max-w-7xl w-full mx-auto">
        {!pdfBytes ? (
          /* Step 1: Upload Dropzone & Onboarding */
          <div className="flex-1 flex items-center justify-center py-6">
            <UploadDropzone
              onFileLoaded={handleFileLoaded}
              onLoadSample={handleLoadSamplePdf}
              isLoading={isLoadingPdf}
            />
          </div>
        ) : (
          /* Step 2 & 3: Interactive Workspace (Sidebar + Canvas) */
          <div className="flex-1 flex flex-col lg:flex-row gap-5 items-stretch min-h-[620px]">
            {/* Sidebar Controls */}
            <SignatureSidebar
              signatures={obraSignatures}
              activeObra={activeObra}
              onChangeObra={handleChangeObra}
              numPages={numPages}
              currentPage={currentPage}
              selectedSignatureId={selectedSignatureId}
              onSelectSignature={(id) => setSelectedSignatureId(id)}
              onOpenEditModal={(sig) => setEditingSignature(sig)}
              onUpdateSignature={handleUpdateSignature}
              onAlignBottom={handleAlignBottom}
              onLoadPresets={handleLoadPresets}
              onDownload={handleDownloadSignedPdf}
              isDownloading={isDownloading}
            />

            {/* Document Canvas Viewer */}
            <div className="flex-1 flex flex-col min-h-[500px]">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 text-xs">
                <div className="flex items-center gap-2 text-slate-700 truncate max-w-md">
                  <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="font-semibold truncate">{pdfName}</span>
                  <span className="text-slate-400 shrink-0">·</span>
                  <span className="text-slate-500 shrink-0 tabular-nums">
                    {numPages} {numPages === 1 ? 'página' : 'páginas'}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 hidden sm:block">
                  Arrastra los sellos para posicionar cada firma en la hoja
                </div>
              </div>

              <div className="flex-1">
                <PdfPlacementCanvas
                  pdfBytes={pdfBytes}
                  numPages={numPages}
                  currentPage={currentPage}
                  onPageChange={(p) => setCurrentPage(p)}
                  signatures={obraSignatures}
                  onUpdateSignature={handleUpdateSignature}
                  onOpenEditModal={(sig) => setEditingSignature(sig)}
                  selectedSignatureId={selectedSignatureId}
                  onSelectSignature={(id) => setSelectedSignatureId(id)}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Signature Configuration Modal */}
      {editingSignature && (
        <SignatureModal
          signature={editingSignature}
          isOpen={!!editingSignature}
          onClose={() => setEditingSignature(null)}
          onSave={handleUpdateSignature}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            FirmaPDF · Estampado de firmas por obra
          </span>
          <span className="text-slate-400">
            Procesamiento seguro directo en tu explorador web
          </span>
        </div>
      </footer>
    </div>
  );
}
