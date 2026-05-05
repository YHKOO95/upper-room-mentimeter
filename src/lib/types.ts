export type FrameKind = "heart" | "circle" | "cross" | "star" | "rounded";

export type FrameConfig = {
  id: FrameKind;
  name: string;
  description: string;
  path: string;
  viewBox: string;
};

export type ParticipantSubmission = {
  id: string;
  sessionCode: string;
  groupName: string;
  roomName: string;
  text: string;
  createdAt: string;
};

export type WordCount = {
  text: string;
  value: number;
};

export type SessionConfig = {
  code: string;
  title: string;
  question: string;
  frameId: FrameKind;
  colorTheme: string[];
  isAcceptingResponses: boolean;
};

export type PresentationTab = "all" | "room";
