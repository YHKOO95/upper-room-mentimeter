"use client";

import type { FrameKind, ParticipantSubmission, SessionConfig } from "./types";

const submissionsKey = "menti-wordcloud.submissions";
const sessionKey = "menti-wordcloud.session";
const changedEvent = "menti-wordcloud:changed";
const legacySessionCode = "GARAK";
const legacySessionTitle = "Garak WordCloud";

export const defaultSession: SessionConfig = {
  code: "UPPER",
  title: "Upper Room",
  question: "오늘 공동체 안에서 가장 마음에 남은 단어는 무엇인가요?",
  frameId: "heart",
  colorTheme: ["#16a34a", "#9333ea", "#dc2626", "#2563eb", "#f59e0b", "#0f766e"],
  isAcceptingResponses: true,
};

export function readLocalSession(): SessionConfig {
  if (typeof window === "undefined") {
    return defaultSession;
  }

  const raw = window.localStorage.getItem(sessionKey);
  if (!raw) {
    return defaultSession;
  }

  return normalizeSession({ ...defaultSession, ...JSON.parse(raw) } as SessionConfig);
}

export function saveLocalSession(session: SessionConfig) {
  window.localStorage.setItem(sessionKey, JSON.stringify(session));
  window.dispatchEvent(new Event(changedEvent));
}

export function readLocalSubmissions(): ParticipantSubmission[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(submissionsKey);
  return raw ? (JSON.parse(raw) as ParticipantSubmission[]) : seedSubmissions();
}

export function addLocalSubmission(input: Omit<ParticipantSubmission, "id" | "createdAt">) {
  const submissions = readLocalSubmissions();
  const next: ParticipantSubmission = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  window.localStorage.setItem(submissionsKey, JSON.stringify([next, ...submissions]));
  window.dispatchEvent(new Event(changedEvent));

  return next;
}

export function subscribeLocalChanges(listener: () => void) {
  window.addEventListener(changedEvent, listener);
  window.addEventListener("storage", listener);

  return () => {
    window.removeEventListener(changedEvent, listener);
    window.removeEventListener("storage", listener);
  };
}

export function updateLocalFrame(frameId: FrameKind) {
  saveLocalSession({ ...readLocalSession(), frameId });
}

function normalizeSession(session: SessionConfig): SessionConfig {
  return {
    ...session,
    code: session.code === legacySessionCode ? defaultSession.code : session.code,
    title: session.title === legacySessionTitle ? defaultSession.title : session.title,
  };
}

function seedSubmissions(): ParticipantSubmission[] {
  const now = new Date().toISOString();
  return [
    ["리더십", "믿음", "사랑", "공동체", "기도", "은혜"],
    ["감사", "회복", "소망", "섬김", "나눔", "평안"],
    ["성장", "동행", "헌신", "비전", "기쁨", "말씀"],
  ].flatMap((words, groupIndex) =>
    words.map((text, wordIndex) => ({
      id: `seed-${groupIndex}-${wordIndex}`,
      sessionCode: defaultSession.code,
      groupName: `${groupIndex + 1}그룹`,
      roomName: `${groupIndex + 1}다락방`,
      text,
      createdAt: now,
    })),
  );
}
