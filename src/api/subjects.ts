import { apiClient } from './client';
import type { ApiResponse, Subject, SubTopic, Topic } from '../types';

export async function getSubjects(): Promise<Subject[]> {
  const { data } = await apiClient.get<ApiResponse<Subject[]>>('/subjects');
  return data.data;
}

export async function getTopicsBySubject(subjectId: string): Promise<Topic[]> {
  const { data } = await apiClient.get<ApiResponse<Topic[]>>(
    `/topics/subject/${subjectId}`,
  );
  return data.data;
}

export async function getSubTopicsByTopic(topicId: string): Promise<SubTopic[]> {
  const { data } = await apiClient.get<ApiResponse<SubTopic[]>>(
    `/sub-topics/topic/${topicId}`,
  );
  return data.data;
}

export async function getSubTopicsByTopics(topicIds: string[]): Promise<SubTopic[]> {
  const { data } = await apiClient.post<ApiResponse<SubTopic[]>>(
    '/sub-topics/multi-topics',
    { topicIds },
  );
  return data.data;
}

export async function getSubTopicsForTopics(topicIds: string[]): Promise<SubTopic[]> {
  if (topicIds.length === 0) return [];
  if (topicIds.length === 1) return getSubTopicsByTopic(topicIds[0]);
  return getSubTopicsByTopics(topicIds);
}
