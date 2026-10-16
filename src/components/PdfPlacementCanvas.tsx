import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Move,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Sliders,
  CheckCircle2,
  Layers,
  FileText,
} from 'lucide-react';
import { SignatureConfig } from '../types/pdf';
import {
  renderCompositeSignaturePng,
  renderPdfPageToCanvas,
} from '../utils/pdfService';

/** Changes whenever what a signature looks like changes (not its position) */
function appearanceKey(sig: SignatureConfig): string {
  return JSON.stringify([
    sig.dataUrl ? [sig.dataUrl.length, sig.dataUrl.slice(-64)] : null,
    sig.textValue,
    sig.fontFamily,
    sig.color,
    sig.signatory,
  ]);
}

interface PdfPlacementCanvasProps {
  pdfBytes: Uint8Array | null;
  numPages: number;
  currentPage: number;
  onPageChange: (newPage: number) => void;
  signatures: SignatureConfig[];
  onUpdateSignature: (sig: SignatureConfig) => void;
  onOpenEditModal: (sig: SignatureConfig) => void;
  selectedSignatureId: number | null;
  onSelectSignature: (id: number | null) => void;
}

export const PdfPlacementCanvas: React.FC<PdfPlacementCanvasProps> = ({
  pdfBytes,
  numPages,
  currentPage,
  onPageChange,
  signatures,
  onUpdateSignature,
  onOpenEditModal,
  selectedSignatureId,
  onSelectSignature,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100); // 75%, 100%, 125%, 150%
  const [isRendering, setIsRendering] = useState(false);
  const [renderDimensions, setRenderDimensions] = useState<{
    width: number;
    height: number;
  }>({ width: 680, height: 960 });

  // Each stamp is previewed with the exact image that goes into the PDF, so
  // what is placed here is what gets stamped
  const [stampPreviews, setStampPreviews] = useState<
    Record<number, { key: string; url: string }>
  >({});
  useEffect(() => {
    let cancelled = false;
    for (const sig of signatures) {
      if (!sig.dataUrl && !sig.textValue) continue;
      const key = appearanceKey(sig);
      if (stampPreviews[sig.id]?.key === key) continue;
      renderCompositeSignaturePng(sig)
        .then(({ dataUrl }) => {
          if (cancelled) return;
          setStampPreviews((prev) => ({
            ...prev,
            [sig.id]: { key, url: dataUrl },
          }));
        })
        .catch(() => {
          // Keep showing the raw image
        });
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signatures]);

  // Dragging state
  const [draggingSigId, setDraggingSigId] = useState<number | null>(null);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initialXPercent: number;
    initialYPercent: number;
  }>({ startX: 0, startY: 0, initialXPercent: 0, initialYPercent: 0 });

  // Render the current PDF page
  useEffect(() => {
    let isCancelled = false;

    async function loadPage() {
      if (!pdfBytes || !canvasRef.current || !containerRef.current) return;
      setIsRendering(true);

      try {
        const containerWidth = containerRef.current.clientWidth || 700;
        // Base width calculation bounded by zoom
        const targetWidth = Math.min(
          Math.max(containerWidth - (containerWidth < 640 ? 24 : 64), 240),
          1200
        ) * (zoomLevel / 100);

        const dims = await renderPdfPageToCanvas(
          pdfBytes,
          currentPage,
          canvasRef.current,
          targetWidth
        );

        if (!isCancelled) {
          setRenderDimensions({ width: dims.width, height: dims.height });
        }
      } catch (err) {
        console.error('Error al renderizar página del PDF:', err);
      } finally {
        if (!isCancelled) {
          setIsRendering(false);
        }
      }
    }

    loadPage();

    return () => {
      isCancelled = true;
    };
  }, [pdfBytes, currentPage, zoomLevel]);

  // Window resize observer to adapt canvas
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current && pdfBytes) {
        const containerWidth = containerRef.current.clientWidth || 700;
        const targetWidth = Math.min(
          Math.max(containerWidth - (containerWidth < 640 ? 24 : 64), 240),
          1200
        ) * (zoomLevel / 100);
        renderPdfPageToCanvas(
          pdfBytes,
          currentPage,
          canvasRef.current,
          targetWidth
        ).then((dims) => {
          setRenderDimensions({ width: dims.width, height: dims.height });
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pdfBytes, currentPage, zoomLevel]);

  // Drag and drop handlers for signatures
  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    sig: SignatureConfig
  ) => {
    e.stopPropagation();
    onSelectSignature(sig.id);
    setDraggingSigId(sig.id);

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialXPercent: sig.xPercent,
      initialYPercent: sig.yPercent,
    };

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (draggingSigId === null) return;
    const sig = signatures.find((s) => s.id === draggingSigId);
    if (!sig) return;

    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    const deltaXPercent = (deltaX / renderDimensions.width) * 100;
    const deltaYPercent = (deltaY / renderDimensions.height) * 100;

    // Constrain within page bounds
    const newX = Math.min(
      Math.max(dragStartRef.current.initialXPercent + deltaXPercent, 0),
      100 - sig.widthPercent
    );
    const estimatedHeightPercent =
      (sig.widthPercent / sig.aspectRatio) *
      (renderDimensions.width / renderDimensions.height);
    const newY = Math.min(
      Math.max(dragStartRef.current.initialYPercent + deltaYPercent, 0),
      100 - estimatedHeightPercent
    );

    onUpdateSignature({
      ...sig,
      xPercent: Math.round(newX * 10) / 10,
      yPercent: Math.round(newY * 10) / 10,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (draggingSigId !== null) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe ignore
      }
      setDraggingSigId(null);
    }
  };

  // Signatures on current page
  const currentPageSignatures = signatures.filter(
    (s) => s.pageNumber === currentPage
  );

  return (
    <div
      ref={containerRef}
      className="flex flex-col lg:h-full bg-slate-100/80 rounded-xl border border-slate-200 overflow-hidden shadow-xs"
    >
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-white border-b border-slate-200 text-xs">
        {/* Page Switcher */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage <= 1}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md disabled:opacity-30 transition-colors"
            title="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-medium text-slate-800 px-2 tabular-nums">
            Página {currentPage} de {numPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(currentPage + 1, numPages))}
            disabled={currentPage >= numPages}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md disabled:opacity-30 transition-colors"
            title="Página siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Status of signatures on this page */}
        <div className="hidden sm:flex items-center gap-2 text-slate-500">
          <Layers className="w-3.5 h-3.5" />
          <span>
            {currentPageSignatures.length} de {signatures.length} firmas en esta página
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(z - 15, 60))}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            title="Alejar zoom"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-slate-700 font-medium w-12 text-center tabular-nums">
            {zoomLevel}%
          </span>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(z + 15, 140))}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            title="Acercar zoom"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(100)}
            className="px-2 py-1 text-[11px] text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors ml-1"
          >
            Ajustar
          </button>
        </div>
      </div>

      {/* Main Document Viewport */}
      <div
        className="flex-1 overflow-x-auto lg:overflow-y-auto p-3 sm:p-8 flex items-start justify-center relative select-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Document Sheet */}
        <div
          className="relative bg-white shadow-xl rounded-sm transition-all duration-100"
          style={{
            width: `${renderDimensions.width}px`,
            height: `${renderDimensions.height}px`,
          }}
          onClick={() => onSelectSignature(null)}
        >
          {/* Canvas for PDF rendering */}
          <canvas
            ref={canvasRef}
            className="block w-full h-full pointer-events-none"
          />

          {isRendering && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs flex items-center justify-center">
              <div className="text-xs font-medium text-slate-600 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                <span>Renderizando página...</span>
              </div>
            </div>
          )}

          {/* Interactive Signature Stamps Overlay */}
          {currentPageSignatures.map((sig) => {
            const isSelected = selectedSignatureId === sig.id;
            const isDragging = draggingSigId === sig.id;
            const sigWidthPx = (sig.widthPercent / 100) * renderDimensions.width;
            const sigLeftPx = (sig.xPercent / 100) * renderDimensions.width;
            const sigTopPx = (sig.yPercent / 100) * renderDimensions.height;

            const badgeColorMap: Record<number, { border: string; bg: string; text: string }> = {
              1: { border: 'border-blue-600', bg: 'bg-blue-600', text: 'text-blue-700' },
              2: { border: 'border-indigo-600', bg: 'bg-indigo-600', text: 'text-indigo-700' },
              3: { border: 'border-emerald-600', bg: 'bg-emerald-600', text: 'text-emerald-700' },
              4: { border: 'border-amber-600', bg: 'bg-amber-600', text: 'text-amber-700' },
              5: { border: 'border-rose-600', bg: 'bg-rose-600', text: 'text-rose-700' },
              6: { border: 'border-violet-600', bg: 'bg-violet-600', text: 'text-violet-700' },
              7: { border: 'border-cyan-600', bg: 'bg-cyan-600', text: 'text-cyan-700' },
              8: { border: 'border-fuchsia-600', bg: 'bg-fuchsia-600', text: 'text-fuchsia-700' },
            };
            const theme = badgeColorMap[((sig.id - 1) % 8) + 1];

            return (
              <div
                key={sig.id}
                onPointerDown={(e) => handlePointerDown(e, sig)}
                onClick={(e) => e.stopPropagation()}
                className={`absolute group cursor-move touch-none transition-shadow ${
                  isSelected
                    ? `z-30`
                    : `z-20`
                } ${isDragging ? 'opacity-90 scale-[1.01]' : ''}`}
                style={{
                  left: `${sigLeftPx}px`,
                  top: `${sigTopPx}px`,
                  width: `${sigWidthPx}px`,
                }}
              >
                {/* Label and quick actions, floating above the stamp */}
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  className={`absolute bottom-full left-0 mb-1 items-center gap-1 px-1.5 py-0.5 bg-white/95 border border-slate-200 rounded-md shadow-xs text-[10px] whitespace-nowrap ${
                    isSelected ? 'flex' : 'hidden group-hover:flex'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${theme.bg} shrink-0`} />
                  <span className="font-semibold text-slate-700 max-w-40 truncate">
                    {sig.title}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenEditModal(sig);
                    }}
                    className="p-0.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800"
                    title="Editar firma"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  {isSelected && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateSignature({
                            ...sig,
                            widthPercent: Math.max(sig.widthPercent - 2, 10),
                          });
                        }}
                        className="px-1 hover:bg-slate-100 rounded text-slate-600"
                        title="Reducir tamaño"
                      >
                        −
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateSignature({
                            ...sig,
                            widthPercent: Math.min(sig.widthPercent + 2, 60),
                          });
                        }}
                        className="px-1 hover:bg-slate-100 rounded text-slate-600"
                        title="Aumentar tamaño"
                      >
                        +
                      </button>
                    </>
                  )}
                  <Move className="w-3 h-3 text-slate-400" />
                </div>

                {/* The stamp exactly as it will be printed */}
                <div
                  className={`border border-dashed rounded-sm transition-colors ${
                    isSelected
                      ? 'border-blue-500'
                      : 'border-transparent group-hover:border-blue-300'
                  }`}
                >
                  {stampPreviews[sig.id] || sig.dataUrl ? (
                    <img
                      src={stampPreviews[sig.id]?.url ?? sig.dataUrl!}
                      alt={sig.title}
                      className="block w-full h-auto mix-blend-multiply pointer-events-none select-none"
                      draggable={false}
                    />
                  ) : (
                    <div className="py-3 text-center text-xs italic text-slate-400 bg-white/80 rounded-sm">
                      Firma no configurada
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
