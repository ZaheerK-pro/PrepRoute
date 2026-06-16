import type { Subject, SubTopic, Test, Topic } from '../types';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function resolveSubjectId(
  subject: Test['subject'] | string | undefined,
  subjects?: Subject[],
): string | undefined {
  if (!subject) return undefined;
  if (typeof subject === 'object') return subject.id;
  if (isUuid(subject)) return subject;
  return subjects?.find((s) => s.name === subject)?.id;
}

export function resolveTopicId(
  ref: string | Topic | undefined,
  topics: Topic[],
): string | undefined {
  if (!ref) return undefined;
  if (typeof ref === 'object') return ref.id;
  if (isUuid(ref)) return ref;
  return topics.find((t) => t.name === ref)?.id;
}

export function resolveSubTopicId(
  ref: string | SubTopic | undefined,
  subTopics: SubTopic[],
): string | undefined {
  if (!ref) return undefined;
  if (typeof ref === 'object') return ref.id;
  if (isUuid(ref)) return ref;
  return subTopics.find((st) => st.name === ref)?.id;
}

export function enrichTestWithSubjectId(test: Test, subjects?: Subject[]): Test {
  const subjectId = test.subject_id ?? resolveSubjectId(test.subject, subjects);
  if (!subjectId || subjectId === test.subject_id) return test;
  return { ...test, subject_id: subjectId };
}

export function resolveSubjectName(
  subject: Test['subject'] | string | undefined,
  subjects: Subject[],
): string {
  if (!subject) return '—';
  if (typeof subject === 'object') return subject.name;
  if (isUuid(subject)) return subjects.find((s) => s.id === subject)?.name ?? '—';
  return subject;
}

export function resolveTopicName(
  ref: string | Topic | undefined,
  topics: Topic[],
): string {
  if (!ref) return '—';
  if (typeof ref === 'object') return ref.name;
  if (isUuid(ref)) return topics.find((t) => t.id === ref)?.name ?? '—';
  return ref;
}

export function resolveSubTopicName(
  ref: string | SubTopic | undefined,
  subTopics: SubTopic[],
): string {
  if (!ref) return '—';
  if (typeof ref === 'object') return ref.name;
  if (isUuid(ref)) return subTopics.find((st) => st.id === ref)?.name ?? '—';
  return ref;
}

export function enrichTestWithDisplayNames(
  test: Test,
  subjects: Subject[],
  topics: Topic[],
  subTopics: SubTopic[],
): Test {
  return {
    ...test,
    subject: resolveSubjectName(test.subject, subjects),
    topics: (test.topics ?? []).map((ref) =>
      resolveTopicName(typeof ref === 'string' ? ref : ref, topics),
    ),
    sub_topics: (test.sub_topics ?? []).map((ref) =>
      resolveSubTopicName(typeof ref === 'string' ? ref : ref, subTopics),
    ),
  };
}
