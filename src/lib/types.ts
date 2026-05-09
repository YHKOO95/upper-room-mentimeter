// New shapes — used by wordart.ts, word-store.ts, new pages
export type ShapeKind = "poster" | "prayer" | "attic" | "stairs" | "house" | "window" | "circle";

// Legacy shapes — used by frames.ts, FrameWordCloud.tsx, demo-store.ts, supabase.ts
export type FrameKind = "heart" | "circle" | "cross" | "star" | "rounded";

export type FrameConfig = {
  id: FrameKind;
  name: string;
  description: string;
  path: string;
  viewBox: string;
};

// Legacy submission type — kept for supabase.ts / use-wordcloud-session.ts
export type ParticipantSubmission = {
  id: string;
  sessionCode: string;
  groupName: string;
  roomName: string;
  text: string;
  createdAt: string;
};

// Legacy session config — kept for supabase.ts / use-wordcloud-session.ts
export type SessionConfig = {
  code: string;
  title: string;
  question: string;
  frameId: FrameKind;
  colorTheme: string[];
  isAcceptingResponses: boolean;
};

// Word entry for the new word-count store
export type WordEntry = {
  id: string;
  text: string;
  count: number;
  ts: number;
};

export type WordCount = {
  text: string;
  value: number;
};

export type PresentationTab = "all" | "room";
