import React, { useRef, useState, useEffect, useCallback } from 'react';
import { RotateCcw, Trash2, Check } from 'lucide-react';

interface SignatureCanvasProps {
  color: string;
  onSave: (dataUrl: string) => void;
  initialDataUrl?: string | null;
}

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  color,
  onSave,
  initialDataUrl,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penWidth, setPenWidth] = useState<number>(2.5);
  const [penColor, setPenColor] = useState<string>(color || '#1d4ed8');
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);

  // Redraw all strokes on canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // If initial image exists and no strokes yet
    if (strokes.length === 0 && initialDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = initialDataUrl;
      return;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        // Smooth quadratic curve midpoint
        const p1 = stroke.points[i - 1];
        const p2 = stroke.points[i];
        const midPoint = {
          x: (p1.x + p2.x) / 2,
          y: (p1.y + p2.y) / 2,
        };
        ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
      }
      ctx.stroke();
    }
  }, [strokes, initialDataUrl]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    const pt = getCoordinates(e);
    if (!pt) return;

    setIsDrawing(true);
    currentStrokeRef.current = {
      points: [pt],
      color: penColor,
      width: penWidth,
    };
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing || !currentStrokeRef.current) return;
    e.preventDefault();
    const pt = getCoordinates(e);
    if (!pt) return;

    currentStrokeRef.current.points.push(pt);

    // Incremental draw
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = currentStrokeRef.current.color;
    ctx.lineWidth = currentStrokeRef.current.width;

    const pts = currentStrokeRef.current.points;
    if (pts.length > 2) {
      const p1 = pts[pts.length - 2];
      const p2 = pts[pts.length - 1];
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStrokeRef.current && currentStrokeRef.current.points.length > 1) {
      const newStrokes = [...strokes, currentStrokeRef.current];
      setStrokes(newStrokes);
      currentStrokeRef.current = null;

      // Update parent with latest dataUrl
      const canvas = canvasRef.current;
      if (canvas) {
        onSave(canvas.toDataURL('image/png'));
      }
    }
  };

  const handleClear = () => {
    setStrokes([]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      onSave('');
    }
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const newStrokes = strokes.slice(0, -1);
    setStrokes(newStrokes);
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        onSave(newStrokes.length > 0 ? canvas.toDataURL('image/png') : '');
      }
    }, 50);
  };

  const inkColors = [
    { label: 'Azul Ejecutivo', value: '#1d4ed8' },
    { label: 'Negro Clásico', value: '#0f172a' },
    { label: 'Azul Marino', value: '#1e3a8a' },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Canvas Tool Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-600 font-medium">Tinta:</span>
          <div className="flex items-center gap-1.5">
            {inkColors.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setPenColor(c.value)}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${
                  penColor === c.value
                    ? 'border-slate-800 scale-110 shadow-sm'
                    : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-600 font-medium">Grosor:</span>
          <div className="flex items-center gap-1">
            {[1.8, 2.8, 4.0].map((w, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPenWidth(w)}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  penWidth === w
                    ? 'bg-slate-900 text-white font-medium'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {idx === 0 ? 'Fino' : idx === 1 ? 'Medio' : 'Grueso'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={strokes.length === 0}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded disabled:opacity-40 transition-colors"
            title="Deshacer trazo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Deshacer</span>
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 rounded transition-colors"
            title="Borrar lienzo"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpiar</span>
          </button>
        </div>
      </div>

      {/* Signature drawing surface */}
      <div className="relative border-2 border-dashed border-slate-300 rounded-lg bg-white overflow-hidden touch-none shadow-inner">
        <canvas
          ref={canvasRef}
          width={600}
          height={220}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
          className="w-full h-44 sm:h-52 cursor-crosshair block"
        />

        {strokes.length === 0 && !initialDataUrl && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400">
            <span className="text-sm font-medium">Firma aquí con el ratón o con el dedo en pantalla táctil</span>
            <span className="text-xs text-slate-400 mt-1">El trazo se guardará automáticamente</span>
          </div>
        )}

        {/* Subtle baseline for realistic signing */}
        <div className="absolute left-10 right-10 bottom-8 border-b border-slate-200 pointer-events-none flex justify-between text-[10px] text-slate-300 px-1 select-none">
          <span>× Rúbrica</span>
          <span>Línea de firma</span>
        </div>
      </div>
    </div>
  );
};
