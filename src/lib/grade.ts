import type { Question } from "@/types";

/** 把判断题答案归一化为 "A"(对/正确) 或 "B"(错/错误) */
export function normalizeJudgeAnswer(raw: string): "A" | "B" | "" {
  const a = (raw || "").trim().toUpperCase();
  if (/^(对|正确|A|T|√|TRUE)$/.test(a)) return "A";
  if (/^(错|错误|B|F|×|FALSE)$/.test(a)) return "B";
  return "";
}

/** 取选项的字母标识(A/B/C…) */
export function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

/** 判断题统一展示的两个选项 */
export const JUDGE_OPTIONS = ["A. 正确", "B. 错误"];

/** 获取题目实际用于作答的选项 */
export function getDisplayOptions(q: Question): string[] {
  if (q.type === "judge") return JUDGE_OPTIONS;
  return q.options;
}

/** 获取题目的标准答案(已归一化为字母集合) */
export function getCorrectLetters(q: Question): string[] {
  if (q.type === "judge") {
    const n = normalizeJudgeAnswer(q.answer);
    return n ? [n] : [];
  }
  return q.answer
    .toUpperCase()
    .split("")
    .filter((c) => /[A-Z]/.test(c))
    .sort();
}

/** 判分:selected 是用户选择的字母数组 */
export function grade(q: Question, selected: string[]): boolean {
  const correct = getCorrectLetters(q);
  const sel = [...selected].sort();
  if (correct.length === 0) return false;
  if (sel.length !== correct.length) return false;
  return sel.every((c, i) => c === correct[i]);
}
