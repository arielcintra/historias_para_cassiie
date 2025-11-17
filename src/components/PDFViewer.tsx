import React, { useEffect, useState, useRef } from 'react';
import { Box, CircularProgress, Alert, Typography } from '@mui/material';
import { loadPDFDocument, renderPDFPageToCanvas } from '../utils/pdfUtils.ts';
import { getPageStorage } from '../storage/index.ts';
import { getDriveContext, ensureBookFolder, downloadFileBlob } from '../services/googleDrive.ts';

interface PDFViewerProps {
  bookId: string;
  pageNumber: number;
  onPageLoad?: (imageUrl: string) => void;
  pdfFile?: File;
}

export default function PDFViewer({ bookId, pageNumber, onPageLoad, pdfFile }: PDFViewerProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const loadPDFPage = async () => {
      try {
        console.log('PDFViewer: Carregando página', pageNumber, 'bookId:', bookId, 'pdfFile:', !!pdfFile);
        setLoading(true);
        setError('');

        if (pdfFile) {
        console.log('PDFViewer: Renderizando PDF direto');
        await renderPDFPage(pdfFile, pageNumber);
      } else {
          // Try cached preview first
          const isDynamic = /^pdf-/.test(bookId);
          try {
            const cached = await getPageStorage().getPage(bookId, pageNumber);
            if (cached) {
              setImageUrl(cached);
              onPageLoad?.(cached);
              setLoading(false);
            } else {
              if (isDynamic) {
                // Try Drive source.pdf for dynamic books when no preview exists
                try {
                  const ctx = getDriveContext();
                  const folderId = await ensureBookFolder(ctx, bookId);
                  const blob = await downloadFileBlob(ctx, folderId, 'source.pdf');
                  if (blob) {
                    const arrayBuffer = await blob.arrayBuffer();
                    const pdf = await loadPDFDocument(arrayBuffer);
                    if (pageNumber > pdf.numPages) {
                      setError(`Página ${pageNumber} não existe. PDF tem ${pdf.numPages} páginas.`);
                      setLoading(false);
                      return;
                    }
                    const pdfPage = await pdf.getPage(pageNumber);
                    const canvas = canvasRef.current ?? document.createElement('canvas');
                    const dataUrl = await renderPDFPageToCanvas(pdfPage, canvas);
                    setImageUrl(dataUrl);
                    getPageStorage().setPage(bookId, pageNumber, dataUrl).catch(() => {});
                    onPageLoad?.(dataUrl);
                    setLoading(false);
                  } else {
                    setLoading(false);
                  }
                } catch {
                  setLoading(false);
                }
              } else {
                console.log('PDFViewer: Tentando carregar imagens estáticas');
                await loadStaticImages();
              }
            }
          } catch {
            if (isDynamic) {
              setLoading(false);
            } else {
              await loadStaticImages();
            }
          }
      }

      } catch (err) {
        console.error('Erro ao carregar página:', err);
        setError('Erro ao carregar página do PDF');
        setLoading(false);
      }
    };

    const renderPDFPage = async (file: File, page: number) => {
      try {
        console.log('PDFViewer: renderPDFPage - file type:', typeof file, 'instanceof File:', file instanceof File);
        console.log('PDFViewer: file instanceof Blob:', file instanceof Blob);
        console.log('PDFViewer: file properties:', Object.keys(file));
        console.log('PDFViewer: file value:', file);
        
        // Check if we have a valid File/Blob object
        if (!file || (typeof file !== 'object') || !(file instanceof Blob)) {
          throw new Error(`Invalid file object. Expected File/Blob, got: ${typeof file}`);
        }
        
        let arrayBuffer: ArrayBuffer;
        
        if (file.arrayBuffer && typeof file.arrayBuffer === 'function') {
          arrayBuffer = await file.arrayBuffer();
        } else {
          arrayBuffer = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as ArrayBuffer);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
          });
        }
        
        const pdf = await loadPDFDocument(arrayBuffer);
        
        if (page > pdf.numPages) {
          setError(`Página ${page} não existe. PDF tem ${pdf.numPages} páginas.`);
          setLoading(false);
          return;
        }

        const pdfPage = await pdf.getPage(page);
        // Use DOM canvas if available; fallback to an offscreen canvas to avoid ref timing issues
        const canvas = canvasRef.current ?? document.createElement('canvas');
        
        if (!canvas) {
          setError('Canvas não disponível');
          setLoading(false);
          return;
        }

        const dataUrl = await renderPDFPageToCanvas(pdfPage, canvas);
        setImageUrl(dataUrl);
        // Persist preview for future sessions
        // Save preview via configured storage (Drive or Local)
        getPageStorage().setPage(bookId, page, dataUrl).catch(() => {});
        
        if (onPageLoad) {
          onPageLoad(dataUrl);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Erro ao renderizar PDF:', error);
        // Não use imagens estáticas quando há um arquivo PDF – evita erro enganoso.
        setError('Não foi possível renderizar a página do PDF.');
        setLoading(false);
      }
    };

    const loadStaticImages = async () => {
      const svgPath = `${process.env.PUBLIC_URL}/books/${bookId}/page-${pageNumber}.svg`;
      const pngPath = `${process.env.PUBLIC_URL}/books/${bookId}/page-${pageNumber}.png`;
      
      const tryLoadImage = (path: string, fallbackPath?: string) => {
        const img = new Image();
        
        img.onload = () => {
          setImageUrl(path);
          if (onPageLoad) {
            onPageLoad(path);
          }
          setLoading(false);
        };
        
        img.onerror = () => {
          if (fallbackPath) {
            tryLoadImage(fallbackPath);
          } else {
            setError(`Página ${pageNumber} não encontrada. Faça upload do PDF ou adicione as imagens manualmente.`);
            setLoading(false);
          }
        };
        
        img.src = path;
      };
      
      tryLoadImage(svgPath, pngPath);
    };

    loadPDFPage();
  }, [bookId, pageNumber, onPageLoad, pdfFile]);

  if (error) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        {error}
        {!pdfFile && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            💡 Dica: Faça upload do PDF na biblioteca para visualização automática das páginas.
          </Typography>
        )}
      </Alert>
    );
  }

  return (
    <Box sx={{ position: 'relative', width: '100%', textAlign: 'center' }}>
      <canvas
        ref={canvasRef}
        style={{
          display: pdfFile ? 'block' : 'none',
          maxWidth: '100%',
          height: 'auto',
          borderRadius: '8px'
        }}
      />
      
      {imageUrl && !pdfFile && (
        <img
          src={imageUrl}
          alt={`Página ${pageNumber}`}
          style={{
            width: '100%',
            height: 'auto',
            maxWidth: '100%',
            borderRadius: '8px'
          }}
        />
      )}

      {loading && (
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', pointerEvents: 'none' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress />
            <Typography variant="caption" sx={{ mt: 1 }}>
              {pdfFile ? 'Renderizando página do PDF...' : 'Carregando página...'}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}
