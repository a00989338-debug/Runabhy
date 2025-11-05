
import React, { useState, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { Spinner } from './components/Spinner';
import { generateEditedImage } from './services/geminiService';

interface ImageState {
  file: File | null;
  previewUrl: string | null;
  base64: string | null;
  mimeType: string | null;
}

const initialState: ImageState = {
  file: null,
  previewUrl: null,
  base64: null,
  mimeType: null,
};

const backgroundOptions = {
  white: { label: 'Studio White', prompt: 'Replace the background with a smooth white one.' },
  garden: { label: 'Lush Garden', prompt: 'Replace the background with a beautiful lush garden during daytime.' },
  park: { label: 'City Park', prompt: 'Replace the background with a scenic city park at sunset.' },
  home: { label: 'Luxury Home', prompt: 'Replace the background with the interior of a luxurious modern home.' },
};

const fileToData = (file: File): Promise<Omit<ImageState, 'file'>> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [header, base64] = result.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || 'application/octet-stream';
      resolve({ 
          previewUrl: URL.createObjectURL(file),
          base64, 
          mimeType 
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

const ShareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
    </svg>
);

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);


export default function App() {
  const [image1, setImage1] = useState<ImageState>(initialState);
  const [image2, setImage2] = useState<ImageState>(initialState);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<'hug' | 'kiss' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [background, setBackground] = useState<string>('white');
  const [suggestDressChange, setSuggestDressChange] = useState<boolean>(false);

  const handleImageUpload = useCallback(async (imageNumber: 1 | 2, file: File) => {
    try {
      const data = await fileToData(file);
      const newState = { file, ...data };
      if (imageNumber === 1) {
        setImage1(newState);
      } else {
        setImage2(newState);
      }
    } catch (e) {
      setError('Failed to read the image file.');
      console.error(e);
    }
  }, []);

  const handleDeleteImage = (imageNumber: 1 | 2) => {
    if (imageNumber === 1) {
      if (image1.previewUrl) URL.revokeObjectURL(image1.previewUrl);
      setImage1(initialState);
    } else {
      if (image2.previewUrl) URL.revokeObjectURL(image2.previewUrl);
      setImage2(initialState);
    }
  };

  const handleGenerate = async (action: 'hug' | 'kiss') => {
    if (!image1.base64 || !image1.mimeType || !image2.base64 || !image2.mimeType) {
      setError('Please upload both photos before generating.');
      return;
    }

    setLoadingAction(action);
    setError(null);
    setGeneratedImage(null);

    const backgroundPrompt = backgroundOptions[background as keyof typeof backgroundOptions].prompt;
    const dressPrompt = suggestDressChange
      ? "Also, dress them in new, elegant, and matching outfits that complement the background and the romantic pose."
      : "They should be wearing the same clothes as in their original photos.";

    const prompts = {
      hug: `Create a new, single, photorealistic image featuring the two people from the uploaded photos. Crucially, you must preserve their exact faces and physical appearances from the original photos without any changes to their identities. Place them in a pose where they are hugging each other lovingly and naturally. ${dressPrompt} Ensure the lighting is soft and cohesive across the entire image. ${backgroundPrompt}`,
      kiss: `Create a new, single, photorealistic image featuring the two people from the uploaded photos. Crucially, you must preserve their exact faces and physical appearances from the original photos without any changes to their identities. Place them in a pose where they are kissing each other romantically. ${dressPrompt} Ensure the lighting is soft and cohesive across the entire image. ${backgroundPrompt}`
    };
    const prompt = prompts[action];

    try {
      const resultBase64 = await generateEditedImage(
        image1.base64,
        image1.mimeType,
        image2.base64,
        image2.mimeType,
        prompt
      );
      setGeneratedImage(`data:image/png;base64,${resultBase64}`);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Generation failed: ${errorMessage}`);
      console.error(e);
    } finally {
      setLoadingAction(null);
    }
  };
  
  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = 'runabhii-creation.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!generatedImage || !navigator.share) {
      console.error("Web Share API not supported or no image to share.");
      return;
    }
    
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const file = new File([blob], 'runabhii-creation.png', { type: blob.type });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My AI Creation!',
          text: 'Check out this photo I made with Runabhii AI Photo Editor!',
        });
      } else {
        setError("Sharing this file type is not supported on your device.");
      }
    } catch (error) {
      console.error('Error sharing:', error);
      if ((error as Error).name !== 'AbortError') {
        setError('An error occurred while trying to share the image.');
      }
    }
  };

  const isLoading = loadingAction !== null;
  const canGenerate = image1.file && image2.file && !isLoading;
  const isShareSupported = typeof navigator !== 'undefined' && 'share' in navigator;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 tracking-tight">
                Runabhii <span className="text-indigo-500">AI Photo Editor</span>
            </h1>
            <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
                Upload two photos and watch Gemini magically blend them into a loving pose with a soft, clean background.
            </p>
        </header>

        <main className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <ImageUploader id="photo1" label="First Photo" onImageUpload={(file) => handleImageUpload(1, file)} onDelete={() => handleDeleteImage(1)} imageSrc={image1.previewUrl} />
                <ImageUploader id="photo2" label="Second Photo" onImageUpload={(file) => handleImageUpload(2, file)} onDelete={() => handleDeleteImage(2)} imageSrc={image2.previewUrl} />
            </div>

            <div className="mb-6">
                <h3 className="text-lg font-medium text-slate-700 mb-3 text-center">Choose a Background</h3>
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                    {Object.entries(backgroundOptions).map(([key, value]) => (
                        <div key={key}>
                            <input 
                                type="radio" 
                                id={`bg-${key}`} 
                                name="background" 
                                value={key} 
                                checked={background === key}
                                onChange={(e) => setBackground(e.target.value)}
                                className="sr-only peer"
                            />
                            <label 
                                htmlFor={`bg-${key}`}
                                className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-100 peer-checked:border-indigo-600 peer-checked:text-indigo-600 peer-checked:ring-2 peer-checked:ring-indigo-500 transition-all duration-200"
                            >
                                {value.label}
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-center items-center gap-3 my-6">
                <input
                    id="dress-change-checkbox"
                    type="checkbox"
                    checked={suggestDressChange}
                    onChange={(e) => setSuggestDressChange(e.target.checked)}
                    className="w-5 h-5 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer"
                />
                <label htmlFor="dress-change-checkbox" className="text-md font-medium text-slate-700 cursor-pointer">
                    Suggest new outfits (e.g., wedding attire)
                </label>
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <button
                    onClick={() => handleGenerate('hug')}
                    disabled={!canGenerate}
                    className="flex items-center justify-center w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform hover:scale-105 disabled:scale-100"
                >
                    {loadingAction === 'hug' ? (
                        <>
                            <Spinner />
                            <span className="ml-2">Generating...</span>
                        </>
                    ) : (
                        '💞 Generate Hug'
                    )}
                </button>
                 <button
                    onClick={() => handleGenerate('kiss')}
                    disabled={!canGenerate}
                    className="flex items-center justify-center w-full sm:w-auto px-8 py-4 bg-pink-500 text-white font-semibold rounded-lg shadow-md hover:bg-pink-600 disabled:bg-pink-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all duration-300 transform hover:scale-105 disabled:scale-100"
                >
                    {loadingAction === 'kiss' ? (
                        <>
                            <Spinner />
                            <span className="ml-2">Generating...</span>
                        </>
                    ) : (
                        '😘 Generate Kiss'
                    )}
                </button>
            </div>

            {error && (
                <div className="mt-6 p-4 bg-red-100 text-red-700 border border-red-200 rounded-lg text-center">
                    <p>{error}</p>
                </div>
            )}
            
            {generatedImage && (
                <div className="mt-10 pt-8 border-t border-slate-200">
                    <h2 className="text-2xl font-bold text-center text-slate-700 mb-6">Your Lovely Creation!</h2>
                    <div className="flex justify-center">
                        <div className="w-full max-w-lg bg-slate-50 p-2 rounded-lg shadow-inner">
                             <img src={generatedImage} alt="Generated hug" className="w-full h-auto rounded-md object-contain" />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-center items-center gap-4">
                        <button
                          onClick={handleDownload}
                          className="flex items-center justify-center px-6 py-3 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-300"
                          aria-label="Download image"
                        >
                            <DownloadIcon />
                            <span className="ml-2">Download</span>
                        </button>
                        {isShareSupported && (
                           <button
                             onClick={handleShare}
                             className="flex items-center justify-center px-6 py-3 bg-teal-500 text-white font-semibold rounded-lg shadow-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-300"
                             aria-label="Share image"
                           >
                             <ShareIcon />
                             <span className="ml-2">Share</span>
                           </button>
                        )}
                    </div>
                </div>
            )}
        </main>

        <footer className="text-center mt-8 text-sm text-slate-500">
            <p>Powered by Google Gemini. Created for demonstration purposes.</p>
        </footer>
      </div>
    </div>
  );
}