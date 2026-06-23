import { Router } from './app/router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { useEffect } from 'react';
import { usePrefsStore } from './stores/usePrefsStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
});

function App() {
  const reducedMotion = usePrefsStore((state) => state.reducedMotion);

  useEffect(() => {
    document.documentElement.classList.toggle('reduced-motion', reducedMotion);
  }, [reducedMotion]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <Router />
        <Toaster theme="dark" position="bottom-right" className="!font-sans" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
