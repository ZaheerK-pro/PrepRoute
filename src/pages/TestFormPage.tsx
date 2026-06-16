import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { getSubTopicsByTopic, getSubjects, getTopicsBySubject } from '../api/subjects';
import { createTest, getTestById, updateTest } from '../api/tests';
import { FormSelect } from '../components/FormSelect';
import { Layout } from '../components/Layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { MarkingStepper } from '../components/MarkingStepper';
import { useTestStore } from '../store/testStore';
import { notifyError } from '../store/notificationStore';
import { getApiErrorMessage } from '../utils/apiErrors';
import { enrichTestWithDisplayNames, enrichTestWithSubjectId, resolveSubjectId, resolveSubTopicId, resolveTopicId } from '../utils/entityResolve';
import { getTestTypeLabel, normalizeTestType, TEST_TYPE_OPTIONS } from '../utils/testDisplay';
import type { Subject, SubTopic, TestFormData, Topic } from '../types';

const testSchema = z.object({
  name: z.string().min(1, 'Test name is required'),
  type: z.string().min(1, 'Test type is required'),
  subject: z.string().min(1, 'Subject is required'),
  topic: z.string().min(1, 'Topic is required'),
  sub_topic: z.string().optional(),
  correct_marks: z.number(),
  wrong_marks: z.number(),
  unattempt_marks: z.number(),
  difficulty: z.string().min(1, 'Difficulty is required'),
  total_time: z
    .string()
    .min(1, 'Enter the time')
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 1, 'Total time must be at least 1 minute'),
  total_marks: z
    .string()
    .min(1, 'Enter total marks')
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 1, 'Total marks must be at least 1'),
  total_questions: z
    .string()
    .min(1, 'Enter number of questions')
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 1, 'Number of questions is required'),
});

type TestFormValues = z.infer<typeof testSchema>;

const TEST_TYPES = TEST_TYPE_OPTIONS;

const DIFFICULTIES = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Difficult' },
];

