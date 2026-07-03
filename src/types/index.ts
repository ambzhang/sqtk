export type QuestionType = "single" | "multi" | "judge" | "essay" | "unknown";
export type Quality = "answerable" | "view_only";

export interface Question {
  id: string;
  source: string;
  seq: number | null;
  number: number | null;
  type: QuestionType;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  quality: Quality;
  ai_explanation?: string | null;
  ai_explained_at?: string | null;
}

export interface MyStats {
  total_attempts: number;
  correct_attempts: number;
  distinct_done: number;
  wrong_pending: number;
  fav_count: number;
}

export const TYPE_LABELS: Record<QuestionType, string> = {
  single: "单选题",
  multi: "多选题",
  judge: "判断题",
  essay: "简答题",
  unknown: "其他",
};
