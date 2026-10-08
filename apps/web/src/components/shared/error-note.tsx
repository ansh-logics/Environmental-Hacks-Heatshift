import { Button } from '../ui/button';
import { IconAlert, IconRefresh } from '../ui/icons';

export function ErrorNote({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-xl border-2 border-heat-severe/40 bg-heat-severe/5 p-3"
    >
      <IconAlert className="mt-0.5 shrink-0 text-heat-severe" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink-900">
          Something blocked this request
        </p>
        <p className="mt-0.5 break-words text-sm text-ink-700">{message}</p>
      </div>
      {onRetry ? (
        <Button variant="secondary" size="md" onClick={onRetry} aria-label="Try again">
          <IconRefresh size={16} />
          Retry
        </Button>
      ) : null}
    </div>
  );
}
