import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const NavigateWithParams = ({ to }: { to: string }) => {
  const location = useLocation();
  return <Navigate to={to + location.search} replace />;
};

const AppRoutes = () => {
  const { user, login, register, logout, isLoading, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !user && location.pathname !== "/login" && location.pathname !== "/register") {
      navigate("/login", { replace: true });
    }
  }, [isLoading, user, location.pathname, navigate]);

  const handleLogout = (reason?: "expired") => {
    logout();
    if (reason) {
      sessionStorage.setItem("auth_reason", reason);
    } else {
      sessionStorage.removeItem("auth_reason");
    }
    navigate("/login", { replace: true, state: reason ? { reason } : undefined });
  };

  useEffect(() => {
    if (!token) return;

    const decodeJwtPayload = (jwt: string) => {
      const parts = jwt.split(".");
      if (parts.length !== 3) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
      try {
        const json = atob(padded);
        return JSON.parse(json) as { exp?: number };
      } catch {
        return null;
      }
    };

    const payload = decodeJwtPayload(token);
    const expSeconds = payload?.exp;
    if (!expSeconds) return;

    const msUntilExpiry = expSeconds * 1000 - Date.now();
    if (msUntilExpiry <= 0) {
      handleLogout("expired");
      return;
    }

    const timeoutId = window.setTimeout(() => {
      handleLogout("expired");
    }, msUntilExpiry);

    return () => window.clearTimeout(timeoutId);
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <NavigateWithParams to="/" /> : <Login onLogin={login} />}
      />
      <Route
        path="/register"
        element={user ? <NavigateWithParams to="/" /> : <Register onRegister={register} />}
      />
      <Route
        path="/"
        element={user ? <Index user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
