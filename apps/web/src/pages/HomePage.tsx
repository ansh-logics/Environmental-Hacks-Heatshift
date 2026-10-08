import { Link } from 'react-router-dom';
import { APP_NAME, ROUTES } from '@heatshift/shared';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { DemoNotice } from '../components/shared/demo-notice';
import { IconDrop, IconGauge, IconShade } from '../components/ui/icons';
import { ApiStatusCard } from '../components/shared/api-status-card';

const STEPS = [
  {
    icon: IconGauge,
    title: 'One personal score',
    body: 'Heat plus your work type, sun, water and shade become a 0-100 number you can act on.',
  },
  {
    icon: IconShade,
    title: 'A plan for this shift',
    body: 'Exactly how long to work, when to rest in shade and how much water to carry per hour.',
  },
  {
    icon: IconDrop,
    title: 'Relief nearby',
    body: 'Water points, shade, cooling rooms and clinics on your route, with distance and hours.',
  },
];

export function HomePage() {
  return (
    <>
      <div className="space-y-3 pt-2">
        <Badge tone="high">Built for Indian summer</Badge>
        <h1 className="text-3xl leading-tight">
          City heat alerts do not tell <span className="text-heat-accent-dark">you</span>{' '}
          what to do right now. {APP_NAME} does.
        </h1>
        <p className="text-base text-ink-700">
          Made for delivery riders, guards, construction workers, street vendors and
          sanitation staff who keep working through heatwaves.
        </p>
        <div className="flex gap-3">
          <Link to={ROUTES.dashboard} className="flex-1">
            <Button size="lg" className="w-full">
              Start my shift check
            </Button>
          </Link>
          <Link to={ROUTES.relief}>
            <Button size="lg" variant="secondary">
              Relief points
            </Button>
          </Link>
        </div>
      </div>

      <ul className="space-y-3">
        {STEPS.map((step, index) => (
          <li key={step.title}>
            <Card>
              <div className="flex gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-heat-accent/10 text-heat-accent-dark">
                  <step.icon size={24} />
                </span>
                <div>
                  <h2 className="text-base">
                    {index + 1}. {step.title}
                  </h2>
                  <p className="mt-0.5 text-sm text-ink-500">{step.body}</p>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <ApiStatusCard />
      <DemoNotice />
    </>
  );
}
