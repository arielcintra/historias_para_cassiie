import { useState, useRef } from 'react';

export const useDragAndDrop = (onPositionUpdate: (id: string, x: number, y: number) => void) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent, id: string, item: { x: number; y: number }) => {
    e.preventDefault();
    setIsDragging(true);
    setSelectedItem(id);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const itemX = item.x * rect.width;
    const itemY = item.y * rect.height;
    
    setDragOffset({
      x: e.clientX - rect.left - itemX,
      y: e.clientY - rect.top - itemY
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedItem) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const newX = Math.max(0, Math.min(1, (e.clientX - rect.left - dragOffset.x) / rect.width));
    const newY = Math.max(0, Math.min(1, (e.clientY - rect.top - dragOffset.y) / rect.height));
    
    onPositionUpdate(selectedItem, newX, newY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  };

  return {
    isDragging,
    selectedItem,
    canvasRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    setSelectedItem
  };
};