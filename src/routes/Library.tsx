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
  TextField
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { useBooks } from "../store/booksContext.tsx";

export default function Library() {
  const { activeBook, role, unlockChapter, createBook } = useBooks();
  const [newBookDialog, setNewBookDialog] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState("");
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newChapterText, setNewChapterText] = useState("");

  if (!activeBook) return <Typography>Selecione um livro.</Typography>;

  const handleCreateBook = () => {
    if (newBookTitle.trim() && newChapterTitle.trim() && newChapterText.trim()) {
      createBook(newBookTitle, [
        {
          title: newChapterTitle,
          text: newChapterText,
        },
      ]);
      setNewBookDialog(false);
      setNewBookTitle("");
      setNewChapterTitle("");
      setNewChapterText("");
    }
  };

  const handleCancelNewBook = () => {
    setNewBookDialog(false);
    setNewBookTitle("");
    setNewChapterTitle("");
    setNewChapterText("");
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
                color={ch.unlocked ? "success" : "warning"}
                label={ch.unlocked ? "✨ Desbloqueado" : "🔒 Bloqueado"}
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
            {!ch.unlocked && (
              <Button
                sx={{ 
                  mt: 2,
                  borderRadius: 2,
                  background: "linear-gradient(45deg, #10b981, #34d399)",
                  "&:hover": {
                    background: "linear-gradient(45deg, #059669, #10b981)",
                  }
                }}
                variant="contained"
                disabled={role !== "reader"}
                onClick={() => unlockChapter(ch.id)}
                size="small"
              >
                🔓 Desbloquear capítulo
              </Button>
            )}
          </Paper>
        </Grid>
      ))}
    </Grid>

      <Dialog open={newBookDialog} onClose={handleCancelNewBook} maxWidth="sm" fullWidth>
        <DialogTitle>Criar Novo Livro</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
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
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelNewBook}>Cancelar</Button>
          <Button 
            onClick={handleCreateBook} 
            variant="contained"
            disabled={!newBookTitle.trim() || !newChapterTitle.trim() || !newChapterText.trim()}
          >
            Criar Livro
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
