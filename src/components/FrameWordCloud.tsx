"use client";

import { getFrame } from "@/lib/frames";
import type { FrameKind, WordCount } from "@/lib/types";

type FrameWordCloudProps = {
  words: WordCount[];
  frameId: FrameKind;
  colors: string[];
  className?: string;
};

type PositionedWord = WordCount & {
  x: number;
  y: number;
  rotate: number;
  size: number;
  color: string;
};

export function FrameWordCloud({ words, frameId, colors, className }: FrameWordCloudProps) {
  const frame = getFrame(frameId);
  const positionedWords = layoutWords(words, frameId, colors);

  return (
    <div className={className}>
      <svg
        aria-label="워드클라우드"
        className="h-full min-h-[420px] w-full overflow-visible"
        role="img"
        viewBox={frame.viewBox}
      >
        <defs>
          <clipPath id={`word-frame-${frame.id}`}>
            <path d={frame.path} />
          </clipPath>
        </defs>
        <path d={frame.path} fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
        <g clipPath={`url(#word-frame-${frame.id})`}>
          {positionedWords.map((word) => (
            <text
              dominantBaseline="middle"
              fill={word.color}
              fontSize={word.size}
              fontWeight={word.value > 2 ? 800 : 700}
              key={`${word.text}-${word.x}-${word.y}`}
              textAnchor="middle"
              transform={`translate(${word.x} ${word.y}) rotate(${word.rotate})`}
            >
              {word.text}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
}

function layoutWords(words: WordCount[], frameId: FrameKind, colors: string[]): PositionedWord[] {
  if (words.length === 0) {
    return [];
  }

  const maxValue = Math.max(...words.map((word) => word.value));
  const placed: PositionedWord[] = [];

  for (const [index, word] of words.slice(0, 60).entries()) {
    const seed = hash(`${word.text}-${index}`);
    const size = 4 + 12 * (word.value / maxValue);
    const candidate = pickPoint(seed, index, frameId);

    placed.push({
      ...word,
      x: candidate.x,
      y: candidate.y,
      rotate: seed % 7 === 0 ? -8 : seed % 11 === 0 ? 8 : 0,
      size,
      color: colors[index % colors.length] ?? "#111827",
    });
  }

  return placed.sort((a, b) => a.size - b.size);
}

function pickPoint(seed: number, index: number, frameId: FrameKind) {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const centerBias = index < 8 ? 0.28 : 0.92;

  for (let attempt = 0; attempt < 160; attempt += 1) {
    const radius = Math.sqrt((index + attempt + 1) / 160) * 48 * centerBias;
    const angle = (seed % 360) * (Math.PI / 180) + attempt * goldenAngle;
    const x = 50 + Math.cos(angle) * radius;
    const y = 50 + Math.sin(angle) * radius;

    if (isInsideFrame(x, y, frameId)) {
      return { x, y };
    }
  }

  return { x: 50, y: 50 };
}

function isInsideFrame(x: number, y: number, frameId: FrameKind) {
  const nx = (x - 50) / 50;
  const ny = (y - 50) / 50;

  switch (frameId) {
    case "heart": {
      const heartY = ny + 0.18;
      return (nx * nx + heartY * heartY - 0.72) ** 3 - nx * nx * heartY ** 3 <= 0;
    }
    case "circle":
      return nx * nx + ny * ny <= 0.82;
    case "cross":
      return (Math.abs(nx) < 0.28 && Math.abs(ny) < 0.9) || (Math.abs(nx) < 0.9 && Math.abs(ny) < 0.24);
    case "star":
      return Math.abs(nx) + Math.abs(ny) < 1 || nx * nx + ny * ny < 0.28;
    case "rounded":
      return Math.abs(nx) < 0.86 && Math.abs(ny) < 0.78;
    default:
      return true;
  }
}

function hash(value: string) {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) {
    result = (result * 31 + value.charCodeAt(index)) >>> 0;
  }
  return result;
}
