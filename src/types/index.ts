export interface User {
  id?: string;
  userId?: string;
  name?: string;
  email?: string;
}

export interface Subject {
  id: string;
  name: string;
}

export interface Topic {
  id: string;
  name: string;
  subject_id: string;
}

export interface SubTopic {
  id: string;
  name: string;
  topic_id: string;
}

export type TestStatus = 'draft' | 'live' | string;
export type TestType = 'chapterwise' | 'pyq' | 'mock' | string;
export type Difficulty = 'easy' | 'medium' | 'hard' | string;

export interface Test {
  id: string;
  name: string;
  type?: TestType;
  subject: string | Subject;
  subject_id?: string;
  topics?: string[] | Topic[];
  sub_topics?: string[] | SubTopic[];
  correct_marks?: number;
  wrong_marks?: number;
  unattempt_marks?: number;
  difficulty?: Difficulty;
  total_time?: number;
  total_marks?: number;
  total_questions?: number;
  status?: TestStatus;
  created_at?: string;
  scheduled_date?: string | null;
  expiry_date?: string | null;
  questions?: string[] | Question[];
}

export interface Question {
  id?: string;
  type?: string;
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correct_option: 'option1' | 'option2' | 'option3' | 'option4' | string;
  explanation?: string;
  difficulty?: Difficulty;
  subject?: string;
  topic_id?: string;
  sub_topic_id?: string;
  media_url?: string;
  test_id?: string;
}

/** Payload shape expected by POST /questions/bulk */
export interface BulkQuestionPayload {
  type?: string;
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correct_option: string;
  explanation?: string;
  difficulty?: string;
  subject: string;
  test_id?: string;
}

export interface TestFormData {
  name: string;
  type: TestType;
  subject: string;
  topics: string[];
  sub_topics: string[];
  correct_marks: number;
  wrong_marks: number;
  unattempt_marks: number;
  difficulty: Difficulty;
  total_time: number;
  total_marks: number;
  total_questions: number;
  status?: TestStatus | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
