import React, { useEffect, useState, useRef } from 'react';
import { Box, CircularProgress, Alert, Typography } from '@mui/material';

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
        setLoading(true);
        setError('');

        if (pdfFile) {
          await renderPDFPage(pdfFile, pageNumber);
        } else {
          await loadStaticImages();
        }

      } catch (err) {
        console.error('Erro ao carregar página:', err);
        setError('Erro ao carregar página do PDF');
        setLoading(false);
      }
    };

    const renderPDFPage = async (file: File, page: number) => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        if (page > pdf.numPages) {
          setError(`Página ${page} não existe. PDF tem ${pdf.numPages} páginas.`);
          setLoading(false);
          return;
        }

        const pdfPage = await pdf.getPage(page);
        const canvas = canvasRef.current;
        
        if (!canvas) {
          setError('Canvas não disponível');
          setLoading(false);
          return;
        }

        const context = canvas.getContext('2d');
        if (!context) {
          setError('Contexto 2D não disponível');
          setLoading(false);
          return;
        }

        const containerWidth = 800;
        const viewport = pdfPage.getViewport({ scale: 1 });
        const scale = containerWidth / viewport.width;
        const scaledViewport = pdfPage.getViewport({ scale });

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport
        };

        await pdfPage.render(renderContext).promise;
        
        const dataUrl = canvas.toDataURL('image/png');
        setImageUrl(dataUrl);
        
        if (onPageLoad) {
          onPageLoad(dataUrl);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Erro ao renderizar PDF:', error);
        await loadStaticImages();
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <CircularProgress />
        <Typography variant="caption" sx={{ mt: 1 }}>
          {pdfFile ? 'Renderizando página do PDF...' : 'Carregando página...'}
        </Typography>
      </Box>
    );
  }

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
    </Box>
  );
}