import { useState, useEffect } from 'react';

export interface StarItem {
  id: string;
  type: 'purple' | 'orange' | 'gold' | 'custom';
  x: number;
  y: number;
  customImage?: string;
}

export interface TextItem {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: 'left' | 'center' | 'right';
}

const STAR_VALUES = {
  purple: 1,
  orange: 2,
  gold: 3
};

export const useTaskNotebook = () => {
  const [stars, setStars] = useState<StarItem[]>([]);
  const [textItems, setTextItems] = useState<TextItem[]>([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('task-notebook-data');
    if (saved) {
      const data = JSON.parse(saved);
      setStars(data.stars || []);
      setTextItems(data.textItems || []);
      setScore(data.score || 0);
    }
  }, []);

  useEffect(() => {
    const dataToSave = {
      stars,
      textItems,
      score
    };
    localStorage.setItem('task-notebook-data', JSON.stringify(dataToSave));
  }, [stars, textItems, score]);

  const calculateScore = (starList: StarItem[]) => {
    return starList.reduce((total, star) => {
      return total + (STAR_VALUES[star.type as keyof typeof STAR_VALUES] || 0);
    }, 0);
  };

  const addStar = (type: 'purple' | 'orange' | 'gold') => {
    const newStar: StarItem = {
      id: `star-${Date.now()}`,
      type,
      x: 0.5,
      y: 0.5,
    };
    const newStars = [...stars, newStar];
    setStars(newStars);
    setScore(calculateScore(newStars));
  };

  const addCustomStar = async (imageData: string, fileName: string) => {
    try {
      const savedImagePath = await saveCustomImage(imageData, fileName);
      
      const newStar: StarItem = {
        id: `custom-star-${Date.now()}`,
        type: 'custom',
        x: 0.5,
        y: 0.5,
        customImage: savedImagePath
      };
      const newStars = [...stars, newStar];
      setStars(newStars);
    } catch (error) {
      console.error('Error saving custom image:', error);
      throw error;
    }
  };

  const saveCustomImage = async (imageData: string, fileName: string): Promise<string> => {
    const currentVersion = parseInt(localStorage.getItem('task-notebook-version') || '0');
    const nextVersion = currentVersion + 1;
    
    const extension = fileName.split('.').pop();
    const versionedFileName = `v${nextVersion}.${extension}`;
    
    const customImages = JSON.parse(localStorage.getItem('task-notebook-custom-images') || '{}');
    customImages[versionedFileName] = imageData;
    localStorage.setItem('task-notebook-custom-images', JSON.stringify(customImages));
    localStorage.setItem('task-notebook-version', nextVersion.toString());
    
    return `data-image:${versionedFileName}`;
  };

  const addText = (text: string) => {
    if (!text.trim()) return;
    
    const newTextItem: TextItem = {
      id: `text-${Date.now()}`,
      text: text,
      x: 0.5,
      y: 0.5,
      fontSize: 16,
      fontFamily: 'Arial',
      color: '#000000',
      bold: false,
      italic: false,
      underline: false,
      align: 'left'
    };
    setTextItems([...textItems, newTextItem]);
  };

  const updateTextItem = (id: string, updates: Partial<TextItem>) => {
    setTextItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const removeItem = (id: string, type: 'star' | 'text') => {
    if (type === 'star') {
      const newStars = stars.filter(s => s.id !== id);
      setStars(newStars);
      setScore(calculateScore(newStars));
    } else {
      setTextItems(prev => prev.filter(t => t.id !== id));
    }
  };

  const updateItemPosition = (id: string, x: number, y: number) => {
    setStars(prev => prev.map(star => 
      star.id === id ? { ...star, x, y } : star
    ));
    setTextItems(prev => prev.map(item => 
      item.id === id ? { ...item, x, y } : item
    ));
  };

  const resetScore = () => {
    setScore(0);
  };

  const getCustomImageSrc = (imagePath: string): string => {
    if (imagePath.startsWith('data-image:')) {
      const fileName = imagePath.replace('data-image:', '');
      const customImages = JSON.parse(localStorage.getItem('task-notebook-custom-images') || '{}');
      return customImages[fileName] || imagePath;
    }
    return imagePath;
  };

  return {
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
  };
};