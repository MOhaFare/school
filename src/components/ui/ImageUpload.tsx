import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, X } from 'lucide-react';

interface ImageUploadProps {
  onFileChange: (file: File | null) => void;
  initialPreviewUrl?: string | null;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onFileChange, initialPreviewUrl }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreviewUrl(initialPreviewUrl || null);
  }, [initialPreviewUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      onFileChange(file);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAreaClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      {previewUrl ? (
        <div className="relative group w-32 h-32 rounded-full mx-auto">
          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-full" />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-0 right-0 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          onClick={handleAreaClick}
          className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-500 cursor-pointer transition-colors"
        >
          <UploadCloud size={32} />
          <p className="mt-2 text-sm">Click or drag to upload</p>
          <p className="text-xs">PNG, JPG up to 10MB</p>
        </div>
      )}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg"
        className="hidden"
      />
    </div>
  );
};

export default ImageUpload;
