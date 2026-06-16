import { apiClient } from './client';
import type { ApiResponse, BulkQuestionPayload, Question } from '../types';

export function toBulkQuestionPayload(
  question: Omit<Question, 'id'>,
  subjectId: string,
): BulkQuestionPayload {
  return {
    type: question.type ?? 'mcq',
    question: question.question,
    option1: question.option1,
    option2: question.option2,
    option3: question.option3,
    option4: question.option4,
    correct_option: question.correct_option,
    explanation: question.explanation,
    difficulty: question.difficulty,
    subject: subjectId,
    test_id: question.test_id,
  };
}

export async function bulkCreateQuestions(
  questions: Omit<Question, 'id'>[],
  subjectId: string,
): Promise<Question[]> {
  const payload = questions.map((q) => toBulkQuestionPayload(q, subjectId));
  const { data } = await apiClient.post<ApiResponse<Question[]>>(
    '/questions/bulk',
    { questions: payload },
  );
  return data.data;
}

export async function fetchQuestionsBulk(questionIds: string[]): Promise<Question[]> {
  const { data } = await apiClient.post<ApiResponse<Question[]>>(
    '/questions/fetchBulk',
    { question_ids: questionIds },
  );
  return data.data;
}
