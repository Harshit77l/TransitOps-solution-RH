"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthProvider } from "@/lib/auth";

export default function Providers({ children }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  }));
  return (
    <QueryClientProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
