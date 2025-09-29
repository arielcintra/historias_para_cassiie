import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';

interface PDFViewerProps {
  bookId: string;
  pageNumber: number;
  onPageLoad?: (imageUrl: string) => void;
}

export default function PDFViewer({ bookId, pageNumber, onPageLoad }: PDFViewerProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadPageImage = async () => {
      try {
        setLoading(true);
        setError('');

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
              setError(`Página ${pageNumber} não encontrada`);
              setLoading(false);
            }
          };
          
          img.src = path;
        };
        
        tryLoadImage(svgPath, pngPath);

      } catch (err) {
        console.error('Erro ao carregar página:', err);
        setError('Erro ao carregar página');
        setLoading(false);
      }
    };

    loadPageImage();
  }, [bookId, pageNumber, onPageLoad]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">{error}</Alert>
    );
  }

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {imageUrl && (
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