import React, { useState } from 'react';
import {
  X,
  PenTool,
  Type,
  Upload,
  User,
  CheckCircle2,
  Calendar,
  Briefcase,
} from 'lucide-react';
import { SignatureConfig, SignatureType } from '../types/pdf';
import { SignatureCanvas } from './SignatureCanvas';

interface SignatureModalProps {
  signature: SignatureConfig;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: SignatureConfig) => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  signature,
  isOpen,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<SignatureType>(signature.type || 'draw');
  const [color, setColor] = useState<string>(signature.color || '#1d4ed8');
  const [drawDataUrl, setDrawDataUrl] = useState<string | null>(signature.dataUrl);
  const [textValue, setTextValue] = useState<string>(
    signature.textValue || signature.signatory.name || 'Firma Autorizada'
  );
  const [fontFamily, setFontFamily] = useState<string>(
    signature.fontFamily || 'Dancing Script'
  );

  // Signatory details
  const [signatory, setSignatory] = useState({
    name: signature.signatory.name || '',
    role: signature.signatory.role || '',
    date: signature.signatory.date || new Date().toISOString().split('T')[0],
    showDetails: signature.signatory.showDetails ?? true,
  });

  if (!isOpen) return null;

  const fontOptions = [
    { id: 'Dancing Script', label: 'Elegante Manuscrita', preview: 'Dancing Script' },
    { id: 'Caveat', label: 'Rápida Moderna', preview: 'Caveat' },
    { id: 'Great Vibes', label: 'Clásica Formal', preview: 'Great Vibes' },
  ];

  const inkColors = [
    { label: 'Azul Ejecutivo', value: '#1d4ed8' },
    { label: 'Negro Clásico', value: '#0f172a' },
    { label: 'Azul Marino', value: '#1e3a8a' },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setDrawDataUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onSave({
      ...signature,
      type: activeTab,
      color,
      dataUrl: activeTab === 'type' ? null : drawDataUrl,
      textValue: activeTab === 'type' ? textValue : '',
      fontFamily,
      signatory,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div
              className="w-3.5 h-3.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Personalizar {signature.title}
              </h2>
              <p className="text-xs text-slate-500">
                Dibuja tu rúbrica, genera una firma tipográfica o sube un archivo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Method Selector Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('draw')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'draw'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Dibujar a Mano</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('type')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'type'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Escribir Texto</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'upload'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Subir Imagen</span>
            </button>
          </div>

          {/* Tab 1: Draw */}
          {activeTab === 'draw' && (
            <div className="space-y-2">
              <SignatureCanvas
                color={color}
                onSave={(dataUrl) => setDrawDataUrl(dataUrl)}
                initialDataUrl={drawDataUrl}
              />
            </div>
          )}

          {/* Tab 2: Type */}
          {activeTab === 'type' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Texto o nombre para la firma:
                </label>
                <input
                  type="text"
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                  placeholder="Ej: Lic. Carlos Arismendi"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Ink color */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-700">Tinta:</span>
                <div className="flex items-center gap-2">
                  {inkColors.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setColor(c.value)}
                      className={`px-3 py-1 text-xs rounded-md border transition-all ${
                        color === c.value
                          ? 'border-slate-900 bg-slate-100 font-semibold text-slate-900'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 align-middle"
                        style={{ backgroundColor: c.value }}
                      />
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Typography style selection */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700">
                  Estilo de caligrafía:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {fontOptions.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFontFamily(f.id)}
                      className={`p-3 text-left border rounded-lg transition-all ${
                        fontFamily === f.id
                          ? 'border-slate-900 bg-slate-50/80 ring-1 ring-slate-900'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="text-[11px] text-slate-500">{f.label}</div>
                      <div
                        className="text-2xl mt-1 truncate"
                        style={{ fontFamily: f.id, color }}
                      >
                        {textValue || 'Firma'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 text-center">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-2 font-medium">
                  Vista Previa
                </span>
                <div
                  className="text-3xl sm:text-4xl py-3 select-none"
                  style={{ fontFamily, color }}
                >
                  {textValue || 'Vista Previa'}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Upload */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100/60 transition-colors p-4">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-xs font-medium text-slate-700">
                  Haz clic para subir un archivo PNG o JPG de tu firma o sello
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Recomendado fondo blanco o transparente
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {drawDataUrl && (
                <div className="p-3 border border-slate-200 rounded-lg bg-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={drawDataUrl}
                      alt="Firma subida"
                      className="h-12 w-auto max-w-40 object-contain border border-slate-100 rounded bg-slate-50 p-1"
                    />
                    <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Imagen cargada correctamente
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrawDataUrl(null)}
                    className="text-xs text-rose-600 hover:text-rose-800"
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Signatory Metadata Form (Optional printed details beneath signature line) */}
          <div className="border-t border-slate-200 pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-slate-900">
                  Datos del Firmante al Pie (Opcional)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Imprime el nombre, cargo y documento debajo de la rúbrica
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={signatory.showDetails}
                  onChange={(e) =>
                    setSignatory({ ...signatory, showDetails: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                />
                <span>Incluir al pie</span>
              </label>
            </div>

            {signatory.showDetails && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="flex items-center gap-1 text-[11px] font-medium text-slate-600 mb-1">
                    <User className="w-3 h-3 text-slate-400" />
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={signatory.name}
                    onChange={(e) =>
                      setSignatory({ ...signatory, name: e.target.value })
                    }
                    placeholder="Ej: Lic. Carlos Arismendi"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1 text-[11px] font-medium text-slate-600 mb-1">
                    <Briefcase className="w-3 h-3 text-slate-400" />
                    Cargo / Puesto / Rol
                  </label>
                  <input
                    type="text"
                    value={signatory.role}
                    onChange={(e) =>
                      setSignatory({ ...signatory, role: e.target.value })
                    }
                    placeholder="Ej: Gerente General"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1 text-[11px] font-medium text-slate-600 mb-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    Fecha de Firma
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="date"
                      value={signatory.date}
                      onChange={(e) =>
                        setSignatory({ ...signatory, date: e.target.value })
                      }
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setSignatory({
                          ...signatory,
                          date: new Date().toISOString().split('T')[0],
                        })
                      }
                      className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md shrink-0"
                    >
                      Hoy
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
          >
            Guardar Firma
          </button>
        </div>
      </div>
    </div>
  );
};
