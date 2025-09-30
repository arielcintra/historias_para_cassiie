import React from 'react';
import { Paper, Typography, LinearProgress } from '@mui/material';

interface ProgressBarProps {
  score: number;
  maxScore?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ score, maxScore = 20 }) => {
  return (
    <Paper sx={{ p: 2, mb: 2, backgroundColor: "rgba(252, 231, 243, 0.8)" }}>
      <Typography variant="h6" sx={{ mb: 1, color: "#581c87", fontWeight: 700 }}>
        ⭐ Caderninho das Tarefas ⭐
      </Typography>
      <LinearProgress 
        variant="determinate" 
        value={(score / maxScore) * 100}
        sx={{
          height: 10,
          borderRadius: 5,
          backgroundColor: 'rgba(236, 72, 153, 0.2)',
          '& .MuiLinearProgress-bar': {
            background: 'linear-gradient(45deg, #ec4899, #d946ef)',
            borderRadius: 5,
          }
        }}
      />
    </Paper>
  );
};