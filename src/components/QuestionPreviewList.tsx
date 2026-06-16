import type { Question } from '../types';

const OPTION_KEYS = ['option1', 'option2', 'option3', 'option4'] as const;
const OPTION_LABELS = ['A', 'B', 'C', 'D'];

interface QuestionPreviewListProps {
  questions: Question[];
  compact?: boolean;
}

export function QuestionPreviewList({ questions, compact = false }: QuestionPreviewListProps) {
  if (questions.length === 0) {
    return <p className="hint">No questions added yet.</p>;
  }

  return (
    <div className={`preview-questions ${compact ? 'compact' : ''}`}>
      {questions.map((q, index) => (
        <article key={q.id ?? index} className="preview-question">
          <h3>
            Q{index + 1}. {q.question}
          </h3>
          {q.media_url && (
            <img src={q.media_url} alt="" className="question-media-preview" />
          )}
          <ul className="preview-options">
            {OPTION_KEYS.map((key, optIndex) => (
              <li key={key} className={q.correct_option === key ? 'correct' : ''}>
                <span className="option-label">{OPTION_LABELS[optIndex]}.</span>
                {q[key]}
              </li>
            ))}
          </ul>
          {q.explanation && (
            <p className="preview-explanation">
              <strong>Explanation:</strong> {q.explanation}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}
