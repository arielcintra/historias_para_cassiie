import React from 'react';
import {
  Paper,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  ToggleButtonGroup,
  ToggleButton,
  Button,
  Box
} from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
} from '@mui/icons-material';
import { TextItem } from '../../hooks/useTaskNotebook';
import { FONT_FAMILIES, COLORS } from '../../constants/theme.ts';

interface TextEditorProps {
  selectedTextItem: TextItem;
  onUpdateTextItem: (id: string, updates: Partial<TextItem>) => void;
  onRemoveTextItem: (id: string) => void;
  selectedTextId: string;
}

export const TextEditor: React.FC<TextEditorProps> = ({
  selectedTextItem,
  onUpdateTextItem,
  onRemoveTextItem,
  selectedTextId
}) => {
  return (
    <Paper sx={{ p: 2, backgroundColor: "rgba(252, 231, 243, 0.3)" }}>
      <Typography variant="h6" sx={{ mb: 2, color: "#581c87" }}>
        ✏️ Editar Texto Selecionado
      </Typography>
      
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            value={selectedTextItem.text}
            onChange={(e) => onUpdateTextItem(selectedTextId, { text: e.target.value })}
            label="Texto"
            size="small"
            multiline
            fullWidth
          />
        </Grid>
        
        <Grid size={{ xs: 6, md: 3 }}>
          <FormControl size="small" fullWidth>
            <InputLabel>Fonte</InputLabel>
            <Select
              value={selectedTextItem.fontFamily}
              onChange={(e) => onUpdateTextItem(selectedTextId, { fontFamily: e.target.value })}
            >
              {FONT_FAMILIES.map(font => (
                <MenuItem key={font} value={font}>{font}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 6, md: 3 }}>
          <FormControl size="small" fullWidth>
            <InputLabel>Cor</InputLabel>
            <Select
              value={selectedTextItem.color}
              onChange={(e) => onUpdateTextItem(selectedTextId, { color: e.target.value })}
            >
              {COLORS.palette.map(color => (
                <MenuItem key={color} value={color}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 16, height: 16, backgroundColor: color, borderRadius: 1 }} />
                    {color}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="caption">Tamanho: {selectedTextItem.fontSize}px</Typography>
          <Slider
            value={selectedTextItem.fontSize}
            onChange={(_, value) => onUpdateTextItem(selectedTextId, { fontSize: value as number })}
            min={10}
            max={72}
            size="small"
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <ToggleButtonGroup size="small" sx={{ flexWrap: 'wrap' }}>
            <ToggleButton
              value="bold"
              selected={selectedTextItem.bold}
              onChange={() => onUpdateTextItem(selectedTextId, { bold: !selectedTextItem.bold })}
            >
              <FormatBold />
            </ToggleButton>
            <ToggleButton
              value="italic"
              selected={selectedTextItem.italic}
              onChange={() => onUpdateTextItem(selectedTextId, { italic: !selectedTextItem.italic })}
            >
              <FormatItalic />
            </ToggleButton>
            <ToggleButton
              value="underline"
              selected={selectedTextItem.underline}
              onChange={() => onUpdateTextItem(selectedTextId, { underline: !selectedTextItem.underline })}
            >
              <FormatUnderlined />
            </ToggleButton>
          </ToggleButtonGroup>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <ToggleButtonGroup
            value={selectedTextItem.align}
            exclusive
            onChange={(_, value) => value && onUpdateTextItem(selectedTextId, { align: value })}
            size="small"
          >
            <ToggleButton value="left"><FormatAlignLeft /></ToggleButton>
            <ToggleButton value="center"><FormatAlignCenter /></ToggleButton>
            <ToggleButton value="right"><FormatAlignRight /></ToggleButton>
          </ToggleButtonGroup>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Button 
            variant="outlined" 
            color="error"
            onClick={() => onRemoveTextItem(selectedTextId)}
            size="small"
          >
            🗑️ Remover Texto
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};