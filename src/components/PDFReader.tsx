import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, AppBar, Toolbar, IconButton, Typography, Box, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import PDFViewer from './PDFViewer.tsx';

export default function PDFReader({
  open,
  onClose,
  bookId,
  totalPages,
  initialPage = 1,
  pdfFile,
  pdfPath,
}: {
  open: boolean;
  onClose: () => void;
  bookId: string;
  totalPages: number;
  initialPage?: number;
  pdfFile?: File;
  pdfPath?: string;
}) {
  const [page, setPage] = useState(Math.max(1, initialPage));

  useEffect(() => {
    if (open) setPage(Math.max(1, initialPage));
  }, [open, initialPage]);

  const spreadStart = useMemo(() => (page % 2 === 0 ? page - 1 : page), [page]);
  const leftPage = Math.max(1, spreadStart);
  const rightPage = leftPage + 1 <= totalPages ? leftPage + 1 : undefined;

  const canPrev = leftPage > 1;
  const canNext = (rightPage ?? leftPage) < totalPages;

  const prev = () => {
    if (!canPrev) return;
    const nextStart = Math.max(1, leftPage - 2);
    setPage(nextStart);
  };
  const next = () => {
    if (!canNext) return;
    const nextStart = (rightPage ?? leftPage) + 1;
    setPage(nextStart);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, leftPage, rightPage]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: 'hidden',
        },
      }}
    >
      <AppBar position="relative" color="transparent" elevation={0} sx={{ borderBottom: '1px solid #eee' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
            Leitor • Páginas {leftPage}{rightPage ? `–${rightPage}` : ''} / {totalPages}
          </Typography>
          <Button color="inherit" onClick={prev} disabled={!canPrev} startIcon={<NavigateBeforeIcon />}>Anterior</Button>
          <Button color="inherit" onClick={next} disabled={!canNext} endIcon={<NavigateNextIcon />}>Próxima</Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 2, background: 'linear-gradient(180deg, #f8fafc, #f1f5f9)' }}>
        <Box
          sx={{
            mx: 'auto',
            maxWidth: 1200,
            display: 'grid',
            gridTemplateColumns: rightPage ? '1fr 1fr' : '1fr',
            gap: 2,
            alignItems: 'stretch',
          }}
        >
          <Box sx={{
            p: 1,
            bgcolor: '#fff',
            borderRadius: 1,
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            position: 'relative',
          }}>
            <PDFViewer bookId={bookId} pageNumber={leftPage} pdfFile={pdfFile} pdfPath={pdfPath} />
            <Box sx={{ position: 'absolute', top: 0, right: -8, width: 16, height: '100%', filter: 'blur(4px)', background: 'linear-gradient(90deg, rgba(0,0,0,0.06), transparent)' }} />
          </Box>
          {rightPage && (
            <Box sx={{
              p: 1,
              bgcolor: '#fff',
              borderRadius: 1,
              boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
              position: 'relative',
            }}>
              <PDFViewer bookId={bookId} pageNumber={rightPage} pdfFile={pdfFile} pdfPath={pdfPath} />
              <Box sx={{ position: 'absolute', top: 0, left: -8, width: 16, height: '100%', filter: 'blur(4px)', background: 'linear-gradient(270deg, rgba(0,0,0,0.06), transparent)' }} />
            </Box>
          )}
        </Box>
      </Box>
    </Dialog>
  );
}

