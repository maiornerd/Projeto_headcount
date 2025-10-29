import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Box, Typography, Button } from '@mui/material';

/**
 * Um componente "Rota Protegida"
 * Verifica se o usuário está logado antes de deixar ele ver a página.
 * Se não estiver, redireciona para /login.
 */
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // Redireciona para o login
    return <Navigate to="/login" replace />;
  }

  return children; // Mostra a página protegida
}

/**
 * A página principal (Dashboard/Headcount) - Por enquanto, só um placeholder.
 */
function Dashboard() {
  const { user, logout } = useAuth();
  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4">Página Principal (Headcount)</Typography>
      <Typography>Olá, {user?.nome}!</Typography>
      <Button variant="contained" onClick={logout} sx={{ mt: 2 }}>
        Sair
      </Button>
    </Box>
  );
}

/**
 * O "Mapa" principal do site
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota 1: A Página Principal ("/") */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Rota 2: A Página de Login ("/login") */}
        <Route path="/login" element={<Login />} />

        {/* (Adicionaremos mais rotas aqui depois) */}

      </Routes>
    </BrowserRouter>
  );
}

export default App;