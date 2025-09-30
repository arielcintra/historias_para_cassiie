import React, { useImperativeHandle, useRef, useState, useEffect } from "react";
import { Alert, AlertTitle, Button, Paper, Typography, Box } from "@mui/material";
import type { Collage, StickerItem, Chapter } from "../types";
import PDFViewer from "./PDFViewer.tsx";
import { useBooks } from "../store/booksContext.tsx";

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export interface StickerCanvasHandle {
  add: (emoji: string) => void;
  toCollage: () => Collage;
  deleteSelected: () => void;
}
export default React.forwardRef<
  StickerCanvasHandle,
  { text: string; initial?: Collage; chapter?: Chapter }
>(function StickerCanvas({ text, initial, chapter }, ref) {
  const { activeBook } = useBooks();
  const [items, setItems] = useState<StickerItem[]>(initial?.items ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (chapter && 'pageNumber' in chapter) {
      const pdfCollages = JSON.parse(localStorage.getItem('pdf-collages') || '{}');
      const savedCollage = pdfCollages[`${chapter.id.split('-chapter-')[0]}-${chapter.id}`];
      setItems(savedCollage?.items ?? initial?.items ?? []);
    } else {
      setItems(initial?.items ?? []);
    }
    setSelectedId(null);
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

  return (
    <Paper
      ref={boxRef}
      onMouseMove={onMove}
      onMouseUp={onUp}
      onClick={onCanvasClick}
      sx={{ p: 2, minHeight: 380, position: "relative" }}
    >
      <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
        Prévia da história
      </Typography>
      
      {isPDFChapter && bookId ? (
        <Box sx={{ position: 'relative', mt: 2 }}>
          <PDFViewer 
            bookId={bookId} 
            pageNumber={chapter.pageNumber}
            pdfFile={activeBook?.type === 'pdf' ? activeBook.pdfFile : undefined}
          />
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
