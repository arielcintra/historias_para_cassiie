import React, { useState, useEffect, useCallback, useRef } from "react";
import { Grid, Button, Paper, Stack, Typography, Box, Chip } from "@mui/material";
import { useBooks } from "../store/booksContext.tsx";
import type { Collage, Chapter } from "../types";
import { loadPDFDocument, renderPDFPageToCanvas } from "../utils/pdfUtils.ts";
import { getPageStorage } from "../storage/index.ts";

export default function ExportPDF() {
  const { activeBook } = useBooks();
  const [chapterId, setChapterId] = useState<string | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [previewImages, setPreviewImages] = useState<Record<string, string>>({});

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

  const pdfDocRef = useRef<any | null>(null);
  const pageImageCache = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!activeBook) return;
    (async () => {
      if (!activeBook) return;
      const updates: Record<string, string> = {};
      for (const id of selectedChapters) {
        const c = activeBook.chapters.find((ch) => ch.id === id);
        if (!c || !("pageNumber" in c)) continue;
        if (!previewImages[id]) {
          try {
            updates[id] = await getPdfPageDataUrl(c.pageNumber);
          } catch {
            // ignore errors
          }
        }
      }
      if (Object.keys(updates).length) {
        setPreviewImages((prev) => ({ ...prev, ...updates }));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChapters, activeBook?.id]);

  if (!activeBook) return <Typography>Selecione um livro.</Typography>;

  const addSelect = (chapterId: string) => {
    setSelectedChapters((prev) => (prev.includes(chapterId) ? prev : [...prev, chapterId]));
  };
  const removeSelect = (chapterId: string) => {
    setSelectedChapters((prev) => prev.filter((id) => id !== chapterId));
  };

  const getPdfPageDataUrl = async (pageNumber: number): Promise<string> => {
    if (!activeBook || activeBook.type !== 'pdf') {
      throw new Error('PDF not available');
    }
    // Cache by chapter key
    const key = `${activeBook.id}-${pageNumber}`;
    if (pageImageCache.current[key]) return pageImageCache.current[key];

    // If we don't have the file, try persistent preview cache (Drive or Local)
    if (!activeBook.pdfFile) {
      const cached = await getPageStorage().getPage(activeBook.id, pageNumber);
      if (cached) {
        pageImageCache.current[key] = cached;
        return cached;
      }
      throw new Error('No PDF file or cached preview available');
    }

    // Load or reuse the PDF document
    if (!pdfDocRef.current) {
      const buffer = await activeBook.pdfFile.arrayBuffer();
      pdfDocRef.current = await loadPDFDocument(buffer);
    }
    const pdfPage = await pdfDocRef.current.getPage(pageNumber);
    const canvas = document.createElement('canvas');
    const dataUrl = await renderPDFPageToCanvas(pdfPage, canvas, 800);
    pageImageCache.current[key] = dataUrl;
    // Save via configured storage
    try { await getPageStorage().setPage(activeBook.id, pageNumber, dataUrl); } catch {}
    return dataUrl;
  };

  const handlePrintMultiple = async () => {
    if (selectedChapters.length === 0) return;

    const chaptersToExport = activeBook.chapters.filter((c) =>
      selectedChapters.includes(c.id)
    );
    const imageMap: Record<string, string> = {};
    if (activeBook.type === 'pdf') {
      // Pre-render or fetch cached for all PDF chapters
      for (const c of chaptersToExport) {
        if ('pageNumber' in c) {
          try {
            imageMap[c.id] = await getPdfPageDataUrl(c.pageNumber);
          } catch (e) {
            // ignore; will fallback to static path logic later
          }
        }
      }
    }

    const w = window.open("", "_blank")!;
    // Prefer dynamic renderer when we have images
    const html = Object.keys(imageMap).length > 0
      ? renderMultipleChaptersHTMLDynamic(
          activeBook.title,
          chaptersToExport,
          activeBook.id,
          imageMap
        )
      : renderMultipleChaptersHTML(
          activeBook.title,
          chaptersToExport,
          activeBook.id
        );
    // Write synchronously to avoid blank page
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    // window.print() will be triggered by the HTML's script after images load
  };

  const handlePrint = async () => {
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
      let imagePath = `${process.env.PUBLIC_URL}/books/${activeBook.id}/page-${chapter.pageNumber}.svg`;
      // For uploaded PDFs, render the page to an image on the fly
      if (activeBook.type === 'pdf') {
        try {
          imagePath = await getPdfPageDataUrl(chapter.pageNumber);
        } catch {
          // fallback keeps the static path attempt
        }
      }

      const w = window.open("", "_blank")!;
      const html = renderPrintablePDFHTML(
        activeBook.title,
        chapter.title,
        imagePath,
        collageToUse
      );
      w.document.open();
      w.document.write(html);
      w.document.close();
      w.focus();
    } else {
      const w = window.open("", "_blank")!;
      const html = renderPrintableHTML(
        activeBook.title,
        chapter.title,
        "text" in chapter ? chapter.text : "",
        collageToUse
      );
      w.document.open();
      w.document.write(html);
      w.document.close();
      w.focus();
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Stack spacing={2}>
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h6">Páginas</Typography>
            <Stack direction="row" spacing={1}>
                <Button size="small" onClick={() => setSelectedChapters([])} sx={{ minWidth: 0, px: 1, py: 0.5, fontSize: '0.75rem' }}>Limpar</Button>
                <Button size="small" variant="outlined" onClick={() => setSelectedChapters(activeBook.chapters.map(c => c.id))} sx={{ minWidth: 0, px: 1, py: 0.5, fontSize: '0.75rem' }}>Selecionar Tudo</Button>
            </Stack>
          </Stack>
            <Stack spacing={1}>
              {activeBook.chapters.map((c) => (
                <Paper key={c.id} onClick={() => addSelect(c.id)} sx={{ p: 1, cursor: 'pointer', border: selectedChapters.includes(c.id) ? '2px solid #ec4899' : '1px solid #e5e7eb' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip size="small" label={selectedChapters.indexOf(c.id) >= 0 ? `#${selectedChapters.indexOf(c.id) + 1}` : ''} />
                    <Typography sx={{ flex: 1 }}>{c.title}</Typography>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Paper>
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, md: 8 }}>
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="h6">Pré-visualização</Typography>
            <Button variant="contained" onClick={handlePrintMultiple} disabled={selectedChapters.length === 0}>Imprimir {selectedChapters.length} página(s)</Button>
          </Stack>
          <Box sx={{ maxHeight: 640, overflowY: 'auto' }}>
            {selectedChapters.length === 0 && (
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Selecione páginas para pré-visualizar e exportar.</Typography>
            )}
            <Stack spacing={2}>
              {selectedChapters.map((id) => {
                const c = activeBook.chapters.find((ch) => ch.id === id);
                if (!c) return null;
                let collageToUse = c.collage;
                if ('pageNumber' in c) {
                  const pdfCollages = JSON.parse(localStorage.getItem('pdf-collages') || '{}');
                  const saved = pdfCollages[`${activeBook.id}-${c.id}`];
                  collageToUse = saved || c.collage;
                }
                const img = previewImages[id];
                return (
                  <Box key={id} sx={{ position: 'relative', border: '1px solid #e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => removeSelect(id)}
                      sx={{ position: 'absolute', top: 8, right: 8, zIndex: 20, minWidth: 0, p: '2px 6px' }}
                    >
                      ✖
                    </Button>
                    {img ? (
                      <img src={img} alt={c.title} style={{ width: '100%', display: 'block' }} />
                    ) : (
                      <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="caption">Carregando prévia...</Typography>
                      </Box>
                    )}
                    <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                      {(collageToUse?.items ?? []).map((it: any) => (
                        <div key={it.id} style={{ position: 'absolute', left: `${it.x * 100}%`, top: `${it.y * 100}%`, transform: 'translate(-50%,-50%)', fontSize: 20, zIndex: 10 }}>
                          {typeof it.emoji === 'string' && it.emoji.startsWith('data:image/svg+xml') ? (
                            <img src={it.emoji} alt="Custom sticker" style={{ width: 20, height: 20 }} />
                          ) : (
                            it.emoji
                          )}
                        </div>
                      ))}
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </Box>
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
      return `<div style="position:absolute;left:${
        it.x * 100
      }%;top:${
        it.y * 100
      }%;transform:translate(-50%,-50%);font-size:28px;z-index:10;">${emojiContent}</div>`;
    })
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${bookTitle} – ${chapterTitle}</title>
<style>
@page {
  margin: 0;
  size: A4;
}
body{
  margin:0;
  padding:0;
  width:210mm;
  height:297mm;
  overflow:hidden;
  background:#fff;
} 
.page-container{
  position:relative;
  width:210mm;
  height:297mm;
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
<script>
  (function(){
    function printWhenReady(){
      var imgs = Array.from(document.images||[]);
      if(imgs.length===0){ window.print(); return; }
      var remaining = imgs.length;
      var done = function(){ if(--remaining===0){ window.print(); } };
      imgs.forEach(function(img){
        if (img.complete) { done(); }
        else { img.addEventListener('load', done); img.addEventListener('error', done); }
      });
      setTimeout(function(){ if(remaining>0) window.print(); }, 2000);
    }
    window.addEventListener('load', printWhenReady);
  })();
</script>
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
            return `<div style="position:absolute;left:${
              it.x * 100
            }%;top:${
              it.y * 100
            }%;transform:translate(-50%,-50%);font-size:28px;z-index:10;">${emojiContent}</div>`;
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
</head><body>${pagesHTML}
<script>
  (function(){
    function printWhenReady(){
      var imgs = Array.from(document.images||[]);
      if(imgs.length===0){ window.print(); return; }
      var remaining = imgs.length;
      var done = function(){ if(--remaining===0){ window.print(); } };
      imgs.forEach(function(img){
        if (img.complete) { done(); }
        else { img.addEventListener('load', done); img.addEventListener('error', done); }
      });
      setTimeout(function(){ if(remaining>0) window.print(); }, 2000);
    }
    window.addEventListener('load', printWhenReady);
  })();
</script>
</body></html>`;
}

function renderMultipleChaptersHTMLDynamic(
  bookTitle: string,
  chapters: Chapter[],
  bookId: string,
  imageMap: Record<string, string>
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

        const imagePath = imageMap[chapter.id];
        const items = (collageToUse?.items ?? [])
          .map((it) => {
            const emojiContent = it.emoji.startsWith("data:image/svg+xml")
              ? `<img src="${it.emoji}" alt="Custom sticker" style="width:28px;height:28px;"/>`
              : it.emoji;
            return `<div style="position:absolute;left:${
              it.x * 100
            }%;top:${
              it.y * 100
            }%;transform:translate(-50%,-50%);font-size:28px;z-index:10;">${emojiContent}</div>`;
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
</head><body>${pagesHTML}
<script>
  (function(){
    function printWhenReady(){
      var imgs = Array.from(document.images||[]);
      if(imgs.length===0){ window.print(); return; }
      var remaining = imgs.length;
      var done = function(){ if(--remaining===0){ window.print(); } };
      imgs.forEach(function(img){
        if (img.complete) { done(); }
        else { img.addEventListener('load', done); img.addEventListener('error', done); }
      });
      setTimeout(function(){ if(remaining>0) window.print(); }, 2000);
    }
    window.addEventListener('load', printWhenReady);
  })();
</script>
</body></html>`;
}
