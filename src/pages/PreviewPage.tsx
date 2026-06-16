import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchQuestionsBulk } from '../api/questions';
import { getTestById, publishTest } from '../api/tests';
import { Layout } from '../components/Layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { TestSummaryCard } from '../components/TestSummaryCard';
import { useTestStore } from '../store/testStore';
import { notifyError, notifySuccess } from '../store/notificationStore';
import { getApiErrorMessage } from '../utils/apiErrors';
import type { Test } from '../types';

type PublishMode = 'now' | 'schedule';
type LiveUntil = 'always' | '1week' | '2weeks' | '3weeks' | '1month' | 'custom';

const LIVE_UNTIL_OPTIONS: { value: LiveUntil; label: string }[] = [
  { value: 'always', label: 'Always Available' },
  { value: '3weeks', label: '3 Weeks' },
  { value: '1week', label: '1 Week' },
  { value: '1month', label: '1 Month' },
  { value: '2weeks', label: '2 Weeks' },
  { value: 'custom', label: 'Custom Duration' },
];

function combineDateAndTime(date: string, time: string): string | null {
  if (!date) return null;
  const parsed = new Date(`${date}T${time || '00:00'}`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function addWeeks(from: Date, weeks: number): string {
  const next = new Date(from);
  next.setDate(next.getDate() + weeks * 7);
  return next.toISOString();
}

function addMonths(from: Date, months: number): string {
  const next = new Date(from);
  next.setMonth(next.getMonth() + months);
  return next.toISOString();
}

function getExpiryDate(liveUntil: LiveUntil, from: Date): string | null {
  switch (liveUntil) {
    case '1week':
      return addWeeks(from, 1);
    case '2weeks':
      return addWeeks(from, 2);
    case '3weeks':
      return addWeeks(from, 3);
    case '1month':
      return addMonths(from, 1);
    default:
      return null;
  }
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="2.5" y="4" width="13" height="11.5" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
      <path d="M2.5 7h13M6 2.5v3M12 2.5v3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M3.5 5.25 7 8.75l3.5-3.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

export function PreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const clearDraft = useTestStore((s) => s.clearDraft);

  const [test, setTest] = useState<Test | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  const [publishMode, setPublishMode] = useState<PublishMode>('now');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [liveUntil, setLiveUntil] = useState<LiveUntil>('custom');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    if (!id) return;

    void (async () => {
      try {
        const testData = await getTestById(id);
        setTest(testData);

        const questionIds = Array.isArray(testData.questions)
          ? testData.questions
              .map((q) => (typeof q === 'string' ? q : q.id ?? ''))
              .filter(Boolean)
          : [];

        if (questionIds.length > 0) {
          const loaded = await fetchQuestionsBulk(questionIds);
          setQuestionCount(loaded.length);
        } else {
          setQuestionCount(testData.total_questions ?? 0);
        }
      } catch {
        notifyError('Failed to load test preview.', 'Could not load test');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const totalTarget = test?.total_questions ?? questionCount;

  const questionNavItems = useMemo(
    () =>
      Array.from({ length: totalTarget }, (_, index) => ({
        index,
        label: `Question ${index + 1}`,
        completed: true,
        active: false,
      })),
    [totalTarget],
  );

  const handleConfirm = async () => {
    if (!id || !test) return;

    if (publishMode === 'schedule' && (!scheduleDate || !scheduleTime)) {
      notifyError('Select a date and time to schedule publishing.', 'Schedule required');
      return;
    }

    if (liveUntil === 'custom') {
      if (!endDate || !endTime) {
        notifyError('Select an end date and time for custom duration.', 'End date required');
        return;
      }
      const customExpiry = combineDateAndTime(endDate, endTime);
      if (!customExpiry) {
        notifyError('Select a valid end date and time.', 'Invalid end date');
        return;
      }
    }

    setConfirming(true);

    try {
      const scheduledIso =
        publishMode === 'schedule' ? combineDateAndTime(scheduleDate, scheduleTime) : null;

      if (publishMode === 'schedule' && !scheduledIso) {
        notifyError('Select a valid date and time to schedule publishing.', 'Invalid schedule date');
        setConfirming(false);
        return;
      }

      const publishFrom = scheduledIso ? new Date(scheduledIso) : new Date();

      let expiryDate: string | undefined;
      if (liveUntil === 'custom') {
        expiryDate = combineDateAndTime(endDate, endTime) ?? undefined;
      } else if (liveUntil !== 'always') {
        expiryDate = getExpiryDate(liveUntil, publishFrom) ?? undefined;
      }

      await publishTest(id, {
        ...(scheduledIso ? { scheduled_date: scheduledIso } : {}),
        ...(expiryDate ? { expiry_date: expiryDate } : {}),
      });

      notifySuccess('Test confirmed successfully!', 'Test published');
      clearDraft();
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err: unknown) {
      notifyError(getApiErrorMessage(err, 'Failed to confirm test.'), 'Could not confirm');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <Layout
        activeNav="test-creation"
        breadcrumbs={['Test creation']}
        showQuestionPanel
        questionPanel={{
          totalQuestions: 0,
          items: [],
          onSelect: () => undefined,
          variant: 'confirmation',
        }}
      >
        <LoadingSpinner />
      </Layout>
    );
  }

  if (!test) {
    return (
      <Layout activeNav="test-creation" breadcrumbs={['Test creation']}>
        <LoadingSpinner label="Test not found." />
      </Layout>
    );
  }

  return (
    <Layout
      activeNav="test-creation"
      breadcrumbs={['Test creation']}
      showQuestionPanel
      questionPanel={{
        totalQuestions: totalTarget,
        items: questionNavItems,
        onSelect: () => undefined,
        variant: 'confirmation',
      }}
    >
      <div className="confirm-page">
        <div className="confirm-status-row">
          <h1 className="confirm-title">Test created</h1>
          <span className="success-pill">
            <span className="success-pill-check" aria-hidden="true">
              ✓
            </span>
            All {totalTarget} Questions done
          </span>
        </div>

        <TestSummaryCard
          test={{ ...test, total_questions: totalTarget }}
          variant="confirmation"
        />

        <div className="confirm-publish-section">
          <div className="publish-mode-toggle" role="tablist" aria-label="Publish mode">
            <button
              type="button"
              role="tab"
              aria-selected={publishMode === 'now'}
              className={`publish-mode-btn ${publishMode === 'now' ? 'active' : ''}`}
              onClick={() => setPublishMode('now')}
            >
              Publish Now
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={publishMode === 'schedule'}
              className={`publish-mode-btn ${publishMode === 'schedule' ? 'active' : ''}`}
              onClick={() => setPublishMode('schedule')}
            >
              Schedule Publish
            </button>
          </div>

          {publishMode === 'schedule' && (
            <div className="schedule-section">
              <h3 className="confirm-section-title">Select Date and Time</h3>
              <div className="schedule-datetime-fields">
                <div className="confirm-field">
                  <div className="input-with-icon">
                    <input
                      id="schedule-date"
                      type="date"
                      value={scheduleDate}
                      placeholder="Select Date"
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className={!scheduleDate ? 'is-empty' : ''}
                    />
                    <span className="input-icon" aria-hidden="true">
                      <CalendarIcon />
                    </span>
                  </div>
                  {!scheduleDate && <span className="field-placeholder">Select Date</span>}
                </div>
                <div className="confirm-field">
                  <div className="input-with-icon">
                    <input
                      id="schedule-time"
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className={!scheduleTime ? 'is-empty' : ''}
                    />
                    <span className="input-icon" aria-hidden="true">
                      <ChevronDownIcon />
                    </span>
                  </div>
                  {!scheduleTime && <span className="field-placeholder">Select Time</span>}
                </div>
              </div>
            </div>
          )}

          <div className="live-until-section">
            <h3 className="confirm-section-title">Live Until</h3>
            <p className="confirm-section-desc">
              Choose how long this test should remain available on the platform.
            </p>

            <div className="duration-grid">
              {LIVE_UNTIL_OPTIONS.map((option) => (
                <label key={option.value} className="duration-option">
                  <input
                    type="radio"
                    name="live-until"
                    value={option.value}
                    checked={liveUntil === option.value}
                    onChange={() => setLiveUntil(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>

            {liveUntil === 'custom' && (
              <div className="custom-duration-fields">
                <div className="confirm-field">
                  <div className="input-with-icon">
                    <input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={!endDate ? 'is-empty' : ''}
                    />
                    <span className="input-icon" aria-hidden="true">
                      <CalendarIcon />
                    </span>
                  </div>
                  {!endDate && <span className="field-placeholder">Select End Date</span>}
                </div>
                <div className="confirm-field">
                  <div className="input-with-icon">
                    <input
                      id="end-time"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className={!endTime ? 'is-empty' : ''}
                    />
                    <span className="input-icon" aria-hidden="true">
                      <ChevronDownIcon />
                    </span>
                  </div>
                  {!endTime && <span className="field-placeholder">Select End Time</span>}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="confirm-footer">
          <button type="button" className="btn btn-cancel" onClick={() => navigate('/dashboard')}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary btn-confirm"
            disabled={confirming || test.status === 'live'}
            onClick={() => void handleConfirm()}
          >
            {test.status === 'live'
              ? 'Already Published'
              : confirming
                ? 'Confirming...'
                : 'Confirm'}
          </button>
        </div>
      </div>
    </Layout>
  );
}
