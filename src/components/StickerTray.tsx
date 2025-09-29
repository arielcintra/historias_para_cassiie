import React, { useState, useEffect, useRef } from "react";
import {
  Chip,
  Paper,
  Stack,
  Button,
  CircularProgress,
  Alert,
  Box,
} from "@mui/material";
import { Add } from "@mui/icons-material";

interface EmojiData {
  name: string;
  category: string;
  group: string;
  htmlCode: string[];
  unicode: string[];
}

const FALLBACK_CATALOG = ["⭐", "💖", "🌙", "🚀", "☁️", "🪐"] as const;
export default function StickerTray({
  onAdd,
}: {
  onAdd: (emoji: string) => void;
}) {
  const [emojis, setEmojis] = useState<string[]>([]);
  const [customStickers, setCustomStickers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchEmojis = async () => {
      try {
        setLoading(true);
        setError(null);

        const allEmojis: string[] = [];

        const response = await fetch(`https://emojihub.yurace.pro/api/all`);
        if (!response.ok)
          throw new Error(`Erro ao carregar emojis: ${response}`);

        const data: EmojiData[] = await response.json();
        const categoryEmojis = data.map((emoji) =>
          String.fromCodePoint(
            ...emoji.unicode.map((u) => parseInt(u.replace("U+", ""), 16))
          )
        );

        allEmojis.push(...categoryEmojis);

        setEmojis(allEmojis);
      } catch (err) {
        console.error("Erro ao carregar emojis:", err);
        setError("Erro ao carregar emojis");
        setEmojis([...FALLBACK_CATALOG]);
      } finally {
        setLoading(false);
      }
    };

    fetchEmojis();
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'image/svg+xml' && file.type !== 'image/png') {
      setError('Por favor, selecione apenas arquivos SVG ou PNG.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const svgAndPngContent = e.target?.result as string;
      if (svgAndPngContent) {
        const dataUrl = `data:image/svg+xml;image/png;base64,${btoa(svgAndPngContent)}`;
        setCustomStickers(prev => [...prev, dataUrl]);
        setError(null);
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddStickerClick = () => {
    fileInputRef.current?.click();
  };

  if (loading) {
    return (
      <Box sx={{ mt: 2 }}>
        <Paper sx={{ p: 1.5 }}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent="center"
          >
            <CircularProgress size={20} />
            <span>Carregando stickers...</span>
          </Stack>
        </Paper>
      </Box>
    );
  }

  if (error && emojis.length === 0 && customStickers.length === 0) {
    return (
      <Box sx={{ mt: 2 }}>
        <Paper sx={{ p: 1.5 }}>
          <Alert severity="warning">{error}. Usando catálogo padrão.</Alert>
        </Paper>
      </Box>
    );
  }

  const allStickers = [...emojis, ...customStickers];

  return (
    <Box sx={{ mt: 2 }}>
      <Paper sx={{ p: 1.5, overflowY: "auto", maxHeight: 200 }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          {allStickers.map((sticker, index) => {
            const isCustomSvg = sticker.startsWith('data:image/svg+xml;image/png');
            
            return (
              <Chip
                key={`${sticker}-${index}`}
                label={isCustomSvg ? (
                  <img 
                    src={sticker} 
                    alt="Custom sticker" 
                    style={{ width: 20, height: 20 }}
                  />
                ) : sticker}
                onClick={() => onAdd(sticker)}
                clickable
                sx={{ fontSize: 20, px: 1.2 }}
              />
            );
          })}
        </Stack>
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
        <Button
          variant="contained"
          size="small"
          startIcon={<Add />}
          onClick={handleAddStickerClick}
        >
          Adicionar Sticker
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".svg, .png"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
