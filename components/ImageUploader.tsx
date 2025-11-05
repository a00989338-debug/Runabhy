import React, { useRef } from 'react';

interface ImageUploaderProps {
  id: string;
  label: string;
  imageSrc: string | null;
  onImageUpload: (file: File) => void;
  onDelete: () => void;
}

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const ReplaceIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 20h5v-5M20 4h-5v5" />
    </svg>
);

const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);


export const ImageUploader: React.FC<ImageUploaderProps> = ({ id, label, imageSrc, onImageUpload, onDelete }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type.startsWith('image/')) {
        onImageUpload(file);
      } else {
        alert('Please select an image file.');
      }
    }
  };
  
  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center">
      <label htmlFor={id} className="text-lg font-medium text-slate-700 mb-2">{label}</label>
      <div 
        onClick={imageSrc ? undefined : handleClick}
        className="relative w-full h-64 sm:h-80 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-300 overflow-hidden group"
      >
        <input
          type="file"
          id={id}
          ref={inputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
        />
        {imageSrc ? (
          <>
            <img src={imageSrc} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center gap-4">
              <button 
                onClick={handleClick} 
                className="flex items-center px-4 py-2 bg-white/80 text-slate-800 font-semibold rounded-full shadow-md hover:bg-white transition-all duration-200 opacity-0 group-hover:opacity-100 transform group-hover:scale-100 scale-90"
                aria-label="Replace photo"
              >
                <ReplaceIcon />
                Replace
              </button>
              <button 
                onClick={onDelete} 
                className="flex items-center px-4 py-2 bg-red-500/80 text-white font-semibold rounded-full shadow-md hover:bg-red-500 transition-all duration-200 opacity-0 group-hover:opacity-100 transform group-hover:scale-100 scale-90"
                aria-label="Delete photo"
              >
                 <DeleteIcon />
                 Delete
              </button>
            </div>
          </>
        ) : (
          <div className="text-center text-slate-500 cursor-pointer p-4">
            <UploadIcon />
            <p className="mt-2">Click to upload photo</p>
            <p className="text-xs">PNG, JPG, WEBP</p>
          </div>
        )}
      </div>
    </div>
  );
};