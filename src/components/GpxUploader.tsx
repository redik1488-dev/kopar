import { useState, useRef, useCallback } from 'react';
import { Upload, X } from 'lucide-react';

interface GpxUploaderProps {
  onUpload: (files: FileList) => void;
}

export default function GpxUploader({ onUpload }: GpxUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files);
      setIsOpen(false);
    }
  }, [onUpload]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
      setIsOpen(false);
    }
  }, [onUpload]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-[#D4A843] text-[#1C1917] font-semibold rounded-lg hover:bg-[#C49A3B] transition-colors duration-200 active:scale-[0.98]"
      >
        <Upload size={16} />
        <span>Імпорт GPX</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div
            className="w-full max-w-md mx-4 bg-[#292524] border border-[#44403C] rounded-xl p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#F5F0E8] font-[Playfair_Display]">Імпорт GPX файлів</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-[#A8A29E] hover:text-[#F5F0E8] hover:bg-[#44403C] rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                isDragging
                  ? 'border-[#D4A843] bg-[rgba(212,168,67,0.1)]'
                  : 'border-[#44403C] bg-[#1C1917] hover:border-[#57534E]'
              }`}
            >
              <Upload size={36} className="mx-auto mb-3 text-[#A8A29E]" />
              <p className="text-[#F5F0E8] font-medium mb-1">Перетягніть GPX файли сюди</p>
              <p className="text-[#A8A29E] text-sm mb-4">або натисніть для вибору</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 bg-[#D4A843] text-[#1C1917] font-semibold rounded-lg hover:bg-[#C49A3B] transition-colors"
              >
                Обрати файл
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".gpx"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <p className="mt-3 text-xs text-[#A8A29E] text-center">
              Підтримуються файли .gpx з Garmin та інших GPS-пристроїв
            </p>
          </div>
        </div>
      )}
    </>
  );
}
