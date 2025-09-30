import React from 'react';
import {
  Paper,
  Typography,
  Stack,
  Box,
  Chip,
  Button
} from '@mui/material';

interface ToolsPanelProps {
  onAddStar: (type: 'purple' | 'orange' | 'gold') => void;
  onAddText: () => void;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  uploadError: string;
}

export const ToolsPanel: React.FC<ToolsPanelProps> = ({
  onAddStar,
  onAddText,
  onImageUpload,
  uploadError
}) => {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, color: "#581c87" }}>
        🛠️ Ferramentas
      </Typography>
      
      <Stack spacing={2}>
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Estrelas do Sistema (pontuam):</Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            <Chip 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <img src={`${process.env.PUBLIC_URL}/images/estrela_roxa.png`} alt="Estrela Roxa" style={{ width: 16, height: 16 }} />
                </Box>
              } 
              onClick={() => onAddStar('purple')}
              sx={{ cursor: 'pointer' }}
            />
            <Chip 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <img src={`${process.env.PUBLIC_URL}/images/estrela_laranja.png`} alt="Estrela Laranja" style={{ width: 16, height: 16 }} />
                </Box>
              } 
              onClick={() => onAddStar('orange')}
              sx={{ cursor: 'pointer' }}
            />
            <Chip 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <img src={`${process.env.PUBLIC_URL}/images/estrela_dourada.png`} alt="Estrela Dourada" style={{ width: 16, height: 16 }} />
                </Box>
              } 
              onClick={() => onAddStar('gold')}
              sx={{ cursor: 'pointer' }}
            />
          </Stack>
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Estrelas Personalizadas:</Typography>
          <Button
            component="label"
            variant="outlined"
            size="small"
            fullWidth
            sx={{ mb: 1 }}
          >
            📁 Adicionar Estrela (SVG/PNG)
            <input
              type="file"
              accept=".svg,.png,.jpg,.jpeg"
              hidden
              onChange={onImageUpload}
            />
          </Button>
          {uploadError && (
            <Typography variant="caption" color="error" sx={{ display: 'block' }}>
              {uploadError}
            </Typography>
          )}
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Texto:</Typography>
          <Button 
            variant="outlined" 
            onClick={onAddText}
            fullWidth
          >
            ➕ Adicionar Texto
          </Button>
        </Box>
        
        <Typography variant="caption" sx={{ color: '#7c3aed', fontStyle: 'italic' }}>
          💡 Dicas: Arraste elementos para posicionar. Duplo clique para remover. Estrelas personalizadas não pontuam.
        </Typography>
      </Stack>
    </Paper>
  );
};