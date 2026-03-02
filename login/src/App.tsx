import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import RecoverPassword from "./pages/RecoverPassword";
import VerifyCodePage from "./pages/VerifyCode";
import ResetPassword from "./pages/ResetPassword";
import Login from "./pages/Login";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
  {/* Página raíz (temporal) */}
  <Route path="/" element={<NotFound />} />

  {/* Auth */}
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/recover-password" element={<RecoverPassword />} />
  <Route path="/verify-code" element={<VerifyCodePage />} />
  <Route path="/reset-password" element={<ResetPassword />} />

  {/* Catch-all */}
  <Route path="*" element={<NotFound />} />
</Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
