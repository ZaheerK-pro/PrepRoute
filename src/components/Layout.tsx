import { NavLink } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';
import { UserMenu } from './UserMenu';

type NavItem = 'dashboard' | 'test-creation' | 'test-tracking';

interface QuestionNavItem {
  index: number;
  label: string;
  completed: boolean;
  active: boolean;
  placeholder?: boolean;
}

interface LayoutProps {
  children: React.ReactNode;
  activeNav?: NavItem;
  breadcrumbs?: string[];
  topBarAction?: React.ReactNode;
  showQuestionPanel?: boolean;
  questionPanel?: {
    totalQuestions: number;
    items: QuestionNavItem[];
    onSelect: (index: number) => void;
    variant?: 'default' | 'confirmation';
  };
}

const NAV_ITEMS: { key: NavItem; label: string; to: string }[] = [
  { key: 'dashboard', label: 'Dashboard', to: '/dashboard' },
  { key: 'test-creation', label: 'Test Creation', to: '/tests/new' },
  { key: 'test-tracking', label: 'Test Tracking', to: '/dashboard' },
];

function SidebarIcon({ name }: { name: NavItem }) {
  if (name === 'dashboard') {
    return (
      <svg className="sidebar-svg-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M3 14l4-4 3 3 7-7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13 6h4v4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === 'test-creation') {
    return (
      <svg className="sidebar-svg-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M4 16h12M7 4h6l1 12H6L7 4z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M8 8h4M8 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg className="sidebar-svg-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="4" y="3" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function Layout({
  children,
  activeNav = 'dashboard',
  breadcrumbs,
  topBarAction,
  showQuestionPanel,
  questionPanel,
}: LayoutProps) {
  return (
    <div className={`app-layout ${showQuestionPanel ? 'app-layout--with-questions' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-logo">
          <BrandLogo />
        </div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.key}
              to={item.to}
              className={`sidebar-link ${activeNav === item.key ? 'active' : ''}`}
            >
              <SidebarIcon name={item.key} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {showQuestionPanel && questionPanel && (
        <aside
          className={`question-panel ${questionPanel.variant === 'confirmation' ? 'question-panel--confirm' : ''}`}
        >
          <div className="question-panel-header">
            <div className="question-panel-title-row">
              <h3>Question creation</h3>
              <button type="button" className="question-panel-collapse" aria-label="Collapse panel">
                ‹
              </button>
            </div>
            <p>
              {questionPanel.variant === 'confirmation'
                ? `Total Questions . ${questionPanel.totalQuestions}`
                : `Total Questions - ${String(questionPanel.totalQuestions).padStart(2, '0')}`}
            </p>
          </div>
          <div className="question-panel-list">
            {questionPanel.items.map((item) => (
              <button
                key={item.index}
                type="button"
                className={`question-nav-item ${item.completed ? 'completed' : ''} ${item.active ? 'active' : ''} ${item.placeholder ? 'placeholder' : ''}`}
                onClick={() => questionPanel.onSelect(item.index)}
                disabled={item.placeholder}
              >
                <span className={`q-check ${item.completed ? 'q-check--done' : ''}`}>
                  {item.completed ? '✓' : ''}
                </span>
                <span className="q-label">{item.label}</span>
                <span className="q-arrow">›</span>
              </button>
            ))}
          </div>
        </aside>
      )}

      <div className="main-area">
        <header className="top-header">
          <div className="mobile-header-brand">
            <BrandLogo />
          </div>
          <div className="header-right">
            <button type="button" className="notification-btn" aria-label="Notifications">
              <img src="/notification_icon.png" alt="" className="notification-icon" />
            </button>
            <UserMenu />
          </div>
        </header>

        <main className="page-content">
          {(breadcrumbs?.length || topBarAction) && (
            <div className="content-top-bar">
              {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="breadcrumbs content-breadcrumbs" aria-label="Breadcrumb">
                  {breadcrumbs.map((crumb, i) => (
                    <span key={crumb}>
                      {i > 0 && <span className="breadcrumb-sep"> / </span>}
                      <span>{crumb}</span>
                    </span>
                  ))}
                </nav>
              )}
              {topBarAction && <div className="content-top-action">{topBarAction}</div>}
            </div>
          )}
          {children}
        </main>
      </div>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.key}
            to={item.to}
            className={`mobile-nav-link ${activeNav === item.key ? 'active' : ''}`}
          >
            <SidebarIcon name={item.key} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
