import React from 'react';
import {
  AlignHorizontalDistributeCenter,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock,
  Plus,
  Signature,
  Sparkles,
  Trash2,
  UserRoundPen,
} from 'lucide-react';
import { OBRAS, ObraId, SignatureConfig } from '../types/pdf';

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
  onAddSignature: () => void;
  onRemoveSignature: (sig: SignatureConfig) => void;
}

/** "Uchumarca · Residente de Obra" -> "Residente de Obra" */
function signatureLabel(sig: SignatureConfig): string {
  const parts = sig.title.split(' · ');
  return parts[parts.length - 1] || sig.title;
}

/** "Representante Común" -> "RC", "Gerencia" -> "GE" */
function initials(label: string): string {
  const words = label
    .split(/\s+/)
    .filter((w) => w.length > 2 || /\d/.test(w));
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return label.slice(0, 2).toUpperCase();
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
  onAddSignature,
  onRemoveSignature,
}) => {
  const activeObraName = OBRAS.find((o) => o.id === activeObra)?.name ?? '';

  return (
    <aside className="w-full lg:w-[380px] xl:w-[420px] flex flex-col gap-4 sm:gap-5 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs shrink-0">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 leading-tight">
            Obra y firmas
          </h2>
          <p className="text-sm text-slate-500">
            Cada obra tiene sus propias firmas.
          </p>
        </div>
      </div>

      {/* Obra selector */}
      <div>
        <label
          htmlFor="obra-select"
          className="block text-sm font-medium text-slate-800 mb-1.5"
        >
          Selecciona la obra
        </label>
        <div className="relative">
          <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            id="obra-select"
            value={activeObra}
            onChange={(e) => onChangeObra(e.target.value)}
            className="w-full appearance-none pl-10 pr-10 py-2.5 text-sm font-medium text-slate-900 bg-white border border-slate-300 hover:border-slate-400 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 cursor-pointer"
          >
            {OBRAS.map((obra) => (
              <option key={obra.id} value={obra.id}>
                {obra.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

      </div>

      {/* Signatures of the active obra */}
      <section className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-3 flex flex-col gap-3">
        <div className="flex items-center justify-between px-1 pt-1">
          <div className="flex items-center gap-2">
            <UserRoundPen className="w-5 h-5 text-blue-700" />
            <h3 className="text-base font-bold text-slate-900">
              Firmas disponibles
            </h3>
          </div>
          <span className="px-2.5 py-0.5 text-xs font-semibold text-blue-700 bg-blue-100/70 rounded-full">
            {signatures.length} {signatures.length === 1 ? 'firma' : 'firmas'}
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {signatures.map((sig) => {
            const isSelected = selectedSignatureId === sig.id;
            const hasSignature = !!sig.dataUrl || !!sig.textValue;
            const label = signatureLabel(sig);

            return (
              <div
                key={sig.id}
                onClick={() => onSelectSignature(sig.id)}
                className={`p-3.5 rounded-xl border bg-white transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-300 ring-2 ring-blue-100 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Who signs and status */}
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-700 text-sm font-bold flex items-center justify-center shrink-0">
                    {initials(label)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 leading-snug">
                        {label}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveSignature(sig);
                        }}
                        className="p-1 -mt-0.5 -mr-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors shrink-0"
                        title="Eliminar firma"
                        aria-label={`Eliminar ${sig.title}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {sig.signatory.name || activeObraName}
                    </p>
                    <span
                      className={`mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border ${
                        hasSignature
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          : 'text-amber-700 bg-amber-50 border-amber-200'
                      }`}
                    >
                      {hasSignature ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      {hasSignature ? 'Configurada' : 'Pendiente de configurar'}
                    </span>
                  </div>
                </div>

                {/* Preview of the configured signature */}
                {hasSignature && (
                  <div className="mt-3 h-16 bg-white border border-slate-200 rounded-lg p-1.5 flex items-center justify-center overflow-hidden">
                    {sig.dataUrl ? (
                      <img
                        src={sig.dataUrl}
                        alt={sig.title}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span
                        className="text-xl leading-tight select-none truncate"
                        style={{
                          fontFamily: sig.fontFamily || 'Dancing Script',
                          color: sig.color || '#0f172a',
                        }}
                      >
                        {sig.textValue}
                      </span>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenEditModal(sig);
                  }}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-blue-700 bg-white hover:bg-blue-50 border border-blue-600 rounded-lg transition-colors cursor-pointer"
                >
                  <Signature className="w-4 h-4" />
                  <span>{hasSignature ? 'Editar firma' : 'Configurar firma'}</span>
                </button>

                {/* Placement controls, only for the selected signature */}
                {isSelected && hasSignature && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-x-3 gap-y-2 text-xs"
                  >
                    <div>
                      <span className="text-slate-500 block mb-1">Página</span>
                      <select
                        value={sig.pageNumber}
                        onChange={(e) =>
                          onUpdateSignature({
                            ...sig,
                            pageNumber: parseInt(e.target.value, 10),
                          })
                        }
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md bg-white text-slate-800 focus:outline-none"
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
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-slate-500">Ancho</span>
                        <span className="text-slate-700 font-medium tabular-nums">
                          {sig.widthPercent}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="50"
                        step="1"
                        value={sig.widthPercent}
                        onChange={(e) =>
                          onUpdateSignature({
                            ...sig,
                            widthPercent: parseInt(e.target.value, 10),
                          })
                        }
                        className="w-full accent-blue-700 cursor-pointer h-1.5"
                      />
                    </div>
                    <div className="col-span-2 flex items-center justify-between">
                      <span className="text-slate-500">Posición</span>
                      <div className="flex items-center gap-1">
                        {[
                          { label: 'Izq', x: 6 },
                          { label: 'Centro', x: 50 - sig.widthPercent / 2 },
                          { label: 'Der', x: 94 - sig.widthPercent },
                        ].map((pos) => (
                          <button
                            key={pos.label}
                            type="button"
                            onClick={() =>
                              onUpdateSignature({ ...sig, xPercent: pos.x })
                            }
                            className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-slate-600"
                          >
                            {pos.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {signatures.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-3">
              Esta obra aún no tiene firmas.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onAddSignature}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-700 border border-dashed border-blue-300 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar firma</span>
        </button>

        {signatures.length > 0 && (
          <div className="flex items-center justify-between gap-2 px-1 text-xs">
            <button
              type="button"
              onClick={onAlignBottom}
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <AlignHorizontalDistributeCenter className="w-3.5 h-3.5" />
              <span>Alinear al pie de la pág. {currentPage}</span>
            </button>
            <button
              type="button"
              onClick={onLoadPresets}
              className="flex items-center gap-1 text-slate-600 hover:text-slate-900 cursor-pointer"
              title="Volver a colocar las firmas de todas las obras en su posición inicial"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Restablecer</span>
            </button>
          </div>
        )}
      </section>

    </aside>
  );
};
