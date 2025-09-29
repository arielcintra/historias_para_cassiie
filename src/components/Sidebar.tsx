import React from "react";
import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
} from "@mui/material";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import BrushIcon from "@mui/icons-material/Brush";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import { Link, useLocation } from "react-router-dom";
import { useBooks } from "../store/booksContext.tsx";

export default function Sidebar() {
  const { books, activeBookId, setActiveBookId } = useBooks();
  const { pathname } = useLocation();
  const active = (p: string) => pathname.startsWith(p);

  return (
    <Paper 
      sx={{ 
        width: 260, 
        p: 2,
        background: "linear-gradient(135deg, #ec4899, #d946ef)",
        borderRadius: 3,
        boxShadow: "0 12px 40px rgba(236, 72, 153, 0.3)",
        border: "1px solid rgba(255, 255, 255, 0.2)"
      }} 
      elevation={0}
    >
      <List component="nav">
        <ListItemButton
          component={Link}
          to="/historias_para_cassiie/library"
          selected={active("/historias_para_cassiie/library")}
          sx={{ 
            color: "white",
            borderRadius: 2,
            mb: 0.5,
            "&.Mui-selected": { 
              backgroundColor: "rgba(255,255,255,0.25)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.35)" }
            },
            "&:hover": { 
              backgroundColor: "rgba(255,255,255,0.15)",
              transform: "translateX(4px)",
              transition: "all 0.2s ease"
            }
          }}
        >
          <ListItemIcon sx={{ color: "white" }}>
            <AutoStoriesIcon />
          </ListItemIcon>
          <ListItemText primary="Biblioteca" />
        </ListItemButton>
        <ListItemButton
          component={Link}
          to="/historias_para_cassiie/studio"
          selected={active("/historias_para_cassiie/studio")}
          sx={{ 
            color: "white",
            borderRadius: 2,
            mb: 0.5,
            "&.Mui-selected": { 
              backgroundColor: "rgba(255,255,255,0.25)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.35)" }
            },
            "&:hover": { 
              backgroundColor: "rgba(255,255,255,0.15)",
              transform: "translateX(4px)",
              transition: "all 0.2s ease"
            }
          }}
        >
          <ListItemIcon sx={{ color: "white" }}>
            <BrushIcon />
          </ListItemIcon>
          <ListItemText primary="Estúdio de Colagem" />
        </ListItemButton>
        <ListItemButton
          component={Link}
          to="/historias_para_cassiie/export"
          selected={active("/historias_para_cassiie/export")}
          sx={{ 
            color: "white",
            borderRadius: 2,
            mb: 0.5,
            "&.Mui-selected": { 
              backgroundColor: "rgba(255,255,255,0.25)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.35)" }
            },
            "&:hover": { 
              backgroundColor: "rgba(255,255,255,0.15)",
              transform: "translateX(4px)",
              transition: "all 0.2s ease"
            }
          }}
        >
          <ListItemIcon sx={{ color: "white" }}>
            <PictureAsPdfIcon />
          </ListItemIcon>
          <ListItemText primary="Exportar PDF" />
        </ListItemButton>
      </List>
      <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.4)" }} />
      <Box
        sx={{ 
          px: 2, 
          py: 1.5, 
          typography: "subtitle2", 
          color: "rgba(255,255,255,0.9)",
          fontWeight: 600,
          letterSpacing: "0.5px"
        }}
      >
        📚 Meus Livros
      </Box>
      <List dense>
        {books.map((b) => (
          <ListItemButton
            key={b.id}
            selected={b.id === activeBookId}
            onClick={() => setActiveBookId(b.id)}
            sx={{ 
              color: "white",
              "&.Mui-selected": { 
                backgroundColor: "rgba(255,255,255,0.2)",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.3)" }
              },
              "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" }
            }}
          >
            <ListItemIcon sx={{ color: "white" }}>
              <MenuBookIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={b.title} />
          </ListItemButton>
        ))}
      </List>
    </Paper>
  );
}
