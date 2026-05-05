import type { FrameConfig, FrameKind } from "./types";

export const frames: Record<FrameKind, FrameConfig> = {
  heart: {
    id: "heart",
    name: "하트",
    description: "첨부 예시처럼 따뜻한 메시지를 담기 좋은 프레임",
    viewBox: "0 0 100 90",
    path: "M50 82 C20 58 6 44 6 25 C6 12 16 4 29 4 C38 4 46 9 50 17 C54 9 62 4 71 4 C84 4 94 12 94 25 C94 44 80 58 50 82 Z",
  },
  circle: {
    id: "circle",
    name: "원",
    description: "가장 안정적인 기본 워드클라우드 프레임",
    viewBox: "0 0 100 100",
    path: "M50 4 A46 46 0 1 1 49.9 4 Z",
  },
  cross: {
    id: "cross",
    name: "십자가",
    description: "예배나 공동체 모임에 맞는 프레임",
    viewBox: "0 0 100 100",
    path: "M38 4 H62 V35 H92 V59 H62 V96 H38 V59 H8 V35 H38 Z",
  },
  star: {
    id: "star",
    name: "별",
    description: "축하와 이벤트에 어울리는 프레임",
    viewBox: "0 0 100 100",
    path: "M50 5 L61 36 L94 36 L67 56 L78 90 L50 70 L22 90 L33 56 L6 36 L39 36 Z",
  },
  rounded: {
    id: "rounded",
    name: "라운드 카드",
    description: "발표 화면에서 가장 읽기 쉬운 넓은 프레임",
    viewBox: "0 0 100 100",
    path: "M14 8 H86 C91 8 96 13 96 18 V82 C96 87 91 92 86 92 H14 C9 92 4 87 4 82 V18 C4 13 9 8 14 8 Z",
  },
};

export const defaultFrame = frames.heart;

export function getFrame(frameId: FrameKind | string | undefined): FrameConfig {
  if (!frameId || !(frameId in frames)) {
    return defaultFrame;
  }

  return frames[frameId as FrameKind];
}