export function TestFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const setCurrentTest = useTestStore((s) => s.setCurrentTest);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subTopics, setSubTopics] = useState<SubTopic[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingTest, setLoadingTest] = useState(isEdit);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TestFormValues>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      name: '',
      type: 'chapterwise',
      subject: '',
      topic: '',
      sub_topic: '',
      correct_marks: 5,
      wrong_marks: -1,
      unattempt_marks: 0,
      difficulty: 'easy',
      total_time: '',
      total_marks: '',
      total_questions: '',
    },
  });

  const selectedSubject = watch('subject');
  const selectedTopic = watch('topic');
  const selectedType = watch('type');
  const selectedDifficulty = watch('difficulty');
  const wrongMarks = watch('wrong_marks');
  const unattemptMarks = watch('unattempt_marks');
  const correctMarks = watch('correct_marks');

  useEffect(() => {
    void (async () => {
      try {
        setSubjects(await getSubjects());
      } catch {
        notifyError('Failed to load subjects.', 'Could not load form');
      } finally {
        setLoadingMeta(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedSubject) {
      setTopics([]);
      setSubTopics([]);
      setValue('topic', '');
      setValue('sub_topic', '');
      return;
    }

    void getTopicsBySubject(selectedSubject)
      .then(setTopics)
      .catch(() => setTopics([]));
  }, [selectedSubject, setValue]);

  useEffect(() => {
    if (!selectedTopic) {
      setSubTopics([]);
      setValue('sub_topic', '');
      return;
    }

    void getSubTopicsByTopic(selectedTopic)
      .then(setSubTopics)
      .catch(() => setSubTopics([]));
  }, [selectedTopic, setValue]);

  useEffect(() => {
    if (!isEdit || !id || loadingMeta || subjects.length === 0) return;

    void (async () => {
      try {
        const test = await getTestById(id);
        const resolvedSubjectId = resolveSubjectId(test.subject, subjects);
        const topicList = resolvedSubjectId ? await getTopicsBySubject(resolvedSubjectId) : [];
        const resolvedTopicId = resolveTopicId(
          Array.isArray(test.topics) ? test.topics[0] : undefined,
          topicList,
        );
        const subTopicList = resolvedTopicId ? await getSubTopicsByTopic(resolvedTopicId) : [];
        const resolvedSubTopicId = resolveSubTopicId(
          Array.isArray(test.sub_topics) ? test.sub_topics[0] : undefined,
          subTopicList,
        );

        setTopics(topicList);
        setSubTopics(subTopicList);
        setCurrentTest(enrichTestWithSubjectId({ ...test, subject_id: resolvedSubjectId }, subjects));

        reset({
          name: test.name,
          type: normalizeTestType(test.type),
          subject: resolvedSubjectId ?? '',
          topic: resolvedTopicId ?? '',
          sub_topic: resolvedSubTopicId ?? '',
          correct_marks: test.correct_marks ?? 5,
          wrong_marks: test.wrong_marks ?? -1,
          unattempt_marks: test.unattempt_marks ?? 0,
          difficulty: test.difficulty ?? 'easy',
          total_time: test.total_time != null ? String(test.total_time) : '',
          total_marks: test.total_marks != null ? String(test.total_marks) : '',
          total_questions: test.total_questions != null ? String(test.total_questions) : '',
        });
      } catch {
        notifyError('Failed to load test.', 'Could not load test');
      } finally {
        setLoadingTest(false);
      }
    })();
  }, [id, isEdit, loadingMeta, subjects, reset, setCurrentTest]);

  const saveTest = async (values: TestFormValues) => {
    const payload: TestFormData = {
      name: values.name,
      type: normalizeTestType(values.type),
      subject: values.subject,
      topics: values.topic ? [values.topic] : [],
      sub_topics: values.sub_topic ? [values.sub_topic] : [],
      correct_marks: values.correct_marks,
      wrong_marks: values.wrong_marks,
      unattempt_marks: values.unattempt_marks,
      difficulty: values.difficulty as TestFormData['difficulty'],
      total_time: Number(values.total_time),
      total_marks: Number(values.total_marks),
      total_questions: Number(values.total_questions),
      status: 'draft',
    };

    try {
      const saved = isEdit && id ? await updateTest(id, payload) : await createTest(payload);
      const enriched = enrichTestWithDisplayNames(
        enrichTestWithSubjectId({ ...saved, subject_id: values.subject }, subjects),
        subjects,
        topics,
        subTopics,
      );
      setCurrentTest(enriched);
      navigate(`/tests/${saved.id}/questions`);
    } catch (err: unknown) {
      notifyError(getApiErrorMessage(err, 'Failed to save test.'), 'Could not save test');
    }
  };

  const onNext = handleSubmit((values) => saveTest(values));

  const breadcrumbs = [
    'Test Creation',
    isEdit ? 'Edit Test' : 'Create Test',
    getTestTypeLabel(selectedType),
  ];

  if (loadingMeta || loadingTest) {
    return (
      <Layout activeNav="test-creation" breadcrumbs={breadcrumbs}>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout activeNav="test-creation" breadcrumbs={breadcrumbs}>
      <div className="test-creation-page">
        <div className="type-tabs" role="tablist" aria-label="Test type">
          {TEST_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={selectedType === t.value}
              className={`type-tab ${selectedType === t.value ? 'active' : ''}`}
              onClick={() => setValue('type', t.value, { shouldValidate: true })}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form className="test-form" onSubmit={(e) => e.preventDefault()}>
          <div className="form-grid figma-grid">
            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <FormSelect
                id="subject"
                isPlaceholder={!selectedSubject}
                options={subjects.map((s) => ({ value: s.id, label: s.name }))}
                {...register('subject')}
              />
              {errors.subject && <span className="field-error">{errors.subject.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="name">Name of Test</label>
              <input id="name" type="text" placeholder="Enter name of Test" {...register('name')} />
              {errors.name && <span className="field-error">{errors.name.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="topic">Topic</label>
              <FormSelect
                id="topic"
                isPlaceholder={!selectedTopic}
                options={topics.map((t) => ({ value: t.id, label: t.name }))}
                {...register('topic')}
              />
              {errors.topic && <span className="field-error">{errors.topic.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="sub_topic">Sub Topic</label>
              <FormSelect
                id="sub_topic"
                isPlaceholder={!watch('sub_topic')}
                options={subTopics.map((st) => ({ value: st.id, label: st.name }))}
                {...register('sub_topic')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="total_time">Duration (Minutes)</label>
              <input
                id="total_time"
                type="text"
                inputMode="numeric"
                placeholder="Enter the time"
                {...register('total_time')}
              />
              {errors.total_time && <span className="field-error">{errors.total_time.message}</span>}
            </div>

            <div className="form-group">
              <span className="field-label">Test Difficulty Level</span>
              <div className="radio-group">
                {DIFFICULTIES.map((d) => (
                  <label key={d.value} className="radio-option">
                    <input
                      type="radio"
                      value={d.value}
                      checked={selectedDifficulty === d.value}
                      onChange={() => setValue('difficulty', d.value, { shouldValidate: true })}
                    />
                    {d.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="marking-section">
            <h3 className="marking-heading">Marking Scheme:</h3>

            <div className="marking-fields-row">
              <MarkingStepper
                label="Wrong Answer"
                value={wrongMarks}
                step={1}
                onChange={(v) => setValue('wrong_marks', v, { shouldValidate: true })}
              />
              <MarkingStepper
                label="Unattempted"
                value={unattemptMarks}
                step={1}
                onChange={(v) => setValue('unattempt_marks', v, { shouldValidate: true })}
              />
              <MarkingStepper
                label="Correct Answer"
                value={correctMarks}
                step={1}
                onChange={(v) => setValue('correct_marks', v, { shouldValidate: true })}
              />
              <div className="marking-field">
                <label htmlFor="total_questions">No of Questions</label>
                <input
                  id="total_questions"
                  type="text"
                  inputMode="numeric"
                  placeholder="Ex:250 Marks"
                  {...register('total_questions')}
                />
                {errors.total_questions && (
                  <span className="field-error">{errors.total_questions.message}</span>
                )}
              </div>
              <div className="marking-field">
                <label htmlFor="total_marks" className="marking-label-muted">
                  Total Marks
                </label>
                <input
                  id="total_marks"
                  type="text"
                  inputMode="numeric"
                  placeholder="Ex:250 Marks"
                  className="marking-input-muted"
                  {...register('total_marks')}
                />
                {errors.total_marks && (
                  <span className="field-error">{errors.total_marks.message}</span>
                )}
              </div>
            </div>

            <div className="form-actions figma-actions">
              <button
                type="button"
                className="btn btn-cancel"
                disabled={isSubmitting}
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={isSubmitting}
                onClick={() => void onNext()}
              >
                {isSubmitting ? 'Saving...' : 'Next'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
