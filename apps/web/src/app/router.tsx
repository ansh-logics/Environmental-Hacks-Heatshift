import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '../components/layout/app-shell';
import { HomePage } from '../pages/HomePage';
import { WorkerDashboardPage } from '../pages/WorkerDashboardPage';
import { ReliefMapPage } from '../pages/ReliefMapPage';
import { CoordinatorPage } from '../pages/CoordinatorPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'dashboard', element: <WorkerDashboardPage /> },
      { path: 'relief', element: <ReliefMapPage /> },
      { path: 'coordinator', element: <CoordinatorPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
