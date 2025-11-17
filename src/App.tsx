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
import TaskNotebook from "./routes/TaskNotebook.tsx";
import { useBooks } from "./store/booksContext.tsx";
import { enableDrive } from "./storage/index.ts";
import { initGoogleAuth, isSignedIn, signOut, ensureToken } from "./services/googleAuth.ts";

export default function App() {
  const { role, setRole } = useBooks();
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [driveConnected, setDriveConnected] = useState(false);

  const ADMIN_PASSWORD = "YWRtaW4xMjM=";

  useEffect(() => {
    document.title = "CassUniverse";
    setDriveConnected(isSignedIn());
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
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                size="small"
                variant={driveConnected ? "contained" : "outlined"}
                onClick={async () => {
                  try {
                    const clientId = (process.env.REACT_APP_GOOGLE_CLIENT_ID as string) || (window as any).__GOOGLE_CLIENT_ID__;
                    if (!clientId) {
                      alert('Configure REACT_APP_GOOGLE_CLIENT_ID para usar Google Drive.');
                      return;
                    }
                    await enableDrive(clientId);
                    await initGoogleAuth(clientId);
                    await ensureToken(clientId);
                    setDriveConnected(true);
                  } catch (e: any) {
                    alert('Falha ao conectar Google Drive: ' + (e?.message || e));
                  }
                }}
              >
                {driveConnected ? 'Google Drive Conectado' : 'Conectar Google Drive'}
              </Button>
              {driveConnected && (
                <Button size="small" onClick={() => { signOut(); setDriveConnected(false); }}>
                  Sair
                </Button>
              )}
              <ToggleButtonGroup
                exclusive
                size="small"
                value={role}
                onChange={handleRoleChange}
                sx={{
                  backgroundColor: "rgba(252, 231, 243, 0.5)",
                  borderRadius: 2,
                  p: 0.5
                }}
              >
                <ToggleButton value="reader">Leitor</ToggleButton>
                <ToggleButton value="admin">Admin</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </Stack>

          <Routes>
            <Route path="/" element={<Navigate to="/library" replace />} />
            <Route path="/library" element={<Library />} />
            <Route path="/studio" element={<Studio />} />
            <Route path="/export" element={<ExportPDF />} />
            <Route path="/task-notebook" element={<TaskNotebook />} />
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
