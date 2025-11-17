import React, { useImperativeHandle, useRef, useState, useEffect } from "react";
import { Alert, AlertTitle, Button, Paper, Typography, Box } from "@mui/material";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";
import type { Collage, StickerItem, Chapter } from "../types";
import PDFViewer from "./PDFViewer.tsx";
import PDFReader from "./PDFReader.tsx";
import { useBooks } from "../store/booksContext.tsx";

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export interface StickerCanvasHandle {
  add: (emoji: string) => void;
  toCollage: () => Collage;
  deleteSelected: () => void;
}
export default React.forwardRef<
  StickerCanvasHandle,
  { text: string; initial?: Collage; chapter?: Chapter; onAutoSaveStatusChange?: (saving: boolean) => void }
>(function StickerCanvas({ text, initial, chapter, onAutoSaveStatusChange }, ref) {
  const { activeBook } = useBooks();
  const [items, setItems] = useState<StickerItem[]>(initial?.items ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef<boolean>(false);

  useEffect(() => {
    if (chapter && 'pageNumber' in chapter) {
      const pdfCollages = JSON.parse(localStorage.getItem('pdf-collages') || '{}');
      const savedCollage = pdfCollages[`${chapter.id.split('-chapter-')[0]}-${chapter.id}`];
      setItems(savedCollage?.items ?? initial?.items ?? []);
    } else {
      setItems(initial?.items ?? []);
    }
    setSelectedId(null);
    mountedRef.current = false; // reset mount flag so first items effect doesn't autosave
  }, [initial, chapter]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId) {
          deleteSticker(selectedId);
        }
      }
      if (e.key === "Escape") {
        setSelectedId(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedId]);

  const deleteSticker = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  useImperativeHandle(
    ref,
    () => ({
      add(emoji) {
        setItems((p) => [
          ...p,
          {
            id: crypto.randomUUID(),
            emoji,
            x: 0.3,
            y: 0.3,
            scale: 1,
            rotation: 0,
          },
        ]);
      },
      toCollage() {
        return { id: "col-" + Date.now(), items };
      },
      deleteSelected() {
        if (selectedId) {
          deleteSticker(selectedId);
        }
      },
    }),
    [items, selectedId]
  );

  const onDown = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    drag.current = id;
    setSelectedId(id);

    longPressTimer.current = setTimeout(() => {
      if (window.confirm("Deletar este sticker?")) {
        deleteSticker(id);
      }
    }, 800);
  };
  const onMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!drag.current || !boxRef.current) return;

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    const rect = boxRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setItems((arr) =>
      arr.map((it) =>
        it.id === drag.current ? { ...it, x: clamp01(x), y: clamp01(y) } : it
      )
    );
  };
  const onUp = () => {
    drag.current = null;
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const onContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    return (
      <Alert severity="warning" sx={{ mt: 1 }}>
        <AlertTitle>Atenção</AlertTitle>
        Tem certeza que deseja deletar este sticker?
        <Button onClick={() => deleteSticker(id)}>Deletar</Button>
      </Alert>
    );
  };

  const onCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedId(null);
    }
  };

  const isPDFChapter = chapter && 'pageNumber' in chapter;
  const bookId = chapter?.id.split('-chapter-')[0];
  const totalPages = activeBook?.type === 'pdf' ? (activeBook as any).totalPages : undefined;

  const [readerOpen, setReaderOpen] = useState(false);
  const [readerPage, setReaderPage] = useState<number>(isPDFChapter ? (chapter as any).pageNumber : 1);

  useEffect(() => {
    if (isPDFChapter) {
      setReaderPage((chapter as any).pageNumber);
    }
  }, [isPDFChapter, chapter]);

  // Page state used to seed the floating reader

  console.log('StickerCanvas: chapter:', chapter);
  console.log('StickerCanvas: activeBook:', activeBook);
  console.log('StickerCanvas: isPDFChapter:', isPDFChapter);
  console.log('StickerCanvas: bookId:', bookId);
  console.log('StickerCanvas: pdfFile exists:', !!(activeBook?.type === 'pdf' && activeBook.pdfFile));

  // Autosave when items change (debounced)
  const { saveCollage } = useBooks();
  useEffect(() => {
    if (!chapter) return;
    if (!mountedRef.current) {
      mountedRef.current = true; // skip initial set
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    onAutoSaveStatusChange?.(true);
    saveTimer.current = setTimeout(() => {
      try {
        saveCollage(chapter.id, { id: "col-" + Date.now(), items });
      } finally {
        onAutoSaveStatusChange?.(false);
      }
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [items]);

  return (
    <Paper
      ref={boxRef}
      onMouseMove={onMove}
      onMouseUp={onUp}
      onClick={onCanvasClick}
      sx={{ p: 2, minHeight: 380, position: "relative" }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="subtitle1">
          Prévia da história
        </Typography>
        {isPDFChapter && bookId && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<ZoomOutMapIcon />}
            onClick={() => setReaderOpen(true)}
            sx={{ alignSelf: 'flex-start' }}
          >
            Maximizar
          </Button>
        )}
      </Box>
      
      {isPDFChapter && bookId ? (
        <Box sx={{ position: 'relative', mt: 2 }}>
          <PDFViewer 
            bookId={bookId} 
            pageNumber={chapter.pageNumber}
            pdfFile={activeBook?.type === 'pdf' ? activeBook.pdfFile : undefined}
          />

          {readerOpen && totalPages && (
            <PDFReader
              open={readerOpen}
              onClose={() => setReaderOpen(false)}
              bookId={bookId}
              totalPages={totalPages}
              initialPage={readerPage}
              pdfFile={activeBook?.type === 'pdf' ? activeBook.pdfFile : undefined}
            />
          )}
        </Box>
      ) : (
        <Typography variant="body2" sx={{ opacity: 0.9, mt: 2 }}>
          {text}
        </Typography>
      )}

      {items.map((it) => (
        <div
          key={it.id}
          onMouseDown={(e) => onDown(e, it.id)}
          onContextMenu={(e) => onContextMenu(e, it.id)}
          style={{
            position: "absolute",
            left: `${it.x * 100}%`,
            top: `${it.y * 100}%`,
            transform: `translate(-50%,-50%) scale(${it.scale}) rotate(${it.rotation}deg)`,
            fontSize: 28,
            cursor: "grab",
            border:
              selectedId === it.id
                ? "2px solid #8b5cf6"
                : "2px solid transparent",
            borderRadius: "4px",
            padding: "2px",
            zIndex: 10,
          }}
        >
          {it.emoji.startsWith("data:image/svg+xml") ? (
            <img
              src={it.emoji}
              alt="Custom sticker"
              style={{ width: 28, height: 28, pointerEvents: "none" }}
            />
          ) : (
            it.emoji
          )}
        </div>
      ))}
    </Paper>
  );
});
