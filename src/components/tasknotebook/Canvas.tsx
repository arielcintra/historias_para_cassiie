import React from 'react';
import { Paper, Box } from '@mui/material';
import { StarItem, TextItem } from '../../hooks/useTaskNotebook';

interface CanvasProps {
  canvasRef: React.RefObject<HTMLDivElement>;
  stars: StarItem[];
  textItems: TextItem[];
  selectedItem: string | null;
  isDragging: boolean;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onMouseDown: (e: React.MouseEvent, id: string, item: any) => void;
  onDoubleClick: (id: string, type: 'star' | 'text') => void;
  getCustomImageSrc: (imagePath: string) => string;
  setSelectedItem: (id: string) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  canvasRef,
  stars,
  textItems,
  selectedItem,
  isDragging,
  onMouseMove,
  onMouseUp,
  onMouseDown,
  onDoubleClick,
  getCustomImageSrc,
  setSelectedItem
}) => {
  return (
    <Paper 
      ref={canvasRef}
      sx={{ 
        position: 'relative', 
        flex: 1,
        mb: 2,
        backgroundImage: `url(${process.env.PUBLIC_URL}/images/caderninho_atividade.jpg)`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'default',
        minHeight: 400
      }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {stars.map((star) => (
        <Box
          key={star.id}
          sx={{
            position: 'absolute',
            left: `calc(${star.x * 100}% - 10px)`,
            top: `calc(${star.y * 100}% - 10px)`,
            width: 20,
            height: 20,
            cursor: isDragging ? 'grabbing' : 'grab',
            '&:hover': { transform: 'scale(1.1)' },
            zIndex: 10,
            border: selectedItem === star.id ? '2px solid #ec4899' : 'none',
            borderRadius: '50%'
          }}
          onMouseDown={(e) => onMouseDown(e, star.id, star)}
          onDoubleClick={() => onDoubleClick(star.id, 'star')}
        >
          {star.type === 'custom' ? (
            <img 
              src={getCustomImageSrc(star.customImage || '')}
              alt="Estrela customizada"
              style={{ width: '100%', height: '100%', pointerEvents: 'none', objectFit: 'contain' }}
            />
          ) : (
            <img 
              src={`${process.env.PUBLIC_URL}/images/estrela_${star.type === 'purple' ? 'roxa' : star.type === 'orange' ? 'laranja' : 'dourada'}.png`}
              alt={`Estrela ${star.type}`}
              style={{ width: '100%', height: '100%', pointerEvents: 'none', objectFit: 'contain' }}
            />
          )}
        </Box>
      ))}

      {textItems.map((textItem) => (
        <Box
          key={textItem.id}
          sx={{
            position: 'absolute',
            left: `calc(${textItem.x * 100}% - 50px)`,
            top: `calc(${textItem.y * 100}% - 10px)`,
            cursor: isDragging ? 'grabbing' : 'grab',
            padding: '4px 8px',
            backgroundColor: selectedItem === textItem.id ? 'rgba(236, 72, 153, 0.2)' : 'transparent',
            borderRadius: 1,
            border: selectedItem === textItem.id ? '2px dashed #ec4899' : 'none',
            fontSize: textItem.fontSize,
            fontFamily: textItem.fontFamily,
            color: textItem.color,
            fontWeight: textItem.bold ? 'bold' : 'normal',
            fontStyle: textItem.italic ? 'italic' : 'normal',
            textDecoration: textItem.underline ? 'underline' : 'none',
            textAlign: textItem.align,
            minWidth: 100,
            '&:hover': { backgroundColor: 'rgba(236, 72, 153, 0.1)' },
            zIndex: 10
          }}
          onMouseDown={(e) => {
            setSelectedItem(textItem.id);
            onMouseDown(e, textItem.id, textItem);
          }}
          onDoubleClick={() => {
            onDoubleClick(textItem.id, 'text');
            setSelectedItem('');
          }}
        >
          {textItem.text}
        </Box>
      ))}
    </Paper>
  );
};