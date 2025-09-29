import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { 
      main: "#d946ef", 
      light: "#f0abfc",
      dark: "#a21caf",
    },
    secondary: { 
      main: "#ec4899", 
      light: "#f9a8d4",
      dark: "#be185d",
    },
    text: {
      primary: "#581c87",
      secondary: "#a855f7",
    },
    success: {
      main: "#10b981",
      light: "#6ee7b7",
    },
    warning: {
      main: "#f59e0b",
      light: "#fbbf24",
    },
    error: {
      main: "#ef4444",
      light: "#f87171",
    },
  },
  shape: { borderRadius: 20 },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      background: "linear-gradient(45deg, #d946ef, #ec4899)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },
    h5: {
      fontWeight: 600,
      color: "#581c87",
    },
    h6: {
      fontWeight: 600,
      color: "#7c3aed",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: "url(/images/background.png)",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "top",
          backgroundAttachment: "fixed",
          minHeight: "100vh",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(236, 72, 153, 0.1)",
          boxShadow: "0 8px 32px rgba(236, 72, 153, 0.15)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          textTransform: "none",
          fontWeight: 600,
          padding: "12px 24px",
          boxShadow: "0 4px 16px rgba(236, 72, 153, 0.25)",
          transition: "all 0.3s ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 8px 24px rgba(236, 72, 153, 0.35)",
          },
        },
        contained: {
          background: "linear-gradient(45deg, #ec4899, #d946ef)",
          color: "white",
          "&:hover": {
            background: "linear-gradient(45deg, #be185d, #a21caf)",
          },
        },
        outlined: {
          borderColor: "#ec4899",
          color: "#be185d",
          background: "rgba(255, 255, 255, 0.8)",
          "&:hover": {
            background: "linear-gradient(45deg, rgba(236, 72, 153, 0.1), rgba(217, 70, 239, 0.1))",
            borderColor: "#d946ef",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(252,231,243,0.8))",
          borderRadius: 20,
          border: "1px solid rgba(236, 72, 153, 0.2)",
          boxShadow: "0 8px 32px rgba(236, 72, 153, 0.15)",
          transition: "all 0.3s ease",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 12px 40px rgba(236, 72, 153, 0.25)",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 500,
        },
        colorSuccess: {
          background: "linear-gradient(45deg, #10b981, #34d399)",
          color: "white",
        },
        colorWarning: {
          background: "linear-gradient(45deg, #f59e0b, #fbbf24)",
          color: "white",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 16,
            background: "rgba(255, 255, 255, 0.8)",
            "& fieldset": {
              borderColor: "rgba(236, 72, 153, 0.3)",
            },
            "&:hover fieldset": {
              borderColor: "#ec4899",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#d946ef",
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: "4px 0",
          "&.Mui-selected": {
            background: "linear-gradient(45deg, rgba(236, 72, 153, 0.2), rgba(217, 70, 239, 0.2))",
            "&:hover": {
              background: "linear-gradient(45deg, rgba(236, 72, 153, 0.3), rgba(217, 70, 239, 0.3))",
            },
          },
          "&:hover": {
            background: "rgba(236, 72, 153, 0.1)",
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: "#ec4899",
          "&.Mui-checked": {
            color: "#d946ef",
          },
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        root: {
          "& .MuiTypography-root": {
            color: "#581c87",
            fontWeight: 500,
          },
        },
      },
    },
  },
});

export default theme;
