import * as pdfjsLib from 'pdfjs-dist';

// Initialize worker only once
let workerInitialized = false;

export const initializePDFWorker = () => {
  if (!workerInitialized) {
    try {
      // Prefer a local worker shipped in /public to avoid CDN/cross-origin issues.
      // If the worker fails to load or versions mismatch, loadPDFDocument falls back to disableWorker.
      pdfjsLib.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.js`;
    } catch {
      // Ignore; loadPDFDocument will disable worker if needed
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
      disableWorker: false,
      verbosity: 0
    }).promise;
  } catch (error) {
    // Fallback: Disable worker entirely (slower but reliable when worker fails to load)
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
