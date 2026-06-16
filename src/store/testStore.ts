import { create } from 'zustand';
import type { Question, Test } from '../types';

interface TestDraftState {
  currentTest: Test | null;
  pendingQuestions: Question[];
  setCurrentTest: (test: Test | null) => void;
  setPendingQuestions: (questions: Question[]) => void;
  addPendingQuestion: (question: Question) => void;
  updatePendingQuestion: (index: number, question: Question) => void;
  removePendingQuestion: (index: number) => void;
  clearDraft: () => void;
}

export const useTestStore = create<TestDraftState>((set) => ({
  currentTest: null,
  pendingQuestions: [],
  setCurrentTest: (test) => set({ currentTest: test }),
  setPendingQuestions: (questions) => set({ pendingQuestions: questions }),
  addPendingQuestion: (question) =>
    set((state) => ({ pendingQuestions: [...state.pendingQuestions, question] })),
  updatePendingQuestion: (index, question) =>
    set((state) => ({
      pendingQuestions: state.pendingQuestions.map((q, i) =>
        i === index ? question : q,
      ),
    })),
  removePendingQuestion: (index) =>
    set((state) => ({
      pendingQuestions: state.pendingQuestions.filter((_, i) => i !== index),
    })),
  clearDraft: () => set({ currentTest: null, pendingQuestions: [] }),
}));
