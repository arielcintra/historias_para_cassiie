import * as pdfjsLib from 'pdfjs-dist';

// Initialize worker only once
let workerInitialized = false;

export const initializePDFWorker = () => {
  if (!workerInitialized) {
    try {
      // Try different worker configurations in order of preference
      
      // Option 1: Use the matching version worker from CDN
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/pdf.worker.min.js';
      console.log('PDF.js worker initialized with CDN version 5.4.149');
      
    } catch (error) {
      console.warn('CDN worker failed, trying alternative:', error);
      
      // Option 2: Fallback to a stable version
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      console.log('PDF.js worker initialized with fallback version 3.11.174');
    }
    
    workerInitialized = true;
  }
  return pdfjsLib;
};

export const loadPDFDocument = async (data: ArrayBuffer) => {
  const pdfjsLib = initializePDFWorker();
  
  try {
    return await pdfjsLib.getDocument({ 
      data,
      // Disable worker as fallback if worker loading fails
      disableWorker: false,
      // Add additional options for better compatibility
      verbosity: 0 // Reduce console spam
    }).promise;
  } catch (error) {
    console.warn('PDF loading with worker failed, trying without worker:', error);
    
    // Fallback: Disable worker entirely
    return await pdfjsLib.getDocument({ 
      data,
      disableWorker: true,
      verbosity: 0
    }).promise;
  }
};

export const renderPDFPageToCanvas = async (
  pdfPage: any,
  canvas: HTMLCanvasElement,
  containerWidth: number = 800
) => {
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas 2D context not available');
  }

  const viewport = pdfPage.getViewport({ scale: 1 });
  const scale = containerWidth / viewport.width;
  const scaledViewport = pdfPage.getViewport({ scale });

  canvas.width = scaledViewport.width;
  canvas.height = scaledViewport.height;

  const renderContext = {
    canvasContext: context,
    viewport: scaledViewport,
    canvas: canvas
  };

  await pdfPage.render(renderContext).promise;
  return canvas.toDataURL('image/png');
};