import { Link } from 'react-router-dom';
import { ROUTES } from '@heatshift/shared';
import { Button } from '../components/ui/button';
import { EmptyState } from '../components/shared/empty-state';

export function NotFoundPage() {
  return (
    <div className="space-y-4 pt-6">
      <h1 className="text-2xl">Page not found</h1>
      <EmptyState
        title="That screen does not exist in this build."
        body="HeatShift has four routes: home, my shift, relief and team."
      />
      <Link to={ROUTES.home}>
        <Button size="lg" className="w-full">
          Back to start
        </Button>
      </Link>
    </div>
  );
}
