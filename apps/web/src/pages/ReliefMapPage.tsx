import { useState } from 'react';
import {
  RELIEF_POINT_TYPES,
  RELIEF_POINT_TYPE_LABELS,
  type ReliefPointType,
} from '@heatshift/shared';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { PageHeader } from '../components/layout/page-header';
import { DemoNotice } from '../components/shared/demo-notice';
import { ErrorNote } from '../components/shared/error-note';
import { IconPin } from '../components/ui/icons';
import { ReliefPointList } from '../features/relief-points/relief-point-list';
import { useReliefPoints } from '../features/relief-points/use-relief-points';
import { useLocation } from '../hooks/use-location';
import { cn } from '../lib/utils';

type Filter = ReliefPointType | 'all';

/**
 * List-first relief view. A real map is deliberately out of scope for this phase:
 * distance and walking time matter more to a rider than a rendered tile layer.
 */
export function ReliefMapPage() {
  const location = useLocation();
  const [filter, setFilter] = useState<Filter>('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const { points, loading, error, reload, source } = useReliefPoints({
    type: filter === 'all' ? undefined : filter,
    verifiedOnly: verifiedOnly || undefined,
    limit: 100,
  });

  const filters: Filter[] = ['all', ...RELIEF_POINT_TYPES];

  return (
    <>
      <PageHeader
        title="Relief points"
        subtitle={
          <>
            Distances from{' '}
            <span className="font-semibold text-ink-700">{location.label}</span>
          </>
        }
        action={
          <Button
            variant="secondary"
            onClick={location.useDeviceLocation}
            loading={location.requesting}
          >
            <IconPin size={18} />
            My location
          </Button>
        }
      />

      {location.error ? <ErrorNote message={location.error} /> : null}

      <div className="-mx-4 overflow-x-auto px-4">
        <div className="flex w-max gap-2 pb-1">
          {filters.map((value) => (
            <button
              key={value}
              type="button"
              className={cn('chip', filter === value && 'chip-active')}
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
            >
              {value === 'all' ? 'All' : RELIEF_POINT_TYPE_LABELS[value]}
            </button>
          ))}
          <button
            type="button"
            className={cn('chip', verifiedOnly && 'chip-active')}
            onClick={() => setVerifiedOnly((current) => !current)}
            aria-pressed={verifiedOnly}
          >
            Verified only
          </button>
        </div>
      </div>

      {error ? <ErrorNote message={error.message} onRetry={reload} /> : null}

      <Card>
        <ReliefPointList
          points={points}
          origin={location.coords}
          loading={loading}
          emptyMessage="Nothing matches this filter. Try 'All'."
        />
      </Card>

      <DemoNotice />
      <p className="px-1 text-xs text-ink-500">Source: {source}</p>
    </>
  );
}
