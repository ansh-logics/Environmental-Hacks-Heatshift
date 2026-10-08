import { Link } from 'react-router-dom';
import { APP_NAME, ROUTES } from '@heatshift/shared';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { DemoNotice } from '../components/shared/demo-notice';
import { ContentGrid, GridColumn } from '../components/layout/content-grid';
import { IconDrop, IconGauge, IconShade } from '../components/ui/icons';

const FEATURES = [
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

const JOURNEY = [
  'Set your shift - work type, hours, sun, water and shade.',
  'Check the heat - enter conditions and run the calculation.',
  'Follow the plan - work/rest cycles and a water target.',
  'Check in - one tap tells your team you need help.',
];

export function HomePage() {
  return (
    <ContentGrid>
      <GridColumn span={7}>
        <div className="max-w-prose">
          <Badge tone="high">Built for Indian summer</Badge>
          <h1 className="mt-3 text-3xl leading-tight lg:text-[2.75rem] lg:leading-[1.15]">
            City heat alerts do not tell{' '}
            <span className="text-heat-accent-dark">you</span> what to do right now.{' '}
            {APP_NAME} does.
          </h1>
          <p className="mt-4 text-base text-ink-700">
            Made for delivery riders, guards, construction workers, street vendors and
            sanitation staff who keep working through heatwaves.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to={ROUTES.dashboard}>
              <Button size="lg" className="w-full sm:w-auto">
                Start my shift check
              </Button>
            </Link>
            <Link to={ROUTES.relief}>
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Explore relief points
              </Button>
            </Link>
          </div>
        </div>
      </GridColumn>

      <GridColumn span={5}>
        <Card eyebrow="How it works" title="Four steps on any phone" variant="quiet">
          <ol className="space-y-3">
            {JOURNEY.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-bold tabular text-heat-accent-dark shadow-card">
                  {index + 1}
                </span>
                <span className="pt-0.5 text-sm text-ink-700">{step}</span>
              </li>
            ))}
          </ol>
        </Card>
      </GridColumn>

      <GridColumn span={12}>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {FEATURES.map((feature, index) => (
            <li key={feature.title}>
              <Card className="h-full">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-heat-accent/10 text-heat-accent-dark">
                  <feature.icon size={24} />
                </span>
                <h2 className="mt-3 text-base">
                  {index + 1}. {feature.title}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-ink-500">
                  {feature.body}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      </GridColumn>

      <GridColumn span={12}>
        <DemoNotice />
      </GridColumn>
    </ContentGrid>
  );
}
