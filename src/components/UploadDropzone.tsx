import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  ShieldCheck,
  Sparkles,
  Layers,
  ArrowRight,
  FileCheck,
} from 'lucide-react';

interface UploadDropzoneProps {
  onFileLoaded: (bytes: Uint8Array, fileName: string) => void;
  onLoadSample: () => void;
  isLoading: boolean;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onFileLoaded,
  onLoadSample,
  isLoading,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMessage('Por favor, selecciona un archivo en formato PDF (.pdf).');
      return;
    }

    setErrorMessage(null);
    try {
      const buffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(buffer);
      onFileLoaded(uint8, file.name);
    } catch (err) {
      console.error(err);
      setErrorMessage('Hubo un error al leer el archivo PDF. Intenta con otro archivo.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Editorial Headline */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-2">
          Firmar Documentos PDF por Obra
        </h1>
        <p className="text-sm text-slate-600 max-w-lg mx-auto">
          Carga tu documento en segundos, elige la obra, personaliza sus firmas (dibujo, tipografía o imagen) y descárgalo listo con total validez.
        </p>
      </div>

      {/* Upload Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all bg-white ${
          isDragOver
            ? 'border-slate-900 bg-slate-50/70 scale-[1.01]'
            : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <div className="mx-auto w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-700 mb-4">
          <UploadCloud className="w-7 h-7" />
        </div>

        <h3 className="text-base font-semibold text-slate-900 mb-1">
          Arrastra tu documento PDF aquí
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Admite contratos, acuerdos, actas, minutas y cualquier archivo .pdf
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer transition-colors">
            <FileText className="w-4 h-4" />
            <span>Seleccionar PDF de mi equipo</span>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>

          <span className="text-xs text-slate-400 font-medium">o</span>

          <button
            type="button"
            onClick={onLoadSample}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-lg transition-colors border border-slate-200 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Probar con la ORDEN DE COMPRA de ejemplo</span>
          </button>
        </div>

        {errorMessage && (
          <p className="text-xs text-rose-600 mt-4 bg-rose-50 py-2 px-3 rounded-md inline-block">
            {errorMessage}
          </p>
        )}
      </div>

      {/* 3 Step Workflow Information */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <div className="text-xs font-semibold text-slate-900 flex items-center gap-2 mb-1">
            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center text-[11px] font-bold">
              1
            </span>
            <span>Carga tu PDF</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Tu archivo se procesa 100% en tu navegador. Tus documentos nunca salen de tu dispositivo.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <div className="text-xs font-semibold text-slate-900 flex items-center gap-2 mb-1">
            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center text-[11px] font-bold">
              2
            </span>
            <span>Firmas por Obra</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Dibuja en pantalla táctil o ratón, escribe tu nombre en caligrafía o sube una imagen de tu firma.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <div className="text-xs font-semibold text-slate-900 flex items-center gap-2 mb-1">
            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center text-[11px] font-bold">
              3
            </span>
            <span>Ubica y Descarga</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Arrastra y escala cada firma en la posición deseada y descarga el documento oficial firmado.
          </p>
        </div>
      </div>

      {/* Trust & Privacy Notice */}
      <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Procesamiento local y seguro en tu navegador web · Sin almacenamiento en servidores</span>
      </div>
    </div>
  );
};
