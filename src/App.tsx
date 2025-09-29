import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import {
  Box,
  Container,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
} from "@mui/material";
import Sidebar from "./components/Sidebar.tsx";
import Library from "./routes/Library.tsx";
import Studio from "./routes/Studio.tsx";
import ExportPDF from "./routes/ExportPDF.tsx";
import Admin from "./routes/Admin.tsx";
import { useBooks } from "./store/booksContext.tsx";

export default function App() {
  const { role, setRole } = useBooks();
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const ADMIN_PASSWORD = "YWRtaW4xMjM=";

  useEffect(() => {
    document.title = "CassUniverse";
  }, []);

  const handleRoleChange = (_: any, newRole: string | null) => {
    if (!newRole) return;

    if (newRole === "admin") {
      setPasswordDialog(true);
    } else {
      setRole(newRole as "reader" | "admin");
    }
  };

  const handlePasswordSubmit = () => {
    const encodedPassword = btoa(password);
    if (encodedPassword === ADMIN_PASSWORD) {
      setRole("admin");
      setPasswordDialog(false);
      setPassword("");
      setPasswordError("");
    } else {
      setPasswordError("Senha incorreta");
    }
  };

  const handlePasswordCancel = () => {
    setPasswordDialog(false);
    setPassword("");
    setPasswordError("");
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Sidebar />
        <Box sx={{ flex: 1 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <Box sx={{ 
              typography: "h5",
              background: "linear-gradient(135deg, #f472b6, #8b5cf6)",
              borderRadius: 3,
              px: 3,
              py: 1.5,
              color: "white",
              fontWeight: "bold",
              textShadow: "0 1px 2px rgba(0,0,0,0.3)"
            }}>
              Histórias para Cassiie 👑
            </Box>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={role}
              onChange={handleRoleChange}
            >
              <ToggleButton value="reader">Leitor</ToggleButton>
              <ToggleButton value="admin">Admin</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          <Routes>
            <Route path="/" element={<Navigate to="/library" replace />} />
            <Route path="/library" element={<Library />} />
            <Route path="/studio" element={<Studio />} />
            <Route path="/export" element={<ExportPDF />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </Box>
      </Stack>

      <Dialog open={passwordDialog} onClose={handlePasswordCancel}>
        <DialogTitle>Acesso Administrativo</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Senha"
            type="password"
            fullWidth
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handlePasswordSubmit()}
          />
          {passwordError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {passwordError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePasswordCancel}>Cancelar</Button>
          <Button onClick={handlePasswordSubmit} variant="contained">
            Entrar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
