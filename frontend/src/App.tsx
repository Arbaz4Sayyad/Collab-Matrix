import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppRoutes from './routes/app-routes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  console.log('[App] Rendering root App component...');
  return (
    <QueryClientProvider client={queryClient}>
      <AppRoutes />
    </QueryClientProvider>
  );
}
