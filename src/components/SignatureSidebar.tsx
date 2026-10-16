import React from 'react';
import {
  PenTool,
  Sliders,
  AlignHorizontalDistributeCenter,
  Sparkles,
  Download,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  MoveHorizontal,
  RefreshCw,
} from 'lucide-react';
import { ObraId, OBRAS, SignatureConfig } from '../types/pdf';

interface SignatureSidebarProps {
  signatures: SignatureConfig[];
  activeObra: ObraId;
  onChangeObra: (obra: ObraId) => void;
  numPages: number;
  currentPage: number;
  selectedSignatureId: number | null;
  onSelectSignature: (id: number) => void;
  onOpenEditModal: (sig: SignatureConfig) => void;
  onUpdateSignature: (sig: SignatureConfig) => void;
  onAlignBottom: () => void;
  onLoadPresets: () => void;
  onDownload: () => void;
  isDownloading: boolean;
}

export const SignatureSidebar: React.FC<SignatureSidebarProps> = ({
  signatures,
  activeObra,
  onChangeObra,
  numPages,
  currentPage,
  selectedSignatureId,
  onSelectSignature,
  onOpenEditModal,
  onUpdateSignature,
  onAlignBottom,
  onLoadPresets,
  onDownload,
  isDownloading,
}) => {
  const colorMap: Record<
    number,
    { border: string; bg: string; text: string; lightBg: string }
  > = {
    1: {
      border: 'border-blue-500',
      bg: 'bg-blue-600',
      text: 'text-blue-700',
      lightBg: 'bg-blue-50',
    },
    2: {
      border: 'border-indigo-500',
      bg: 'bg-indigo-600',
      text: 'text-indigo-700',
      lightBg: 'bg-indigo-50',
    },
    3: {
      border: 'border-emerald-500',
      bg: 'bg-emerald-600',
      text: 'text-emerald-700',
      lightBg: 'bg-emerald-50',
    },
    4: {
      border: 'border-amber-500',
      bg: 'bg-amber-600',
      text: 'text-amber-700',
      lightBg: 'bg-amber-50',
    },
    5: {
      border: 'border-rose-500',
      bg: 'bg-rose-600',
      text: 'text-rose-700',
      lightBg: 'bg-rose-50',
    },
    6: {
      border: 'border-violet-500',
      bg: 'bg-violet-600',
      text: 'text-violet-700',
      lightBg: 'bg-violet-50',
    },
    7: {
      border: 'border-cyan-500',
      bg: 'bg-cyan-600',
      text: 'text-cyan-700',
      lightBg: 'bg-cyan-50',
    },
    8: {
      border: 'border-fuchsia-500',
      bg: 'bg-fuchsia-600',
      text: 'text-fuchsia-700',
      lightBg: 'bg-fuchsia-50',
    },
  };

  return (
    <aside className="w-full lg:w-80 xl:w-96 flex flex-col gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-xs shrink-0">
      {/* Header & Quick Align Tools */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-slate-900">
            Firmas por Obra
          </h2>
          <button
            type="button"
            onClick={onLoadPresets}
            className="flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2 py-1 rounded transition-colors"
            title="Cargar firmas listas para probar de inmediato"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Firmas de muestra</span>
          </button>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Elige la obra: solo sus firmas se estampan en el documento.
        </p>

        {/* Obra selector */}
        <div className="mt-3 flex flex-wrap gap-1 p-1 bg-slate-100 rounded-lg">
          {OBRAS.map((obra) => (
            <button
              key={obra.id}
              type="button"
              onClick={() => onChangeObra(obra.id)}
              className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeObra === obra.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {obra.name}
            </button>
          ))}
        </div>

        {/* Quick alignment action */}
        <button
          type="button"
          onClick={onAlignBottom}
          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors border border-slate-200/60"
        >
          <AlignHorizontalDistributeCenter className="w-3.5 h-3.5 text-slate-600" />
          <span>Alinear al pie de la pág. {currentPage}</span>
        </button>
      </div>

      {/* Signature cards of the active obra */}
      <div className="flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-320px)] pr-0.5">
        {signatures.map((sig) => {
          const isSelected = selectedSignatureId === sig.id;
          const theme = colorMap[sig.id] || colorMap[1];
          const hasSignature = !!sig.dataUrl || !!sig.textValue;

          return (
            <div
              key={sig.id}
              onClick={() => onSelectSignature(sig.id)}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? `border-slate-900 ring-1 ring-slate-900 bg-white shadow-xs`
                  : `border-slate-200 hover:border-slate-300 bg-slate-50/50`
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${theme.bg} shrink-0`}
                  />
                  <span className="text-xs font-bold text-slate-900">
                    {sig.title}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenEditModal(sig);
                  }}
                  className="flex items-center gap-1 text-[11px] font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-2 py-0.5 rounded shadow-2xs transition-colors"
                >
                  <PenTool className="w-3 h-3" />
                  <span>Editar</span>
                </button>
              </div>

              {/* Signature Preview */}
              <div className="h-14 bg-white border border-slate-200 rounded-md p-1.5 flex items-center justify-center overflow-hidden mb-2 relative">
                {sig.dataUrl ? (
                  <img
                    src={sig.dataUrl}
                    alt={sig.title}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : sig.textValue ? (
                  <span
                    className="text-lg leading-tight select-none truncate"
                    style={{
                      fontFamily: sig.fontFamily || 'Dancing Script',
                      color: sig.color || '#0f172a',
                    }}
                  >
                    {sig.textValue}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    Sin configurar
                  </span>
                )}

                {hasSignature ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 absolute bottom-1 right-1" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 absolute bottom-1 right-1" />
                )}
              </div>

              {/* Signatory meta preview */}
              {sig.signatory.showDetails && sig.signatory.name && (
                <div className="text-[11px] text-slate-600 mb-2 truncate">
                  <span className="font-semibold text-slate-800">
                    {sig.signatory.name}
                  </span>
                  {sig.signatory.role && <span> · {sig.signatory.role}</span>}
                </div>
              )}

              {/* Position and Page controls */}
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200/70">
                <div>
                  <span className="text-slate-500 block mb-0.5">En Página:</span>
                  <select
                    value={sig.pageNumber}
                    onChange={(e) => {
                      onUpdateSignature({
                        ...sig,
                        pageNumber: parseInt(e.target.value, 10),
                      });
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white text-slate-800 focus:outline-none"
                  >
                    {Array.from({ length: numPages }, (_, i) => i + 1).map(
                      (p) => (
                        <option key={p} value={p}>
                          Página {p}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-slate-500">Ancho:</span>
                    <span className="text-slate-700 font-medium tabular-nums">
                      {sig.widthPercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="50"
                    step="1"
                    value={sig.widthPercent}
                    onChange={(e) => {
                      onUpdateSignature({
                        ...sig,
                        widthPercent: parseInt(e.target.value, 10),
                      });
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full accent-slate-900 cursor-pointer h-1.5"
                  />
                </div>
              </div>

              {/* Position presets */}
              <div className="flex items-center justify-between gap-1 mt-2 pt-1.5 border-t border-slate-100 text-[10px]">
                <span className="text-slate-400">Posición:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateSignature({ ...sig, xPercent: 6 });
                    }}
                    className="px-1.5 py-0.5 bg-white hover:bg-slate-200 border border-slate-200 rounded text-slate-600"
                    title="Alinear a la izquierda"
                  >
                    Izq
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateSignature({
                        ...sig,
                        xPercent: 50 - sig.widthPercent / 2,
                      });
                    }}
                    className="px-1.5 py-0.5 bg-white hover:bg-slate-200 border border-slate-200 rounded text-slate-600"
                    title="Centrar"
                  >
                    Centro
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateSignature({
                        ...sig,
                        xPercent: 94 - sig.widthPercent,
                      });
                    }}
                    className="px-1.5 py-0.5 bg-white hover:bg-slate-200 border border-slate-200 rounded text-slate-600"
                    title="Alinear a la derecha"
                  >
                    Der
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Download Action Footer */}
      <div className="pt-2 border-t border-slate-200 mt-auto">
        <button
          type="button"
          onClick={onDownload}
          disabled={isDownloading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-medium text-sm rounded-lg shadow-sm transition-all disabled:opacity-60 cursor-pointer"
        >
          {isDownloading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Incrustando firmas en PDF...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Descargar PDF Firmado</span>
            </>
          )}
        </button>
        <p className="text-[11px] text-slate-400 text-center mt-1.5">
          Guarda el documento con las firmas de la obra estampadas en alta resolución.
        </p>
      </div>
    </aside>
  );
};
