import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { bulkCreateQuestions, fetchQuestionsBulk } from '../api/questions';
import {
  getSubjects,
  getSubTopicsByTopic,
  getSubTopicsForTopics,
  getTopicsBySubject,
} from '../api/subjects';
import { getTestById, updateTest } from '../api/tests';
import { FormSelect } from '../components/FormSelect';
import { Layout } from '../components/Layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { RichTextArea } from '../components/RichTextArea';
import { TestSummaryCard } from '../components/TestSummaryCard';
import { useTestStore } from '../store/testStore';
import { notifyError, notifySuccess } from '../store/notificationStore';
import { getApiErrorMessage } from '../utils/apiErrors';
import { parseQuestionsCsv } from '../utils/csvQuestions';
import {
  enrichTestWithDisplayNames,
  enrichTestWithSubjectId,
  resolveSubjectId,
  resolveSubTopicId,
  resolveTopicId,
} from '../utils/entityResolve';
import { getTestTypeLabel } from '../utils/testDisplay';
import type { Question, Subject, SubTopic, Test, Topic } from '../types';

const questionSchema = z.object({
  question: z.string().min(1, 'Question text is required'),
  option1: z.string().min(1, 'Option 1 is required'),
  option2: z.string().min(1, 'Option 2 is required'),
  option3: z.string().min(1, 'Option 3 is required'),
  option4: z.string().min(1, 'Option 4 is required'),
  correct_option: z.enum(['option1', 'option2', 'option3', 'option4']),
  explanation: z.string().optional(),
  difficulty: z.string().optional(),
  topic_id: z.string().optional(),
  sub_topic_id: z.string().optional(),
});

type QuestionFormValues = z.infer<typeof questionSchema>;

const OPTION_KEYS = ['option1', 'option2', 'option3', 'option4'] as const;

