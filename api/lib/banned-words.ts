import { eq } from "drizzle-orm";
import { bannedWords } from "@db/schema";
import type { getDb } from "../queries/connection";

type Db = ReturnType<typeof getDb>;

export type ModerationTextField = {
  field: string;
  label: string;
  value?: string | string[] | null;
};

const normalize = (value: string) =>
  value
    .toLocaleLowerCase("de-DE")
    .normalize("NFKC")
    .trim();

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const containsBannedWord = (text: string, word: string, matchMode: "exact" | "contains") => {
  const normalizedText = normalize(text);
  const normalizedWord = normalize(word);

  if (!normalizedWord) return false;

  if (matchMode === "exact") {
    return new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(normalizedWord)}([^\\p{L}\\p{N}]|$)`, "iu").test(normalizedText);
  }

  return normalizedText.includes(normalizedWord);
};

export async function findBlockedContent(db: Db, fields: ModerationTextField[]) {
  const activeWords = await db
    .select({ id: bannedWords.id, word: bannedWords.word, matchMode: bannedWords.matchMode })
    .from(bannedWords)
    .where(eq(bannedWords.isActive, true));

  const violations: Array<{ field: string; label: string; word: string }> = [];

  for (const field of fields) {
    const values = Array.isArray(field.value) ? field.value : [field.value];
    const text = values.filter((value): value is string => typeof value === "string" && value.trim().length > 0).join(" ");
    if (!text) continue;

    for (const bannedWord of activeWords) {
      if (containsBannedWord(text, bannedWord.word, bannedWord.matchMode as "exact" | "contains")) {
        violations.push({ field: field.field, label: field.label, word: bannedWord.word });
      }
    }
  }

  return violations;
}

export async function assertNoBlockedContent(db: Db, fields: ModerationTextField[]) {
  const violations = await findBlockedContent(db, fields);

  if (violations.length > 0) {
    const affectedFields = Array.from(new Set(violations.map((violation) => violation.label))).join(", ");
    const words = Array.from(new Set(violations.map((violation) => violation.word))).join(", ");
    throw new Error(`Dieser Inhalt enthält gesperrte Wörter (${words}) in folgenden Feldern: ${affectedFields}. Bitte entferne diese Begriffe.`);
  }
}
