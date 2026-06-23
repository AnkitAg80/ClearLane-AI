import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import React, { Suspense, lazy } from 'react';
import { AppErrorBoundary } from '../components/foundation/AppErrorBoundary';

const OverviewPage = lazy(() => import('../features/overview/OverviewPage').then((module) => ({ default: module.OverviewPage })));
const CanvasPage = lazy(() => import('../features/canvas/CanvasPage').then((module) => ({ default: module.CanvasPage })));
const HotspotsPage = lazy(() => import('../features/hotspots/HotspotsPage').then((module) => ({ default: module.HotspotsPage })));
const TimelinePage = lazy(() => import('../features/timeline/TimelinePage').then((module) => ({ default: module.TimelinePage })));
const IntelligencePage = lazy(() => import('../features/intelligence/IntelligencePage').then((module) => ({ default: module.IntelligencePage })));
const DeploymentPage = lazy(() => import('../features/deployment/DeploymentPage').then((module) => ({ default: module.DeploymentPage })));
const MissionsPage = lazy(() => import('../features/missions/MissionsPage').then((module) => ({ default: module.MissionsPage })));
const EvidencePage = lazy(() => import('../features/evidence/EvidencePage').then((module) => ({ default: module.EvidencePage })));
const ArtifactsPage = lazy(() => import('../features/artifacts/ArtifactsPage').then((module) => ({ default: module.ArtifactsPage })));

// Simple fallback
const Fallback = () => <div className="p-8 text-fg-secondary text-sm">Loading workspace...</div>;

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    errorElement: <AppErrorBoundary />,
    children: [
      { index: true, element: <Suspense fallback={<Fallback />}><OverviewPage /></Suspense> },
      { path: 'canvas', element: <Suspense fallback={<Fallback />}><CanvasPage /></Suspense> },
      { path: 'hotspots', element: <Suspense fallback={<Fallback />}><HotspotsPage /></Suspense> },
      { path: 'timeline', element: <Suspense fallback={<Fallback />}><TimelinePage /></Suspense> },
      { path: 'intelligence', element: <Suspense fallback={<Fallback />}><IntelligencePage /></Suspense> },
      { path: 'deployment', element: <Suspense fallback={<Fallback />}><DeploymentPage /></Suspense> },
      { path: 'missions', element: <Suspense fallback={<Fallback />}><MissionsPage /></Suspense> },
      { path: 'evidence', element: <Suspense fallback={<Fallback />}><EvidencePage /></Suspense> },
      { path: 'artifacts', element: <Suspense fallback={<Fallback />}><ArtifactsPage /></Suspense> },
    ],
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
