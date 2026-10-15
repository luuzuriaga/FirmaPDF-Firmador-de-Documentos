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
import { SignatureConfig } from './types/pdf';
import { createSamplePdf } from './utils/samplePdf';
import { getPresetSignatures } from './utils/sampleSignatures';
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

  // The 3 signatures state
  const [signatures, setSignatures] = useState<SignatureConfig[]>(() =>
    getPresetSignatures()
  );

  // Selected signature for highlighting
  const [selectedSignatureId, setSelectedSignatureId] = useState<number | null>(
    1
  );

  // Modal editing
  const [editingSignature, setEditingSignature] =
    useState<SignatureConfig | null>(null);

  // Load sample PDF automatically if user wants or on quick start
  const handleLoadSamplePdf = async () => {
    setIsLoadingPdf(true);
    try {
      const bytes = await createSamplePdf();
      const info = await getPdfInfo(bytes);
      setPdfBytes(bytes);
      setPdfName('acta_acuerdo_comercial_3_firmas.pdf');
      setNumPages(info.numPages);
      setCurrentPage(1);
    } catch (err) {
      console.error('Error cargando PDF de muestra:', err);
    } finally {
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

      // Distribute the 3 signatures nicely on the last page or page 1
      const targetPage = info.numPages > 1 ? info.numPages : 1;
      setSignatures((prev) =>
        prev.map((s, idx) => ({
          ...s,
          pageNumber: targetPage,
          xPercent: 7 + idx * 31,
          yPercent: 78,
        }))
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

  // Reset / Load Preset 3 Signatures
  const handleLoadPresets = () => {
    const presets = getPresetSignatures();
    setSignatures(
      presets.map((s) => ({
        ...s,
        pageNumber: currentPage,
      }))
    );
  };

  // Align the 3 signatures along the bottom of the current page
  const handleAlignBottomThree = () => {
    setSignatures((prev) =>
      prev.map((s) => {
        let x = 7;
        if (s.id === 2) x = 37;
        if (s.id === 3) x = 67;
        return {
          ...s,
          pageNumber: currentPage,
          xPercent: x,
          yPercent: 78,
          widthPercent: 26,
        };
      })
    );
  };

  // Final Stamp and Download
  const handleDownloadSignedPdf = async () => {
    if (!pdfBytes) return;
    setIsDownloading(true);
    setDownloadSuccessNotice(false);

    try {
      const signedBytes = await stampSignaturesToPdf(pdfBytes, signatures);
      const cleanBaseName = pdfName
        ? pdfName.replace(/\.pdf$/i, '')
        : 'documento';
      const outputFilename = `${cleanBaseName}_firmado_3_firmas.pdf`;

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
            2. Configurar 3 Firmas
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
              <span>Ver ejemplo con 3 firmas</span>
            </button>
          )}
        </div>
      </header>

      {/* Optional Success Download Toast */}
      {downloadSuccessNotice && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 text-xs text-center font-medium shadow-xs flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-1">
          <CheckCircle2 className="w-4 h-4" />
          <span>
            ¡El documento PDF con las 3 firmas ha sido generado y descargado con éxito!
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
              signatures={signatures}
              numPages={numPages}
              currentPage={currentPage}
              selectedSignatureId={selectedSignatureId}
              onSelectSignature={(id) => setSelectedSignatureId(id)}
              onOpenEditModal={(sig) => setEditingSignature(sig)}
              onUpdateSignature={handleUpdateSignature}
              onAlignBottomThree={handleAlignBottomThree}
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
                  signatures={signatures}
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
            FirmaPDF · Sistema de suscripción y estampado de 3 firmas para documentos PDF
          </span>
          <span className="text-slate-400">
            Procesamiento seguro directo en tu explorador web
          </span>
        </div>
      </footer>
    </div>
  );
}
