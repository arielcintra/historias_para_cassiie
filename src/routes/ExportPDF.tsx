import React, { useState, useEffect, useCallback } from "react";
import {
  Grid,
  Button,
  Paper,
  Stack,
  Typography,
  Checkbox,
  FormControlLabel,
  Box,
} from "@mui/material";
import { useBooks } from "../store/booksContext.tsx";
import StoryPreview from "../components/StoryPreview.tsx";
import PDFViewer from "../components/PDFViewer.tsx";
import type { Collage, Chapter } from "../types";

export default function ExportPDF() {
  const { activeBook } = useBooks();
  const [chapterId, setChapterId] = useState<string | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);

  useEffect(() => {
    if (activeBook && !chapterId) {
      const firstChapter = activeBook.chapters[0];
      if (firstChapter) {
        setChapterId(firstChapter.id);
      }
    }
  }, [activeBook, chapterId]);

  const chapter = activeBook?.chapters.find((c) => c.id === chapterId);

  const refreshPreview = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      refreshPreview();
    };

    const handlePdfCollageUpdate = (event: CustomEvent) => {
      if (
        event.detail.bookId === activeBook?.id &&
        event.detail.chapterId === chapterId
      ) {
        refreshPreview();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(
      "pdfCollageUpdate",
      handlePdfCollageUpdate as EventListener
    );

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "pdfCollageUpdate",
        handlePdfCollageUpdate as EventListener
      );
    };
  }, [refreshPreview, activeBook?.id, chapterId]);

  if (!activeBook) return <Typography>Selecione um livro.</Typography>;

  const handleChapterSelection = (chapterId: string, checked: boolean) => {
    if (checked) {
      setSelectedChapters((prev) => [...prev, chapterId]);
    } else {
      setSelectedChapters((prev) => prev.filter((id) => id !== chapterId));
    }
  };

  const handlePrintMultiple = () => {
    if (selectedChapters.length === 0) return;

    const chaptersToExport = activeBook.chapters.filter((c) =>
      selectedChapters.includes(c.id)
    );
    const w = window.open("", "_blank")!;
    w.document.write(
      renderMultipleChaptersHTML(
        activeBook.title,
        chaptersToExport,
        activeBook.id
      )
    );
    w.document.close();
    w.focus();
    w.print();
  };

  const handlePrint = () => {
    if (!chapter) return;

    let collageToUse = chapter.collage;
    if ("pageNumber" in chapter) {
      const pdfCollages = JSON.parse(
        localStorage.getItem("pdf-collages") || "{}"
      );
      const savedCollage = pdfCollages[`${activeBook.id}-${chapter.id}`];
      collageToUse = savedCollage || chapter.collage;
    }

    if ("pageNumber" in chapter) {
      const imagePath = `${process.env.PUBLIC_URL}/books/${activeBook.id}/page-${chapter.pageNumber}.svg`;
      
      let pageWidth, pageHeight;
      if (activeBook.type === 'pdf' && activeBook.pdfFile) {
        pageWidth = 794;
        pageHeight = 1123;
      }
      
      const w = window.open("", "_blank")!;
      w.document.write(
        renderPrintablePDFHTML(
          activeBook.title,
          chapter.title,
          imagePath,
          collageToUse,
          pageWidth,
          pageHeight
        )
      );
      w.document.close();
      w.focus();
      w.print();
    } else {
      const w = window.open("", "_blank")!;
      w.document.write(
        renderPrintableHTML(
          activeBook.title,
          chapter.title,
          "text" in chapter ? chapter.text : "",
          collageToUse
        )
      );
      w.document.close();
      w.focus();
      w.print();
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Stack spacing={2}>
          <Paper
            sx={{
              p: 3,
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(249,168,212,0.3))",
              borderRadius: 3,
              border: "1px solid rgba(236, 72, 153, 0.2)",
              boxShadow: "0 8px 32px rgba(236, 72, 153, 0.15)",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                color: "#581c87",
                fontWeight: 700,
                fontSize: "1rem",
              }}
            >
              📦 Exportação em Lote
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  const allChapterIds = activeBook.chapters.map(c => c.id);
                  const allSelected = allChapterIds.every(id => selectedChapters.includes(id));
                  
                  if (allSelected) {
                    setSelectedChapters([]);
                  } else {
                    setSelectedChapters(allChapterIds);
                  }
                }}
                sx={{ mb: 2, width: '100%' }}
              >
                {selectedChapters.length === activeBook.chapters.length ? 
                  '❌ Desselecionar Tudo' : 
                  '✅ Selecionar Tudo'
                }
              </Button>
              
              {activeBook.chapters.map((c) => (
                <FormControlLabel
                  key={c.id}
                  control={
                    <Checkbox
                      checked={selectedChapters.includes(c.id)}
                      onChange={(e) =>
                        handleChapterSelection(c.id, e.target.checked)
                      }
                      size="small"
                    />
                  }
                  label={c.title}
                  sx={{
                    display: "block",
                    mb: 0.5,
                    "& .MuiTypography-root": {
                      color: "#581c87",
                      fontWeight: 500,
                    },
                  }}
                />
              ))}
            </Box>
            <Button
              variant="contained"
              size="medium"
              onClick={handlePrintMultiple}
              disabled={selectedChapters.length === 0}
              fullWidth
              sx={{
                py: 1.5,
                borderRadius: 2,
                background:
                  selectedChapters.length > 0
                    ? "linear-gradient(45deg, #ec4899, #d946ef)"
                    : "rgba(156, 163, 175, 0.5)",
                "&:hover": {
                  background:
                    selectedChapters.length > 0
                      ? "linear-gradient(45deg, #be185d, #a21caf)"
                      : "rgba(156, 163, 175, 0.5)",
                },
                fontWeight: 600,
              }}
            >
              📥 Baixar {selectedChapters.length} capítulos
            </Button>
          </Paper>
          <Paper
            sx={{
              p: 3,
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(249,168,212,0.3))",
              borderRadius: 3,
              border: "1px solid rgba(236, 72, 153, 0.2)",
              boxShadow: "0 8px 32px rgba(236, 72, 153, 0.15)",
              height: "fit-content",
              padding: "4px",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: "#581c87",
                fontWeight: 700,
                fontSize: "1rem",
              }}
            >
              👁️ Preview Individual
            </Typography>
          </Paper>
          <Stack spacing={2}>
            {activeBook.chapters.map((c) => (
              <Paper
                key={c.id}
                sx={{
                  p: 2.5,
                  border:
                    c.id === chapterId
                      ? "2px solid #ec4899"
                      : "1px solid rgba(236, 72, 153, 0.2)",
                  background: "rgba(255, 255, 255, 0.9)",
                  borderRadius: 3,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 8px 24px rgba(236, 72, 153, 0.2)",
                  },
                }}
                onClick={() => setChapterId(c.id)}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: "#581c87",
                    fontWeight: 600,
                    mb: 0.5,
                  }}
                >
                  {c.title}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#a855f7",
                    fontWeight: 500,
                  }}
                >
                  {(() => {
                    if ("pageNumber" in c) {
                      const pdfCollages = JSON.parse(
                        localStorage.getItem("pdf-collages") || "{}"
                      );
                      const savedCollage =
                        pdfCollages[`${activeBook.id}-${c.id}`];
                      return savedCollage
                        ? "✨ Editado (PDF + stickers)"
                        : "📄 Sem edição";
                    }
                    return c.collage
                      ? "✨ Editado (história + stickers)"
                      : "📝 Sem edição";
                  })()}
                </Typography>
              </Paper>
            ))}
          </Stack>
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Paper
          sx={{
            p: 3,
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(243,232,255,0.8))",
            borderRadius: 3,
            border: "1px solid rgba(236, 72, 153, 0.2)",
            boxShadow: "0 8px 32px rgba(236, 72, 153, 0.15)",
          }}
        >
          <Typography
            variant="h5"
            sx={{
              mb: 2,
              color: "#581c87",
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            📖 {chapter?.title}
          </Typography>
          {chapter && "pageNumber" in chapter ? (
            <Paper
              key={refreshKey}
              sx={{
                p: 2,
                height: 360,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <PDFViewer
                bookId={activeBook.id}
                pageNumber={chapter.pageNumber}
                pdfFile={activeBook.type === 'pdf' ? activeBook.pdfFile : undefined}
              />
              {(() => {
                const pdfCollages = JSON.parse(
                  localStorage.getItem("pdf-collages") || "{}"
                );
                const savedCollage =
                  pdfCollages[`${activeBook.id}-${chapter.id}`];
                return (savedCollage?.items ?? []).map((it: any) => (
                  <div
                    key={`${it.id}-${refreshKey}`}
                    style={{
                      position: "absolute",
                      left: `calc(${it.x * 100}% - 10px)`,
                      top: `calc(${it.y * 100}% - 10px)`,
                      fontSize: 20,
                      zIndex: 10,
                    }}
                  >
                    {it.emoji.startsWith("data:image/svg+xml") ? (
                      <img
                        src={it.emoji}
                        alt="Custom sticker"
                        style={{ width: 20, height: 20 }}
                      />
                    ) : (
                      it.emoji
                    )}
                  </div>
                ));
              })()}
            </Paper>
          ) : (
            <StoryPreview
              key={refreshKey}
              text={chapter && "text" in chapter ? chapter.text : ""}
              collage={chapter?.collage}
              height={360}
            />
          )}
          <Button
            sx={{
              mt: 3,
              py: 1.5,
              borderRadius: 2,
              background: "linear-gradient(45deg, #ec4899, #d946ef)",
              "&:hover": {
                background: "linear-gradient(45deg, #be185d, #a21caf)",
                transform: "translateY(-2px)",
              },
              fontWeight: 600,
              fontSize: "1rem",
            }}
            variant="contained"
            onClick={handlePrint}
            fullWidth
          >
            📄 Baixar capítulo (PDF)
          </Button>
        </Paper>
      </Grid>
    </Grid>
  );
}

function renderPrintableHTML(
  bookTitle: string,
  chapterTitle: string,
  text: string,
  collage?: Collage
) {
  const items = (collage?.items ?? [])
    .map(
      (it) =>
        `<div style="position:absolute;left:${it.x * 100}%;top:${
          it.y * 100
        }%;transform:translate(-50%,-50%);font-size:28px;">${it.emoji}</div>`
    )
    .join("");
  const escape = (s: string) =>
    s.replace(
      /[&<>]/g,
      (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[m]!)
    );
  return `<!doctype html><html><head><meta charset="utf-8"/><title>${bookTitle} – ${chapterTitle}</title>
<style>body{margin:0;background:#fff;color:#000;font-family:system-ui} .page{min-height:100vh;padding:0} .story{position:relative;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.15);border-radius:16px;padding:24px;min-height:100vh} </style>
</head><body><section class="page"><div class="story"><p>${escape(
    text
  )}</p>${items}</div></section></body></html>`;
}

function renderPrintablePDFHTML(
  bookTitle: string,
  chapterTitle: string,
  imagePath: string,
  collage?: Collage,
  pageWidth?: number,
  pageHeight?: number
) {
  const items = (collage?.items ?? [])
    .map((it) => {
      const emojiContent = it.emoji.startsWith("data:image/svg+xml")
        ? `<img src="${it.emoji}" alt="Custom sticker" style="width:28px;height:28px;"/>`
        : it.emoji;
      return `<div style="position:absolute;left:calc(${
        it.x * 100
      }% - 14px);top:calc(${
        it.y * 100
      }% - 14px);font-size:28px;z-index:10;">${emojiContent}</div>`;
    })
    .join("");

  const containerStyle = pageWidth && pageHeight ? 
    `width:${pageWidth}px;height:${pageHeight}px;` : 
    'width:100%;height:100vh;';

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${bookTitle} – ${chapterTitle}</title>
<style>
@page {
  margin: 0;
  size: ${pageWidth && pageHeight ? `${pageWidth}px ${pageHeight}px` : 'A4'};
}
body{
  margin:0;
  padding:0;
  width:100%;
  height:100%;
  overflow:hidden;
  background:#fff;
} 
.page-container{
  position:relative;
  ${containerStyle}
  margin:0 auto;
  background:#fff;
} 
.pdf-image{
  width:100%;
  height:100%;
  object-fit:contain;
  display:block;
}
.stickers-overlay{
  position:absolute;
  top:0;
  left:0;
  width:100%;
  height:100%;
  pointer-events:none;
}
</style>
</head><body>
<div class="page-container">
  <img src="${imagePath}" alt="Página do livro" class="pdf-image"/>
  <div class="stickers-overlay">${items}</div>
</div>
</body></html>`;
}

function renderMultipleChaptersHTML(
  bookTitle: string,
  chapters: Chapter[],
  bookId: string
) {
  const pagesHTML = chapters
    .map((chapter) => {
      let collageToUse = chapter.collage;

      if ("pageNumber" in chapter) {
        const pdfCollages = JSON.parse(
          localStorage.getItem("pdf-collages") || "{}"
        );
        const savedCollage = pdfCollages[`${bookId}-${chapter.id}`];
        collageToUse = savedCollage || chapter.collage;

        const imagePath = `${process.env.PUBLIC_URL}/books/${bookId}/page-${chapter.pageNumber}.svg`;
        const items = (collageToUse?.items ?? [])
          .map((it) => {
            const emojiContent = it.emoji.startsWith("data:image/svg+xml")
              ? `<img src="${it.emoji}" alt="Custom sticker" style="width:28px;height:28px;"/>`
              : it.emoji;
            return `<div style="position:absolute;left:calc(${
              it.x * 100
            }% - 14px);top:calc(${
              it.y * 100
            }% - 14px);font-size:28px;z-index:10;">${emojiContent}</div>`;
          })
          .join("");

        return `<section class="page"><div class="story"><img src="${imagePath}" alt="Página do livro" class="pdf-image"/>${items}</div></section>`;
      } else {
        const items = (collageToUse?.items ?? [])
          .map(
            (it) =>
              `<div style="position:absolute;left:${it.x * 100}%;top:${
                it.y * 100
              }%;transform:translate(-50%,-50%);font-size:28px;">${
                it.emoji
              }</div>`
          )
          .join("");

        const escape = (s: string) =>
          s.replace(
            /[&<>]/g,
            (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[m]!)
          );

        const text = "text" in chapter ? chapter.text : "";
        return `<section class="page"><div class="story"><p>${escape(
          text
        )}</p>${items}</div></section>`;
      }
    })
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${bookTitle} - Compilado</title>
<style>
body{margin:0;background:#fff;color:#000;font-family:system-ui} 
.page{min-height:100vh;padding:0;page-break-after:always} 
.story{position:relative;background:#fff;border:none;border-radius:0;padding:0;min-height:100vh;display:flex;justify-content:center;align-items:center;} 
.pdf-image{width:100%;height:100%;object-fit:contain;border-radius:0;}
@media print { .page { page-break-after: always; } }
</style>
</head><body>${pagesHTML}</body></html>`;
}
