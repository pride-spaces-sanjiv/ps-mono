import AppRoutes from "./routes/AppRoutes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "react-loading-skeleton/dist/skeleton.css";
import "./assets/styles/react-loading-skeleton.css";
import { GoogleOAuthProvider } from "@react-oauth/google";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retryDelay: 2000,
      retry: 3,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 10,
    },
    mutations: {
      retryDelay: 2000,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {" "}
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <AppRoutes />
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
