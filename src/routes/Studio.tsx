import React, { useRef, useState, useEffect } from "react";
import { Grid, Button, Stack, Typography, Tooltip } from "@mui/material";
import { Delete, Add } from "@mui/icons-material";
import { useBooks } from "../store/booksContext.tsx";
import StickerTray from "../components/StickerTray.tsx";
import StickerCanvas, {
  type StickerCanvasHandle,
} from "../components/StickerCanvas.tsx";
import StoryPreview from "../components/StoryPreview.tsx";

export default function Studio() {
  const { activeBook, saveCollage } = useBooks();
  const [chapterId, setChapterId] = useState<string | undefined>();

  useEffect(() => {
    if (activeBook && !chapterId) {
      const firstUnlockedChapter = activeBook.chapters.find((c) => c.unlocked);
      if (firstUnlockedChapter) {
        setChapterId(firstUnlockedChapter.id);
      }
    }
  }, [activeBook, chapterId]);
  const chapter = activeBook?.chapters.find((c) => c.id === chapterId);
  const ref = useRef<StickerCanvasHandle>(null);
  const [showStickerTray, setShowStickerTray] = useState(true);

  if (!activeBook) return <Typography>Selecione um livro.</Typography>;

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              color: "#581c87",
              fontWeight: 700
            }}
          >
            🎨 Editando: {chapter?.title ?? "—"}
          </Typography>
          <Button
            variant="contained"
            onClick={() =>
              chapterId && saveCollage(chapterId, ref.current?.toCollage())
            }
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              background: "linear-gradient(45deg, #9862c7ff, #a83dc5ff)",
              "&:hover": {
                background: "linear-gradient(45deg, #9862c7ff, #a83dc5ff)",
                transform: "translateY(-2px)",
              },
              fontWeight: 600
            }}
          >
            💾 Salvar
          </Button>
        </Stack>
        <StickerCanvas
          ref={ref}
          text={(chapter && 'text' in chapter) ? chapter.text : ""}
          initial={chapter?.collage}
          chapter={chapter}
        />
        <Stack direction="row" spacing={2} sx={{ mt: 3, alignItems: 'center', justifyContent: 'center' }}>
          <Button
            variant="contained"
            size="medium"
            startIcon={<Add />}
            onClick={() => setShowStickerTray(!showStickerTray)}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              background: showStickerTray 
                ? "linear-gradient(45deg, #8f5ebaff, #b371d1ff)" 
                : "linear-gradient(45deg, #ec4899, #d946ef)",
              "&:hover": {
                background: showStickerTray 
                  ? "linear-gradient(45deg, #8f5ebaff, #b371d1ff)" 
                  : "linear-gradient(45deg, #be185d, #a21caf)",
                transform: "translateY(-2px)",
              },
              fontWeight: 600
            }}
          >
            {showStickerTray ? '👁️ Ocultar Stickers' : '✨ Adicionar Sticker'}
          </Button>
          
          <Tooltip 
            title="Clique direito no sticker para deletar • Pressione Delete/Backspace • Clique longo no mobile"
            arrow
            placement="top"
          >
            <Button
              variant="outlined"
              size="medium"
              startIcon={<Delete />}
              onClick={() => ref.current?.deleteSelected()}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.5,
                borderColor: "#ef4444",
                color: "#dc2626",
                background: "rgba(255, 255, 255, 0.9)",
                "&:hover": {
                  background: "linear-gradient(45deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1))",
                  borderColor: "#dc2626",
                  transform: "translateY(-2px)",
                },
                fontWeight: 600
              }}
            >
              Deletar Selecionado
            </Button>
          </Tooltip>
        </Stack>
        
        {showStickerTray && (
          <StickerTray onAdd={(emoji: any) => ref.current?.add(emoji)} />
        )}
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Stack spacing={2}>
          {activeBook.chapters
            .filter((c) => c.unlocked)
            .map((c) => (
              <div
                key={c.id}
                onClick={() => setChapterId(c.id)}
                style={{ cursor: "pointer" }}
              >
                <StoryPreview 
                  text={('text' in c) ? c.text : `${c.title} - Página ${c.pageNumber}`} 
                  collage={c.collage} 
                />
              </div>
            ))}
        </Stack>
      </Grid>
    </Grid>
  );
}
