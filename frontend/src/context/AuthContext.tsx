// Valores (código executável)
// **** 👇 ADIÇÃO 1: Importar 'useMemo' 👇 ****
import { createContext, useState, useContext, useEffect, useMemo } from 'react';
// Tipos (definições do TypeScript)
import type { ReactNode, FC } from 'react';

import { api } from '../services/api';
import axios from 'axios';

// --- 1. Definindo os Tipos de Dados ---
interface User {
  nome: string;
  role: string;
}

interface AuthContextData {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  mustChangePass: boolean;
  login: (matricula: string, senha: string) => Promise<void>;
  logout: () => void;
}

// --- 2. Criação do Contexto (o "Cofre" em si) ---
const AuthContext = createContext<AuthContextData | undefined>(undefined);

// --- 3. O "Provedor" (O Gerente do Cofre) ---
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [mustChangePass, setMustChangePass] = useState(false);

  // Efeito que roda UMA VEZ quando o app carrega
  useEffect(() => {
    const storedToken = localStorage.getItem('@HeadcountApp:token');
    const storedUser = localStorage.getItem('@HeadcountApp:user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
  }, []);

  // Função de LOGIN (lógica de catch melhorada)
  const login = async (matricula: string, senha: string) => {
    try {
      const response = await api.post('/auth/login', {
        matricula,
        senha,
      });

      const { token, user, must_change_password } = response.data;

      setToken(token);
      setUser(user);
      setMustChangePass(must_change_password);

      localStorage.setItem('@HeadcountApp:token', token);
      localStorage.setItem('@HeadcountApp:user', JSON.stringify(user));

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    } catch (error) {
      console.error("Erro no login:", error); 
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 401) {
          throw new Error('Matrícula ou senha inválida.');
        }
        throw new Error('Erro inesperado no servidor. Tente novamente.');
      }
      throw new Error('Erro desconhecido ao tentar logar.');
    }
  };

  // Função de LOGOUT
  const logout = () => {
    setUser(null);
    setToken(null);
    setMustChangePass(false);
    localStorage.removeItem('@HeadcountApp:token');
    localStorage.removeItem('@HeadcountApp:user');
    api.defaults.headers.common['Authorization'] = undefined;
  };

  // **** 👇 ADIÇÃO 2: A CORREÇÃO CRÍTICA (useMemo) 👇 ****
  //
  // "Memoizamos" o valor do contexto.
  // Isto garante que o React SÓ notifique os componentes "consumidores"
  // (como o App.tsx) quando o 'token', 'user', ou 'mustChangePass'
  // realmente mudarem de valor.
  //
  const contextValue = useMemo(
    () => ({
      isAuthenticated: !!token, // Se tem token, está autenticado
      user,
      token,
      mustChangePass,
      login,
      logout,
    }),
    [token, user, mustChangePass] // Dependências
  );
  // **** 👆 FIM DA ADIÇÃO 2 👆 ****

  return (
    // **** 👇 ADIÇÃO 3: Usar o valor memoizado 👇 ****
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// --- 4. O "Hook" (A Chave para o Cofre) ---
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};