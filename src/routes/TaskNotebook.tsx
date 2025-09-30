import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography
} from "@mui/material";

import { useTaskNotebook } from '../hooks/useTaskNotebook.ts';
import { useDragAndDrop } from '../hooks/useDragAndDrop.ts';
import { useConfetti } from '../hooks/useConfetti.ts';
import { ProgressBar } from '../components/tasknotebook/ProgressBar.tsx';
import { ToolsPanel } from '../components/tasknotebook/ToolsPanel.tsx';
import { Canvas } from '../components/tasknotebook/Canvas.tsx';
import { TextEditor } from '../components/tasknotebook/TextEditor.tsx';

export default function TaskNotebook() {
  const {
    stars,
    textItems,
    score,
    addStar,
    addCustomStar,
    addText,
    updateTextItem,
    removeItem,
    updateItemPosition,
    resetScore,
    getCustomImageSrc
  } = useTaskNotebook();

  const {
    isDragging,
    selectedItem,
    canvasRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    setSelectedItem
  } = useDragAndDrop(updateItemPosition);

  const { confetti, createConfetti, stopConfetti } = useConfetti();

  const [showCelebration, setShowCelebration] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);
  const [newText, setNewText] = useState('');
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    if (score >= 20) {
      setShowCelebration(true);
      createConfetti();
    }
  }, [score, createConfetti]);

  const handleCelebrationClose = () => {
    setShowCelebration(false);
    stopConfetti();
    resetScore();
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const validTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg'];
    
    if (!validTypes.includes(file.type)) {
      setUploadError('Apenas arquivos SVG, PNG ou JPG são aceitos');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Arquivo deve ter menos de 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        try {
          await addCustomStar(result, file.name);
          setUploadError('');
        } catch (error) {
          setUploadError('Erro ao salvar a imagem');
        }
      }
    };
    reader.readAsDataURL(file);
    
    event.target.value = '';
  };

  const handleAddText = () => {
    setIsEditingText(true);
  };

  const handleConfirmAddText = () => {
    addText(newText);
    setNewText('');
    setIsEditingText(false);
  };

  const handleDoubleClick = (id: string, type: 'star' | 'text') => {
    removeItem(id, type);
    if (selectedItem === id) {
      setSelectedItem('');
    }
  };

  const selectedTextItem = textItems.find(t => t.id === selectedItem);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ProgressBar score={score} />

      <Canvas
        canvasRef={canvasRef as React.RefObject<HTMLDivElement>}
        stars={stars}
        textItems={textItems}
        selectedItem={selectedItem}
        isDragging={isDragging}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        getCustomImageSrc={getCustomImageSrc}
        setSelectedItem={setSelectedItem}
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <ToolsPanel
            onAddStar={addStar}
            onAddText={handleAddText}
            onImageUpload={handleImageUpload}
            uploadError={uploadError}
          />
        </Grid>

        {selectedTextItem && (
          <Grid size={{ xs: 12, md: 8 }}>
            <TextEditor
              selectedTextItem={selectedTextItem}
              onUpdateTextItem={updateTextItem}
              onRemoveTextItem={(id) => {
                removeItem(id, 'text');
                setSelectedItem('');
              }}
              selectedTextId={selectedItem!}
            />
          </Grid>
        )}
      </Grid>

      {confetti.map((c) => (
        <Box
          key={c.id}
          sx={{
            position: 'fixed',
            left: c.x,
            top: c.y,
            width: c.size,
            height: c.size,
            backgroundColor: c.color,
            borderRadius: '50%',
            pointerEvents: 'none',
            zIndex: 9999
          }}
        />
      ))}

      <Dialog open={showCelebration} maxWidth="sm" fullWidth>
        <DialogContent sx={{ textAlign: 'center', p: 4 }}>
          <Typography variant="h4" sx={{ mb: 2, color: "#ec4899" }}>
            🎉 Parabéns, meu amor! 🎉
          </Typography>
          <Typography variant="h6" sx={{ mb: 3, color: "#581c87" }}>
            Você atingiu a recompensa, tira um print e manda pra mim! 💕
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button 
            onClick={handleCelebrationClose}
            variant="contained"
            sx={{ 
              background: 'linear-gradient(45deg, #ec4899, #d946ef)',
              px: 4,
              py: 1
            }}
          >
            Fechar 🥰
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isEditingText} onClose={() => setIsEditingText(false)}>
        <DialogContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Adicionar Texto</Typography>
          <TextField
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            label="Digite o texto"
            multiline
            rows={3}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditingText(false)}>Cancelar</Button>
          <Button onClick={handleConfirmAddText} variant="contained">Adicionar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}