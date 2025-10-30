import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Nossas páginas
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { MainLayout } from './components/MainLayout'; // Importa o layout
import { UploadPage } from './pages/UploadPage';
import { AdminPage } from './pages/AdminPage';

/**
 * Rota Protegida (Exatamente como antes)
 * Se não está logado, manda para /login.
 */
function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  
  // Se estiver logado, renderiza o Layout, que por sua vez renderiza a página
  // O <Outlet /> dentro do MainLayout é onde as 'children' (Dashboard) vão entrar
  return isAuthenticated ? <MainLayout /> : <Navigate to="/login" replace />;
}

/**
 * Rota Pública com Redirecionamento (Exatamente como antes)
 */
function RedirectIfAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

/**
 * O "Mapa" principal do site
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* Rota 1: A Página de Login ("/login") */}
        <Route
          path="/login"
          element={
            <RedirectIfAuth>
              <Login />
            </RedirectIfAuth>
          }
        />

        {/* Rota 2: Rotas Protegidas (dentro do Layout) */}
        <Route element={<ProtectedRoute />}>
          {/* Todas as páginas aqui DENTRO usarão o MainLayout */}
          
          <Route path="/" element={<Dashboard />} />

          <Route path="/upload" element={<UploadPage />} />

          <Route path="/admin" element={<AdminPage />} />
          
          {/* (Páginas futuras que vamos criar) */}
          {/* <Route path="/headcount" element={<HeadcountPage />} /> */}
          {/* <Route path="/upload" element={<UploadPage />} /> */}
          {/* <Route path="/admin" element={<AdminPage />} /> */}
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;