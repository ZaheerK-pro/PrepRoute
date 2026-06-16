import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Test } from '../types';
import { resolveTestDisplayLabels } from '../utils/enrichTestDisplay';
import {
  getDifficultyLabel,
  getSubjectLabel,
  getSubTopicNames,
  getTestTypeLabel,
  getTopicNames,
} from '../utils/testDisplay';
interface TestSummaryCardProps {
  test: Test;
  showEdit?: boolean;
  variant?: 'default' | 'confirmation';
}

function EditIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M12.75 2.25L15.75 5.25M2.25 15.75H5.25L13.5 7.5L10.5 4.5L2.25 12.75V15.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.25" />
      <path d="M8 5v3.5l2 1.25" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M5 2h4.5L12 4.5V13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path d="M9 2v3h3M6 8h4M6 10.5h4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 13V9M7 13V5M11 13V7M15 13V3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

export function TestSummaryCard({
  test,
  showEdit = true,
  variant = 'default',
}: TestSummaryCardProps) {
  const navigate = useNavigate();
  const isConfirmation = variant === 'confirmation';

  const [display, setDisplay] = useState(() => ({
    subject: getSubjectLabel(test.subject),
    topics: getTopicNames(test.topics),
    subTopics: getSubTopicNames(test.sub_topics),
  }));

  useEffect(() => {
    let cancelled = false;

    void resolveTestDisplayLabels(test).then((labels) => {
      if (!cancelled) {
        setDisplay({
          subject: labels.subject,
          topics: labels.topics,
          subTopics: labels.subTopics,
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [test.id, test.subject, test.topics, test.sub_topics]);

  return (
    <div className={`test-summary-card ${isConfirmation ? 'test-summary-card--confirm' : ''}`}>
      <div className="test-summary-top">
        <div className="test-summary-tags">
          <span className="type-badge">{getTestTypeLabel(test.type)}</span>
          <div className="test-title-row">
            {isConfirmation ? (
              <img src="/mark.png" alt="" className="chapter-icon-img" aria-hidden="true" />
            ) : (
              <span className="chapter-icon" aria-hidden="true">
                📦
              </span>
            )}
            <span className="test-chapter-name">{test.name}</span>
            <span className={`difficulty-badge difficulty-${test.difficulty ?? 'easy'}`}>
              {getDifficultyLabel(test.difficulty)}
            </span>
          </div>
        </div>
        {showEdit && (
          <button
            type="button"
            className="icon-btn edit-btn"
            aria-label="Edit test"
            onClick={() => navigate(`/tests/${test.id}/edit`)}
          >
            <EditIcon />
          </button>
        )}
      </div>

      <div className="test-summary-body">
        <div className="test-summary-meta">
          <div className="meta-row">
            <span className="meta-label">Subject</span>
            <span className="meta-value">{display.subject}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Topic</span>
            <div className="tag-list">
              {display.topics.length > 0 ? (
                display.topics.map((t) => (
                  <span key={t} className="topic-tag">
                    {t}
                  </span>
                ))
              ) : (
                <span className="meta-value">—</span>
              )}
            </div>
          </div>
          <div className="meta-row">
            <span className="meta-label">Sub Topic</span>
            <div className="tag-list">
              {display.subTopics.length > 0 ? (
                display.subTopics.map((st) => (
                  <span key={st} className="topic-tag">
                    {st}
                  </span>
                ))
              ) : (
                <span className="meta-value">—</span>
              )}
            </div>
          </div>
        </div>

        <div className={`test-summary-stats ${isConfirmation ? 'test-summary-stats--boxed' : ''}`}>
          <div className="stat-box">
            <span className="stat-icon">
              {isConfirmation ? <ClockIcon /> : '⏱'}
            </span>
            <span>{test.total_time ?? 0} Min</span>
          </div>
          <div className="stat-box">
            <span className="stat-icon">
              {isConfirmation ? <DocIcon /> : '📄'}
            </span>
            <span>{test.total_questions ?? 0} Q&apos;s</span>
          </div>
          <div className="stat-box">
            <span className="stat-icon">
              {isConfirmation ? <ChartIcon /> : '📊'}
            </span>
            <span>{test.total_marks ?? 0} Marks</span>
          </div>
        </div>
      </div>
    </div>
  );
}
