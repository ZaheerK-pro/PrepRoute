import { getSubjects, getSubTopicsForTopics, getTopicsBySubject } from '../api/subjects';
import type { Test } from '../types';
import {
  resolveSubjectId,
  resolveSubjectName,
  resolveSubTopicName,
  resolveTopicId,
  resolveTopicName,
} from './entityResolve';

export interface TestDisplayLabels {
  subject: string;
  topics: string[];
  subTopics: string[];
}

export async function resolveTestDisplayLabels(test: Test): Promise<TestDisplayLabels> {
  const subjects = await getSubjects();
  const subject = resolveSubjectName(test.subject, subjects);
  const subjectId = resolveSubjectId(test.subject, subjects);

  if (!subjectId) {
    return {
      subject,
      topics: (test.topics ?? []).map((ref) =>
        typeof ref === 'string' ? ref : ref.name,
      ),
      subTopics: (test.sub_topics ?? []).map((ref) =>
        typeof ref === 'string' ? ref : ref.name,
      ),
    };
  }

  const topicList = await getTopicsBySubject(subjectId);
  const topics = (test.topics ?? [])
    .map((ref) => resolveTopicName(typeof ref === 'string' ? ref : ref, topicList))
    .filter((name) => name !== '—');

  const topicIds = (test.topics ?? [])
    .map((ref) => resolveTopicId(typeof ref === 'string' ? ref : ref, topicList))
    .filter((id): id is string => Boolean(id));

  const subTopicList =
    topicIds.length > 0 ? await getSubTopicsForTopics(topicIds) : [];

  const subTopics = (test.sub_topics ?? [])
    .map((ref) => resolveSubTopicName(typeof ref === 'string' ? ref : ref, subTopicList))
    .filter((name) => name !== '—');

  return { subject, topics, subTopics };
}
