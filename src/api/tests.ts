import { apiClient } from './client';
import type { ApiResponse, Test, TestFormData } from '../types';

export async function getTests(): Promise<Test[]> {
  const { data } = await apiClient.get<ApiResponse<Test[]>>('/tests');
  return data.data;
}

export async function getTestById(id: string): Promise<Test> {
  const { data } = await apiClient.get<ApiResponse<Test>>(`/tests/${id}`);
  return data.data;
}

export async function createTest(payload: TestFormData): Promise<Test> {
  const { data } = await apiClient.post<ApiResponse<Test>>('/tests', payload);
  return data.data;
}

export interface PublishTestPayload {
  status?: string | null;
  scheduled_date?: string;
  expiry_date?: string;
}

function buildPublishPayload(
  options?: Omit<PublishTestPayload, 'status'>,
): PublishTestPayload & { status: 'live' } {
  const payload: PublishTestPayload & { status: 'live' } = { status: 'live' };

  if (options?.scheduled_date) {
    payload.scheduled_date = options.scheduled_date;
  }
  if (options?.expiry_date) {
    payload.expiry_date = options.expiry_date;
  }

  return payload;
}

export async function updateTest(
  id: string,
  payload: Partial<TestFormData & PublishTestPayload & { questions?: string[] }>,
): Promise<Test> {
  const { data } = await apiClient.put<ApiResponse<Test>>(`/tests/${id}`, payload);
  return data.data;
}

export async function deleteTest(id: string): Promise<void> {
  await apiClient.delete(`/tests/${id}`);
}

export async function publishTest(
  id: string,
  options?: Omit<PublishTestPayload, 'status'>,
): Promise<Test> {
  return updateTest(id, buildPublishPayload(options));
}