export function QuestionsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentTest,
    setCurrentTest,
    pendingQuestions,
    setPendingQuestions,
    addPendingQuestion,
    updatePendingQuestion,
    removePendingQuestion,
  } = useTestStore();

  const [test, setTest] = useState<Test | null>(currentTest);
  const [subjectId, setSubjectId] = useState<string | undefined>();
  const [defaultTopicId, setDefaultTopicId] = useState('');
  const [defaultSubTopicId, setDefaultSubTopicId] = useState('');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subTopics, setSubTopics] = useState<SubTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      question: '',
      option1: '',
      option2: '',
      option3: '',
      option4: '',
      correct_option: 'option1',
      explanation: '',
      difficulty: '',
      topic_id: '',
      sub_topic_id: '',
    },
  });

  const questionText = watch('question');
  const explanationText = watch('explanation');
  const selectedTopicId = watch('topic_id');
  const selectedDifficulty = watch('difficulty');
  const selectedSubTopicId = watch('sub_topic_id');
  const correctOption = watch('correct_option');
  const totalTarget = test?.total_questions ?? 50;

  useEffect(() => {
    if (!id) return;

    void (async () => {
      try {
        const testData = currentTest?.id === id ? currentTest : await getTestById(id);
        const subjects: Subject[] = await getSubjects();
        const resolvedSubjectId = resolveSubjectId(testData.subject, subjects);

        let topicList: Topic[] = [];
        let subTopicList: SubTopic[] = [];

        if (resolvedSubjectId) {
          topicList = await getTopicsBySubject(resolvedSubjectId);
          setTopics(topicList);
          const topicIds = topicList.map((t) => t.id);
          if (topicIds.length > 0) {
            subTopicList = await getSubTopicsForTopics(topicIds);
            setSubTopics(subTopicList);
          }
        }

        const enrichedTest = enrichTestWithDisplayNames(
          enrichTestWithSubjectId(
            { ...testData, subject_id: resolvedSubjectId },
            subjects,
          ),
          subjects,
          topicList,
          subTopicList,
        );

        setTest(enrichedTest);
        setCurrentTest(enrichedTest);
        setSubjectId(resolvedSubjectId);

        const testTopicId = resolveTopicId(
          Array.isArray(testData.topics) ? testData.topics[0] : undefined,
          topicList,
        );
        const testSubTopicId = resolveSubTopicId(
          Array.isArray(testData.sub_topics) ? testData.sub_topics[0] : undefined,
          subTopicList,
        );
        setDefaultTopicId(testTopicId ?? '');
        setDefaultSubTopicId(testSubTopicId ?? '');

        const questionIds = Array.isArray(testData.questions)
          ? testData.questions.map((q) => (typeof q === 'string' ? q : q.id ?? '')).filter(Boolean)
          : [];

        if (questionIds.length > 0) {
          const loaded = await fetchQuestionsBulk(questionIds);
          setPendingQuestions(loaded);
          setActiveQuestionIndex(Math.min(loaded.length, (testData.total_questions ?? 50) - 1));
        }
      } catch {
        notifyError('Failed to load test data.', 'Could not load questions');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, currentTest, setCurrentTest, setPendingQuestions]);

  useEffect(() => {
    if (!selectedTopicId) return;
    void getSubTopicsByTopic(selectedTopicId).then(setSubTopics).catch(() => undefined);
  }, [selectedTopicId]);

  const questionNavItems = useMemo(() => {
    return Array.from({ length: totalTarget }, (_, index) => ({
      index,
      label: `Question ${index + 1}`,
      completed: index < pendingQuestions.length,
      active: index === activeQuestionIndex,
      placeholder: index > pendingQuestions.length && index !== activeQuestionIndex,
    }));
  }, [totalTarget, pendingQuestions.length, activeQuestionIndex]);

  const loadQuestionIntoForm = (index: number) => {
    const q = pendingQuestions[index];
    if (!q) {
      setEditingIndex(null);
      reset({
        question: '',
        option1: '',
        option2: '',
        option3: '',
        option4: '',
        correct_option: 'option1',
        explanation: '',
        difficulty: test?.difficulty ?? '',
        topic_id: defaultTopicId,
        sub_topic_id: defaultSubTopicId,
      });
      return;
    }

    setEditingIndex(index);
    reset({
      question: q.question,
      option1: q.option1,
      option2: q.option2,
      option3: q.option3,
      option4: q.option4,
      correct_option: q.correct_option as QuestionFormValues['correct_option'],
      explanation: q.explanation ?? '',
      difficulty: q.difficulty ?? test?.difficulty ?? '',
      topic_id: q.topic_id ?? defaultTopicId,
      sub_topic_id: q.sub_topic_id ?? defaultSubTopicId,
    });
  };

  useEffect(() => {
    if (loading) return;
    loadQuestionIntoForm(activeQuestionIndex);
  }, [activeQuestionIndex, pendingQuestions.length, loading, defaultTopicId, defaultSubTopicId]);

  const buildQuestionFromValues = (values: QuestionFormValues): Question => ({
    type: 'mcq',
    question: values.question,
    option1: values.option1,
    option2: values.option2,
    option3: values.option3,
    option4: values.option4,
    correct_option: values.correct_option,
    explanation: values.explanation || undefined,
    difficulty: values.difficulty || undefined,
    subject: subjectId,
    topic_id: values.topic_id || undefined,
    sub_topic_id: values.sub_topic_id || undefined,
    test_id: id,
  });

  const saveCurrentQuestion = async () => {
    await new Promise<void>((resolve, reject) => {
      handleSubmit(
        (values) => {
          const question = buildQuestionFromValues(values);
          if (editingIndex !== null && editingIndex < pendingQuestions.length) {
            updatePendingQuestion(editingIndex, question);
          } else {
            addPendingQuestion(question);
            setEditingIndex(pendingQuestions.length);
          }
          resolve();
        },
        () => reject(new Error('validation')),
      )();
    });
  };

  const handleSelectQuestion = (index: number) => {
    void saveCurrentQuestion()
      .catch(() => undefined)
      .finally(() => {
        setActiveQuestionIndex(index);
        loadQuestionIntoForm(index);
      });
  };

  const handlePrevQuestion = () => {
    void saveCurrentQuestion()
      .catch(() => undefined)
      .finally(() => {
        const next = Math.max(0, activeQuestionIndex - 1);
        setActiveQuestionIndex(next);
        loadQuestionIntoForm(next);
      });
  };

  const handleNextQuestion = () => {
    void saveCurrentQuestion()
      .catch(() => undefined)
      .finally(() => {
        const next = Math.min(totalTarget - 1, activeQuestionIndex + 1);
        setActiveQuestionIndex(next);
        loadQuestionIntoForm(next);
      });
  };

  const handleCsvImport = async (file: File) => {
    try {
      const text = await file.text();
      const { questions: imported, errors } = parseQuestionsCsv(text, {
        subjectId,
        testId: id,
        defaultTopicId,
        defaultSubTopicId,
        defaultDifficulty: test?.difficulty,
        topics,
        subTopics,
      });

      if (imported.length === 0) {
        notifyError(
          errors[0] ?? 'No valid questions found in the CSV file.',
          'CSV import failed',
        );
        return;
      }

      await saveCurrentQuestion().catch(() => undefined);

      const existing = useTestStore.getState().pendingQuestions;
      const startIndex = existing.length;
      setPendingQuestions([...existing, ...imported]);
      setActiveQuestionIndex(startIndex);
      setEditingIndex(startIndex);

      if (errors.length > 0) {
        notifyError(
          `Imported ${imported.length} question(s). Skipped ${errors.length} row(s): ${errors.slice(0, 2).join(' ')}`,
          'CSV partially imported',
        );
      } else {
        notifySuccess(
          `Imported ${imported.length} question(s) from CSV.`,
          'CSV imported',
        );
      }
    } catch {
      notifyError('Could not read the CSV file. Please check the format.', 'CSV import failed');
    } finally {
      if (csvInputRef.current) {
        csvInputRef.current.value = '';
      }
    }
  };

  const clearCurrentEdits = () => {
    reset({
      question: '',
      option1: '',
      option2: '',
      option3: '',
      option4: '',
      correct_option: 'option1',
      explanation: '',
      difficulty: test?.difficulty ?? '',
      topic_id: defaultTopicId,
      sub_topic_id: defaultSubTopicId,
    });
    if (editingIndex !== null && editingIndex < pendingQuestions.length) {
      removePendingQuestion(editingIndex);
      setActiveQuestionIndex(Math.max(0, editingIndex - 1));
    }
    setEditingIndex(null);
  };

  const handleSaveAndContinue = async () => {
    if (!id) return;

    try {
      await saveCurrentQuestion();
    } catch {
      notifyError('Please complete the current question before continuing.', 'Incomplete question');
      return;
    }

    const latestQuestions = useTestStore.getState().pendingQuestions;
    if (latestQuestions.length === 0) {
      notifyError('Add at least one question before continuing.', 'No questions added');
      return;
    }

    if (!subjectId) {
      notifyError(
        'Could not resolve the subject for this test. Go back and re-save the test.',
        'Subject missing',
      );
      return;
    }

    setSaving(true);

    try {
      const newQuestions = latestQuestions.filter((q) => !q.id);
      let allQuestionIds = latestQuestions.filter((q) => q.id).map((q) => q.id!);

      if (newQuestions.length > 0) {
        const created = await bulkCreateQuestions(
          newQuestions.map((q) => ({ ...q, test_id: id, subject: subjectId })),
          subjectId,
        );
        allQuestionIds = [...allQuestionIds, ...created.map((q) => q.id!).filter(Boolean)];
        setPendingQuestions([...latestQuestions.filter((q) => q.id), ...created]);
      }

      await updateTest(id, {
        questions: allQuestionIds,
        total_questions: allQuestionIds.length,
        total_marks: (test?.correct_marks ?? 5) * allQuestionIds.length,
      });

      navigate(`/tests/${id}/preview`);
    } catch (err: unknown) {
      notifyError(getApiErrorMessage(err, 'Failed to save questions.'), 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const breadcrumbs = ['Test Creation', 'Create Test', getTestTypeLabel(test?.type)];

  if (loading) {
    return (
      <Layout
        activeNav="test-creation"
        breadcrumbs={breadcrumbs}
        showQuestionPanel
        questionPanel={{ totalQuestions: totalTarget, items: [], onSelect: () => undefined }}
      >
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout
      activeNav="test-creation"
      breadcrumbs={breadcrumbs}
      topBarAction={
        <button
          type="button"
          className="btn btn-primary btn-publish"
          disabled={saving}
          onClick={() => void handleSaveAndContinue()}
        >
          {saving ? 'Saving...' : 'Publish'}
        </button>
      }
      showQuestionPanel
      questionPanel={{
        totalQuestions: totalTarget,
        items: questionNavItems,
        onSelect: handleSelectQuestion,
      }}
    >
      <div className="questions-page">
        {test && <TestSummaryCard test={test} />}

        <form
          className="question-editor"
          onSubmit={(e) => {
            e.preventDefault();
            void saveCurrentQuestion().catch(() => undefined);
          }}
        >
          <div className="question-editor-header">
            <h2>
              Question {activeQuestionIndex + 1}/{totalTarget}
            </h2>
            <div className="question-editor-actions">
              <button type="button" className="chip-btn">
                + MCQ
              </button>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,text/csv"
                className="csv-file-input"
                aria-hidden
                tabIndex={-1}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleCsvImport(file);
                }}
              />
              <button
                type="button"
                className="chip-btn chip-btn-muted"
                onClick={() => csvInputRef.current?.click()}
              >
                + CSV
              </button>
            </div>
          </div>

          <button type="button" className="delete-all-edits" onClick={clearCurrentEdits}>
            <span aria-hidden="true">🗑</span> Delete All Edits
          </button>

          <div className="form-group question-field">
            <RichTextArea
              id="question"
              value={questionText ?? ''}
              onChange={(v) => setValue('question', v, { shouldValidate: true })}
              onClear={() => setValue('question', '')}
            />
            {errors.question && <span className="field-error">{errors.question.message}</span>}
          </div>

          <div className="options-section">
            <p className="section-label">Type the options below</p>
            {OPTION_KEYS.map((opt) => (
              <div className="option-row" key={opt}>
                <label className="option-radio">
                  <input
                    type="radio"
                    value={opt}
                    checked={correctOption === opt}
                    onChange={() => setValue('correct_option', opt, { shouldValidate: true })}
                  />
                </label>
                <input type="text" placeholder="Type Option here" {...register(opt)} />
                <button
                  type="button"
                  className="icon-btn option-clear"
                  aria-label="Clear option"
                  onClick={() => setValue(opt, '')}
                >
                  🗑
                </button>
              </div>
            ))}
          </div>

          <div className="solution-section">
            <label className="section-label" htmlFor="explanation">
              Add Solution
            </label>
            <RichTextArea
              id="explanation"
              value={explanationText ?? ''}
              onChange={(v) => setValue('explanation', v)}
              onClear={() => setValue('explanation', '')}
              minRows={4}
            />
            <div className="solution-nav">
              <button
                type="button"
                className="solution-nav-btn"
                aria-label="Previous question"
                disabled={activeQuestionIndex === 0}
                onClick={handlePrevQuestion}
              >
                ‹
              </button>
              <button
                type="button"
                className="solution-nav-btn"
                aria-label="Next question"
                disabled={activeQuestionIndex >= totalTarget - 1}
                onClick={handleNextQuestion}
              >
                ›
              </button>
            </div>
          </div>

          <div className="question-settings">
            <h3 className="question-settings-title">Question settings</h3>

            <div className="form-group">
              <label htmlFor="difficulty">Level of Difficulty</label>
              <FormSelect
                id="difficulty"
                placeholder="Select from Drop-down"
                isPlaceholder={!selectedDifficulty}
                options={[
                  { value: 'easy', label: 'Easy' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'hard', label: 'Difficult' },
                ]}
                {...register('difficulty')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="topic_id">Topic</label>
              <FormSelect
                id="topic_id"
                placeholder="Select from Drop-down"
                isPlaceholder={!selectedTopicId}
                options={topics.map((t) => ({ value: t.id, label: t.name }))}
                {...register('topic_id')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="sub_topic_id">Sub-topic</label>
              <FormSelect
                id="sub_topic_id"
                placeholder="Select from Drop-down"
                isPlaceholder={!selectedSubTopicId}
                options={subTopics
                  .filter((st) => !selectedTopicId || st.topic_id === selectedTopicId)
                  .map((st) => ({ value: st.id, label: st.name }))}
                {...register('sub_topic_id')}
              />
            </div>
          </div>
        </form>

        <div className="questions-page-footer">
          <button type="button" className="btn btn-exit" onClick={() => navigate('/dashboard')}>
            Exit Test Creation
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={saving}
            onClick={() => void handleSaveAndContinue()}
          >
            {saving ? 'Saving...' : 'Next'}
          </button>
        </div>
      </div>
    </Layout>
  );
}
