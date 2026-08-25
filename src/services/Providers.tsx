import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import type { ReactNode } from "react";

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30000, retry: 2, refetchOnWindowFocus: false } } });

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={qc}>
      {children}
      <Toaster position="bottom-right" toastOptions={{ duration: 3000,
        style: { background: "#0d1225", color: "#e2e8f0", border: "1px solid #1e2a45", borderRadius: "0.75rem", fontSize: "0.8rem", fontFamily: "'JetBrains Mono', monospace" },
        success: { iconTheme: { primary: "#2bd47f", secondary: "#0d1225" } },
        error: { iconTheme: { primary: "#fb4b6b", secondary: "#0d1225" } },
      }} />
    </QueryClientProvider>
  );
}
export { qc as queryClient };
