import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteTest, getTests } from '../api/tests';
import { getSubjects } from '../api/subjects';
import { Layout } from '../components/Layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { formatDate, getTestTypeLabel } from '../utils/testDisplay';
import { resolveSubjectName } from '../utils/entityResolve';
import { notifyError } from '../store/notificationStore';
import type { Subject, Test } from '../types';

function StatusBadge({ status }: { status?: string }) {
  const normalized = (status ?? 'draft').toLowerCase();
  return <span className={`status-pill status-${normalized}`}>{normalized}</span>;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [tests, setTests] = useState<Test[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadTests = async () => {
    setLoading(true);
    try {
      const [data, subjectList] = await Promise.all([getTests(), getSubjects()]);
      setTests(data);
      setSubjects(subjectList);
    } catch {
      notifyError('Failed to load tests. Please try again.', 'Could not load tests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTests();
  }, []);

  const filteredTests = useMemo(() => {
    return tests.filter((test) => {
      const subject = resolveSubjectName(test.subject, subjects);
      const matchesSearch =
        !search ||
        test.name.toLowerCase().includes(search.toLowerCase()) ||
        subject.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' ||
        (test.status ?? 'draft').toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tests, search, statusFilter, subjects]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This action cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await deleteTest(id);
      setTests((prev) => prev.filter((t) => t.id !== id));
    } catch {
      notifyError('Failed to delete test.', 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Layout activeNav="dashboard" breadcrumbs={['Dashboard']}>
      <div className="page-heading-row">
        <div>
          <p className="page-eyebrow">Overview</p>
          <h1 className="page-heading">Test Dashboard</h1>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/tests/new')}>
          + Create New Test
        </button>
      </div>

      <div className="dashboard-toolbar card-flat">
        <input
          type="search"
          placeholder="Search by name or subject..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className="filter-select"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="live">Live</option>
        </select>
      </div>

      {loading && <LoadingSpinner label="Loading tests..." />}

      {!loading && filteredTests.length === 0 && (
        <div className="empty-state card">
          <p>No tests found.</p>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/tests/new')}>
            Create your first test
          </button>
        </div>
      )}

      {!loading && filteredTests.length > 0 && (
        <div className="test-table-wrap">
          <table className="test-table">
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Type</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTests.map((test) => (
                <tr key={test.id}>
                  <td className="test-name" data-label="Test Name">
                    {test.name}
                  </td>
                  <td data-label="Type">{getTestTypeLabel(test.type)}</td>
                  <td data-label="Subject">{resolveSubjectName(test.subject, subjects)}</td>
                  <td data-label="Status">
                    <StatusBadge status={test.status} />
                  </td>
                  <td data-label="Created">{formatDate(test.created_at)}</td>
                  <td data-label="Actions">
                    <div className="action-buttons">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => navigate(`/tests/${test.id}/edit`)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => navigate(`/tests/${test.id}/preview`)}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger-outline btn-sm"
                        disabled={deletingId === test.id}
                        onClick={() => void handleDelete(test.id, test.name)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
