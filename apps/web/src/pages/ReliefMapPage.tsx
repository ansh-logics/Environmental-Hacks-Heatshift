import { useMemo, useState } from 'react';
import {
  RELIEF_POINT_TYPES,
  RELIEF_POINT_TYPE_LABELS,
  type ReliefPointType,
} from '@heatshift/shared';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { PageHeader } from '../components/layout/page-header';
import { ContentGrid, GridColumn } from '../components/layout/content-grid';
import { DemoNotice } from '../components/shared/demo-notice';
import { ErrorNote } from '../components/shared/error-note';
import { IconPin, RELIEF_ICONS } from '../components/ui/icons';
import { ReliefPointList } from '../features/relief-points/relief-point-list';
import { ReliefContextPanel } from '../features/relief-points/relief-context-panel';
import { ReliefMapSection } from '../features/relief-points/relief-map-section';
import { RELIEF_MARKER_COLOURS } from '../features/relief-points/relief-marker';
import {
  useReliefPoints,
  withDistances,
} from '../features/relief-points/use-relief-points';
import { useLocation } from '../hooks/use-location';
import { cn } from '../lib/utils';

type Filter = ReliefPointType | 'all';

/**
 * List and map, together. The list stays the reliable view - distance, hours and
 * verification status matter more to a rider than a tile layer - and the Mapbox
 * pane mirrors it: same filters, same distances, same selection.
 */
export function ReliefMapPage() {
  const location = useLocation();
  const [filter, setFilter] = useState<Filter>('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const usingDevice = location.source === 'device';
  const { points, loading, error, reload, source } = useReliefPoints({
    type: filter === 'all' ? undefined : filter,
    verifiedOnly: verifiedOnly || undefined,
    limit: 100,
    // Only a position the worker granted is sent to the API. The demo centre is
    // our own stand-in, so ordering by it would imply knowledge we do not have.
    origin: usingDevice ? location.coords : undefined,
  });

  const nearby = useMemo(
    () => withDistances(points, location.coords),
    [points, location.coords],
  );
  const selected = nearby.find((point) => point.id === selectedId) ?? nearby[0] ?? null;
  const filters: Filter[] = ['all', ...RELIEF_POINT_TYPES];

  return (
    <ContentGrid>
      <GridColumn span={12}>
        <PageHeader
          eyebrow="Relief network"
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
              loading={location.status === 'locating'}
            >
              <IconPin size={18} />
              Use my location
            </Button>
          }
        />
        <p className="mt-1 max-w-prose text-xs leading-snug text-ink-500">
          The browser asks for your position only when you press that button. It is used
          to order this page and nothing is stored.
        </p>
      </GridColumn>

      <GridColumn span={7} className="space-y-4">
        {location.error ? <ErrorNote message={location.error} /> : null}

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {filters.map((value) => (
            <button
              key={value}
              type="button"
              className={cn('chip shrink-0', filter === value && 'chip-active')}
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
            >
              {value === 'all' ? 'All' : RELIEF_POINT_TYPE_LABELS[value]}
            </button>
          ))}
          <button
            type="button"
            className={cn('chip shrink-0', verifiedOnly && 'chip-active')}
            onClick={() => setVerifiedOnly((current) => !current)}
            aria-pressed={verifiedOnly}
          >
            Verified only
          </button>
        </div>

        <Card eyebrow="Legend" title="What these markers mean" variant="quiet">
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {RELIEF_POINT_TYPES.map((type) => {
              const Icon = RELIEF_ICONS[type];
              return (
                <li key={type} className="flex items-center gap-2 text-sm text-ink-700">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sand-100"
                    style={{ color: RELIEF_MARKER_COLOURS[type] }}
                  >
                    <Icon size={16} />
                  </span>
                  {RELIEF_POINT_TYPE_LABELS[type]}
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-sand-200 pt-3 text-xs text-ink-500">
            <Badge tone="low">Field verified</Badge>
            <span>checked on the ground by the demo team</span>
            <Badge tone="moderate">Needs verification</Badge>
            <span>seeded from public lists, not yet visited</span>
          </div>
        </Card>

        {error ? <ErrorNote message={error.message} onRetry={reload} /> : null}

        <Card
          title="Points"
          action={
            <span className="text-xs font-semibold text-ink-500">
              {nearby.length} shown
            </span>
          }
        >
          <ReliefPointList
            points={points}
            origin={location.coords}
            loading={loading}
            emptyMessage="Nothing matches this filter. Try 'All'."
            selectedId={selected?.id ?? null}
            onSelect={(point) => setSelectedId(point.id)}
          />
        </Card>
      </GridColumn>

      <GridColumn span={5} className="space-y-4">
        <ReliefMapSection
          points={nearby}
          selectedId={selected?.id ?? null}
          origin={location.coords}
          hasDeviceLocation={usingDevice}
          onSelect={(point) => setSelectedId(point.id)}
        />
        <ReliefContextPanel
          point={selected}
          locationLabel={location.label}
          locationSource={location.source}
        />
        <DemoNotice />
        <p className="px-1 text-xs text-ink-500">Source: {source}</p>
      </GridColumn>
    </ContentGrid>
  );
}
