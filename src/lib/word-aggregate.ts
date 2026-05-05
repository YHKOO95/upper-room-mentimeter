import type { ParticipantSubmission, WordCount } from "./types";

const stopWords = new Set([
  "그리고",
  "그러나",
  "하지만",
  "저는",
  "우리는",
  "너무",
  "정말",
  "the",
  "and",
  "for",
  "with",
]);

export function tokenize(input: string): string[] {
  return input
    .toLocaleLowerCase("ko-KR")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2 && !stopWords.has(word));
}

export function aggregateWords(submissions: ParticipantSubmission[]): WordCount[] {
  const counter = new Map<string, number>();

  for (const submission of submissions) {
    for (const token of tokenize(submission.text)) {
      counter.set(token, (counter.get(token) ?? 0) + 1);
    }
  }

  return [...counter.entries()]
    .map(([text, value]) => ({ text, value }))
    .sort((a, b) => b.value - a.value || a.text.localeCompare(b.text, "ko-KR"))
    .slice(0, 80);
}

export function getRooms(submissions: ParticipantSubmission[]): string[] {
  return [...new Set(submissions.map((submission) => submission.roomName).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, "ko-KR"),
  );
}

export function aggregateByRoom(
  submissions: ParticipantSubmission[],
  roomName: string,
): WordCount[] {
  return aggregateWords(submissions.filter((submission) => submission.roomName === roomName));
}
