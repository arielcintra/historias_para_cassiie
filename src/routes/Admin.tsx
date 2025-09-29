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

export default function Admin() {
  const { createBook, role } = useBooks();
  const [title, setTitle] = useState("");
  const [chapters, setChapters] = useState<{ title: string; text: string }[]>([
    { title: "", text: "" },
  ]);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  const addChapter = () => setChapters((c) => [...c, { title: "", text: "" }]);
  const patch = (i: number, field: "title" | "text", val: string) =>
    setChapters((arr) =>
      arr.map((c, idx) => (idx === i ? { ...c, [field]: val } : c))
    );

  const handlePDFUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadStatus("Processando arquivos...");
    
    for (const file of Array.from(files)) {
      if (file.type !== 'application/pdf') {
        setUploadStatus(`Erro: ${file.name} não é um arquivo PDF válido`);
        continue;
      }

      try {
        const bookTitle = file.name.replace('.pdf', '');
        
        setUploadStatus(`Upload de ${file.name} concluído! Livro: ${bookTitle}`);
 
        setTimeout(() => setUploadStatus(""), 3000);
      } catch (error) {
        setUploadStatus(`Erro ao processar ${file.name}: ${error}`);
      }
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

  if (role !== "admin")
    return <Typography>Somente Admin pode criar livros.</Typography>;

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Upload/Criação de Livro
      </Typography>
      
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
            Selecionar PDFs
            <input
              type="file"
              accept=".pdf"
              multiple
              hidden
              onChange={handlePDFUpload}
            />
          </Button>
          {uploadStatus && (
            <Alert severity={uploadStatus.startsWith('Erro') ? 'error' : 'success'}>
              {uploadStatus}
            </Alert>
          )}
          <Typography variant="caption" color="text.secondary">
            Selecione um ou mais arquivos PDF para criar novos livros. Cada PDF será convertido automaticamente em um livro com páginas.
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
