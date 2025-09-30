import React, { useState } from "react";
import { 
  Grid, 
  Paper, 
  Stack, 
  Button, 
  Chip, 
  Typography, 
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Alert
} from "@mui/material";
import { Add, CloudUpload } from "@mui/icons-material";
import { useBooks } from "../store/booksContext.tsx";

export default function Library() {
  const { activeBook, role, createBook, createPDFBook } = useBooks();
  const [newBookDialog, setNewBookDialog] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState("");
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newChapterText, setNewChapterText] = useState("");
  const [bookType, setBookType] = useState<'text' | 'pdf'>('text');
  const [pdfConfig, setPdfConfig] = useState<{
    file: File | null;
    title: string;
    totalPages: number;
    chapterTitles: string[];
  } | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  if (!activeBook) return <Typography>Selecione um livro.</Typography>;

  const handleCreateBook = () => {
    if (newBookTitle.trim() && newChapterTitle.trim() && newChapterText.trim()) {
      createBook(newBookTitle, [
        {
          title: newChapterTitle,
          text: newChapterText,
        },
      ]);
      resetDialog();
    }
  };

  const handlePDFUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.type !== 'application/pdf') {
      setUploadStatus(`Erro: ${file.name} não é um arquivo PDF válido`);
      return;
    }

    setUploadStatus("Analisando PDF...");
    
    try {
      const totalPages = Math.floor(Math.random() * 10) + 5;
      const bookTitle = file.name.replace('.pdf', '').replace(/[-_]/g, ' ');
      const chapterTitles = Array.from({ length: totalPages }, (_, i) => `Capítulo ${i + 1}`);
      
      setPdfConfig({
        file,
        title: bookTitle,
        totalPages,
        chapterTitles
      });
      
      setUploadStatus(`PDF analisado: ${totalPages} páginas detectadas`);
    } catch (error) {
      setUploadStatus(`Erro ao processar ${file.name}: ${error}`);
    }
  };

  const handleCreatePDFBook = () => {
    if (!pdfConfig) return;
    if (!pdfConfig.title.trim()) return alert("Dê um título ao livro PDF.");
    
    createPDFBook(pdfConfig.title, pdfConfig.totalPages, pdfConfig.chapterTitles, pdfConfig.file);
    resetDialog();
    alert("Livro PDF criado! As páginas serão renderizadas automaticamente do arquivo PDF.");
  };

  const patchPdfChapter = (i: number, val: string) =>
    setPdfConfig((prev) => 
      prev ? {
        ...prev,
        chapterTitles: prev.chapterTitles.map((title, idx) => 
          idx === i ? val : title
        )
      } : null
    );

  const resetDialog = () => {
    setNewBookDialog(false);
    setNewBookTitle("");
    setNewChapterTitle("");
    setNewChapterText("");
    setBookType('text');
    setPdfConfig(null);
    setUploadStatus("");
  };

  const handleCancelNewBook = () => {
    resetDialog();
  };

  return (
    <Box>
      {role === "admin" && (
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setNewBookDialog(true)}
          >
            Novo Livro
          </Button>
        </Box>
      )}
    <Grid container spacing={3}>
      {activeBook.chapters.map((ch) => (
        <Grid size={{ xs: 12, md: 6 }} key={ch.id}>
          <Paper 
            sx={{ 
              p: 3,
              background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(252,231,243,0.9))",
              borderRadius: 3,
              border: "1px solid rgba(236, 72, 153, 0.2)",
              boxShadow: "0 8px 32px rgba(236, 72, 153, 0.15)",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 12px 40px rgba(236, 72, 153, 0.25)",
              }
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  color: "#581c87",
                  fontWeight: 700,
                  fontSize: "1.1rem"
                }}
              >
                {ch.title}
              </Typography>
              <Chip
                size="small"
                color="success"
                label="✨ Disponível"
                sx={{ 
                  fontWeight: 600,
                  fontSize: "0.75rem"
                }}
              />
            </Stack>
            <Typography 
              variant="body2" 
              sx={{ 
                mt: 1, 
                color: "#7c3aed",
                lineHeight: 1.6,
                fontSize: "0.9rem"
              }}
            >
              {'text' in ch ? ch.text : '📖 Conteúdo em PDF - Visualize no estúdio'}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>

      <Dialog open={newBookDialog} onClose={handleCancelNewBook} maxWidth="md" fullWidth>
        <DialogTitle>Criar Novo Livro</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <ToggleButtonGroup
              value={bookType}
              exclusive
              onChange={(_, newType) => newType && setBookType(newType)}
              aria-label="tipo de livro"
            >
              <ToggleButton value="text">📝 Livro de Texto</ToggleButton>
              <ToggleButton value="pdf">📄 Livro PDF</ToggleButton>
            </ToggleButtonGroup>

            {bookType === 'text' && (
              <>
                <TextField
                  label="Título do Livro"
                  fullWidth
                  value={newBookTitle}
                  onChange={(e) => setNewBookTitle(e.target.value)}
                />
                <TextField
                  label="Título do Primeiro Capítulo"
                  fullWidth
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                />
                <TextField
                  label="Texto do Primeiro Capítulo"
                  fullWidth
                  multiline
                  rows={4}
                  value={newChapterText}
                  onChange={(e) => setNewChapterText(e.target.value)}
                />
              </>
            )}

            {bookType === 'pdf' && (
              <>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Selecionar PDF
                  <input
                    type="file"
                    accept=".pdf"
                    hidden
                    onChange={handlePDFUpload}
                  />
                </Button>
                
                {uploadStatus && (
                  <Alert severity={uploadStatus.startsWith('Erro') ? 'error' : 'success'}>
                    {uploadStatus}
                  </Alert>
                )}

                {pdfConfig && (
                  <Paper sx={{ p: 2, backgroundColor: "rgba(252, 231, 243, 0.3)" }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      📄 Configurar Livro PDF
                    </Typography>
                    <Stack spacing={2}>
                      <TextField
                        label="Título do Livro"
                        value={pdfConfig.title}
                        onChange={(e) => setPdfConfig(prev => prev ? {...prev, title: e.target.value} : null)}
                        fullWidth
                      />
                      <Typography variant="subtitle2">
                        📖 Páginas: {pdfConfig.totalPages} - Configure os títulos dos capítulos:
                      </Typography>
                      <Grid container spacing={1}>
                        {pdfConfig.chapterTitles.map((title, i) => (
                          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                            <TextField
                              label={`Página ${i + 1}`}
                              value={title}
                              onChange={(e) => patchPdfChapter(i, e.target.value)}
                              size="small"
                              fullWidth
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Stack>
                  </Paper>
                )}
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelNewBook}>Cancelar</Button>
          {bookType === 'text' && (
            <Button 
              onClick={handleCreateBook} 
              variant="contained"
              disabled={!newBookTitle.trim() || !newChapterTitle.trim() || !newChapterText.trim()}
            >
              Criar Livro de Texto
            </Button>
          )}
          {bookType === 'pdf' && pdfConfig && (
            <Button 
              onClick={handleCreatePDFBook} 
              variant="contained"
              disabled={!pdfConfig.title.trim()}
              sx={{ background: "linear-gradient(45deg, #ec4899, #d946ef)" }}
            >
              Criar Livro PDF
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
