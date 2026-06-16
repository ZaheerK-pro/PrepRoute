import { resolveSubTopicId, resolveTopicId } from './entityResolve';
import type { Question, SubTopic, Topic } from '../types';

const REQUIRED_HEADERS = [
  'question',
  'option1',
  'option2',
  'option3',
  'option4',
  'correct_option',
] as const;

const OPTIONAL_HEADERS = [
  'explanation',
  'difficulty',
  'topic',
  'sub_topic',
  'media_url',
] as const;

export type CsvQuestionHeader = (typeof REQUIRED_HEADERS)[number] | (typeof OPTIONAL_HEADERS)[number];

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, '_');
}

/** Parse a single CSV line respecting quoted fields. */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  fields.push(current.trim());
  return fields;
}

function normalizeCorrectOption(value: string): Question['correct_option'] | null {
  const normalized = value.trim().toLowerCase();

  if (['option1', 'option2', 'option3', 'option4'].includes(normalized)) {
    return normalized as Question['correct_option'];
  }

  const byIndex: Record<string, Question['correct_option']> = {
    '1': 'option1',
    '2': 'option2',
    '3': 'option3',
    '4': 'option4',
    a: 'option1',
    b: 'option2',
    c: 'option3',
    d: 'option4',
  };

  return byIndex[normalized] ?? null;
}

export interface ParseQuestionsCsvOptions {
  subjectId?: string;
  testId?: string;
  defaultTopicId?: string;
  defaultSubTopicId?: string;
  defaultDifficulty?: string;
  topics?: Topic[];
  subTopics?: SubTopic[];
}

export interface ParseQuestionsCsvResult {
  questions: Question[];
  errors: string[];
}

export function parseQuestionsCsv(
  csvText: string,
  options: ParseQuestionsCsvOptions = {},
): ParseQuestionsCsvResult {
  const lines = csvText
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return { questions: [], errors: ['CSV must include a header row and at least one question.'] };
  }

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    return {
      questions: [],
      errors: [`Missing required column(s): ${missing.join(', ')}`],
    };
  }

  const questions: Question[] = [];
  const errors: string[] = [];

  for (let rowIndex = 1; rowIndex < lines.length; rowIndex += 1) {
    const values = parseCsvLine(lines[rowIndex]);
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header] = values[i] ?? '';
    });

    const rowLabel = `Row ${rowIndex + 1}`;
    const questionText = row.question?.trim();
    if (!questionText) {
      errors.push(`${rowLabel}: question text is empty.`);
      continue;
    }

    const correctOption = normalizeCorrectOption(row.correct_option ?? '');
    if (!correctOption) {
      errors.push(
        `${rowLabel}: invalid correct_option "${row.correct_option}". Use option1–option4, 1–4, or A–D.`,
      );
      continue;
    }

    const option1 = row.option1?.trim() ?? '';
    const option2 = row.option2?.trim() ?? '';
    const option3 = row.option3?.trim() ?? '';
    const option4 = row.option4?.trim() ?? '';

    if (!option1 || !option2 || !option3 || !option4) {
      errors.push(`${rowLabel}: all four options are required.`);
      continue;
    }

    const topicId =
      resolveTopicId(row.topic?.trim(), options.topics ?? []) ||
      options.defaultTopicId ||
      undefined;
    const subTopicId =
      resolveSubTopicId(row.sub_topic?.trim(), options.subTopics ?? []) ||
      options.defaultSubTopicId ||
      undefined;

    questions.push({
      type: 'mcq',
      question: questionText,
      option1,
      option2,
      option3,
      option4,
      correct_option: correctOption,
      explanation: row.explanation?.trim() || undefined,
      difficulty: row.difficulty?.trim() || options.defaultDifficulty || undefined,
      topic_id: topicId,
      sub_topic_id: subTopicId,
      media_url: row.media_url?.trim() || undefined,
      subject: options.subjectId,
      test_id: options.testId,
    });
  }

  return { questions, errors };
}
