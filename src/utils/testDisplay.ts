import type { Test, TestType } from '../types';

export const TEST_TYPE_OPTIONS: { value: TestType; label: string }[] = [
  { value: 'chapterwise', label: 'Chapterwise' },
  { value: 'pyq', label: 'PYQ' },
  { value: 'mock', label: 'Mock Test' },
];

/** Map legacy/UI values to API enum values. */
export function normalizeTestType(type?: string): TestType {
  switch (type) {
    case 'chapter':
    case 'chapterwise':
      return 'chapterwise';
    case 'practice':
    case 'pyq':
      return 'pyq';
    case 'mock':
      return 'mock';
    default:
      return 'chapterwise';
  }
}

export function getSubjectLabel(subject: Test['subject']) {
  if (typeof subject === 'string') return subject;
  return subject?.name ?? '—';
}

export function getTopicNames(topics?: Test['topics']) {
  if (!topics?.length) return [];
  return topics.map((t) => (typeof t === 'string' ? t : t.name));
}

export function getSubTopicNames(subTopics?: Test['sub_topics']) {
  if (!subTopics?.length) return [];
  return subTopics.map((st) => (typeof st === 'string' ? st : st.name));
}

export function getTestTypeLabel(type?: string) {
  switch (normalizeTestType(type)) {
    case 'chapterwise':
      return 'Chapter Wise';
    case 'pyq':
      return 'PYQ';
    case 'mock':
      return 'Mock Test';
    default:
      return type ?? 'Chapter Wise';
  }
}

export function getDifficultyLabel(difficulty?: string) {
  switch (difficulty) {
    case 'easy':
      return 'Easy';
    case 'medium':
      return 'Medium';
    case 'hard':
      return 'Difficult';
    default:
      return difficulty ?? 'Easy';
  }
}

export function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
