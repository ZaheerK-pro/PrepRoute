export function LoadingSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="loading-spinner" role="status" aria-live="polite">
      <div className="spinner" />
      <span>{label}</span>
    </div>
  );
}
