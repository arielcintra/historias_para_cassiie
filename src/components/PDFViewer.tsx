import React, { useEffect, useState, useRef } from 'react';
import { Box, CircularProgress, Alert, Typography } from '@mui/material';
import { loadPDFDocument, renderPDFPageToCanvas } from '../utils/pdfUtils.ts';

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
          console.log('PDFViewer: Tentando carregar imagens estáticas');
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
        const canvas = canvasRef.current;
        
        if (!canvas) {
          setError('Canvas não disponível');
          setLoading(false);
          return;
        }

        const dataUrl = await renderPDFPageToCanvas(pdfPage, canvas);
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