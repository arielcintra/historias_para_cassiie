import React, { useState } from "react";
import {
  Box,
  Button,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
  Alert,
  Divider,
} from "@mui/material";
import { CloudUpload } from "@mui/icons-material";
import { useBooks } from "../store/booksContext.tsx";
import { loadPDFDocument } from "../utils/pdfUtils.ts";
import { GRADIENTS } from "../constants/theme.ts";

export default function Admin() {
  const { createBook, createPDFBook, role, activeBook, deleteBook } = useBooks();
  const [title, setTitle] = useState("");
  const [chapters, setChapters] = useState<{ title: string; text: string }[]>([
    { title: "", text: "" },
  ]);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [pdfConfig, setPdfConfig] = useState<{
    file: File | undefined;
    title: string;
    totalPages: number;
    chapterTitles: string[];
  } | null>(null);

  const addChapter = () => setChapters((c) => [...c, { title: "", text: "" }]);
  const patch = (i: number, field: "title" | "text", val: string) =>
    setChapters((arr) =>
      arr.map((c, idx) => (idx === i ? { ...c, [field]: val } : c))
    );

  const patchPdfChapter = (i: number, val: string) =>
    setPdfConfig((prev) => 
      prev ? {
        ...prev,
        chapterTitles: prev.chapterTitles.map((title, idx) => 
          idx === i ? val : title
        )
      } : null
    );

  const handlePDFUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const isPDF = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    if (!isPDF) {
      setUploadStatus(`Erro: ${file.name} não é um arquivo PDF válido`);
      return;
    }

    setUploadStatus("Analisando PDF...");
    
    try {
      console.log('Iniciando análise do PDF:', file.name);
      
      const arrayBuffer = await file.arrayBuffer();
      console.log('Array buffer criado, tamanho:', arrayBuffer.byteLength);
      
      const pdf = await loadPDFDocument(arrayBuffer);
      console.log('PDF carregado, objeto:', pdf);
      
      const totalPages = pdf.numPages;
      console.log('Número de páginas detectadas:', totalPages);
      
      const bookTitle = file.name.replace('.pdf', '').replace(/[-_]/g, ' ');
      const chapterTitles = Array.from({ length: totalPages }, (_, i) => `Pagina ${i + 1}`);
      
      console.log('Configuração do PDF:', {
        title: bookTitle,
        totalPages,
        chapterTitles
      });
      
      setPdfConfig({
        file,
        title: bookTitle,
        totalPages,
        chapterTitles
      });
      
      setUploadStatus(`PDF analisado: ${totalPages} páginas detectadas`);
    } catch (error) {
      console.error('Erro ao analisar PDF:', error);
      setUploadStatus(`Erro ao processar ${file.name}: ${error}`);
    }
  };

  const submit = () => {
    if (!title.trim()) return alert("Dê um título ao livro.");
    const clean = chapters.filter((c) => c.title.trim());
    if (clean.length === 0) return alert("Inclua pelo menos um capítulo.");
    createBook(title, clean);
    setTitle("");
    setChapters([{ title: "", text: "" }]);
    alert("Livro criado! Selecione no menu esquerdo.");
  };

  const submitPDF = () => {
    if (!pdfConfig) return;
    if (!pdfConfig.title.trim()) return alert("Dê um título ao livro PDF.");
    
    createPDFBook(pdfConfig.title, pdfConfig.totalPages, pdfConfig.chapterTitles, pdfConfig.file);
    setPdfConfig(null);
    setUploadStatus("");
    alert("Livro PDF criado! Selecione no menu esquerdo. Agora você pode editar as páginas diretamente no Studio de Colagem!");
  };

  const cancelPDF = () => {
    setPdfConfig(null);
    setUploadStatus("");
  };

  if (role !== "admin")
    return <Typography>Somente Admin pode criar livros.</Typography>;

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Upload/Criação de Livro
      </Typography>
      {role === 'admin' && (
        <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              if (!activeBook) return;
              const ok = window.confirm(`Deletar o livro "${activeBook.title}"? Esta ação não pode ser desfeita.`);
              if (ok) deleteBook(activeBook.id);
            }}
          >
            Deletar Livro
          </Button>
        </Box>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Upload de Livros PDF
        </Typography>
        <Stack spacing={2}>
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
            <Paper sx={{ p: 2, mt: 2, backgroundColor: "rgba(252, 231, 243, 0.3)" }}>
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
                <Stack direction="row" spacing={2}>
                  <Button 
                    variant="contained" 
                    onClick={submitPDF}
                    sx={{ background: GRADIENTS.primary }}
                  >
                    ✅ Criar Livro PDF
                  </Button>
                  <Button variant="outlined" onClick={cancelPDF}>
                    ❌ Cancelar
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          )}
          <Typography variant="caption" color="text.secondary">
            Selecione um arquivo PDF para criar um novo livro. O sistema detectará as páginas e permitirá configurar títulos.
          </Typography>
        </Stack>
      </Paper>

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Criar Livro de Texto Manual
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Stack spacing={2}>
          <TextField
            label="Título do livro"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Grid container spacing={2}>
            {chapters.map((c, i) => (
              <Grid size={{ xs: 12, md: 6 }} key={i}>
                <Paper sx={{ p: 1.5 }}>
                  <Stack spacing={1}>
                    <TextField
                      label={`Capítulo ${i + 1} – título`}
                      value={c.title}
                      onChange={(e) => patch(i, "title", e.target.value)}
                    />
                    <TextField
                      label="Texto do capítulo"
                      value={c.text}
                      onChange={(e) => patch(i, "text", e.target.value)}
                      multiline
                      minRows={4}
                    />
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
          <Stack direction="row" spacing={1}>
            <Button onClick={addChapter}>+ Adicionar capítulo</Button>
            <Button variant="contained" onClick={submit}>
              Criar livro
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
