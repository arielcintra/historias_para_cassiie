import React from "react";
import { Paper, Typography } from "@mui/material";
import type { Collage } from "../types.ts";

export default function StoryPreview({
  text,
  collage,
  height = 160,
}: {
  text?: string;
  collage?: Collage;
  height?: number;
}) {
  return (
    <Paper sx={{ p: 1.5, position: "relative", height:"fit-content" }}>
      <Typography variant="caption" sx={{ opacity: 0.8 }}>
        História
      </Typography>
      <Typography
        variant="body2"
        sx={{
          pr: 1,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 4,
          WebkitBoxOrient: "vertical",
        }}
      >
        {text}
      </Typography>
      {(collage?.items ?? []).map((it) => (
        <div
          key={it.id}
          style={{
            position: "absolute",
            left: `${it.x * 100}%`,
            top: `${it.y * 100}%`,
            transform: `translate(-50%,-50%)`,
            fontSize: 20,
          }}
        >
          {it.emoji}
        </div>
      ))}
    </Paper>
  );
}
