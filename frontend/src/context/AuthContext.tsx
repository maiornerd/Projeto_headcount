// Valores (código executável)
import { createContext, useState, useContext, useEffect } from 'react';
// Tipos (definições do TypeScript)
import type { ReactNode, FC } from 'react';
import { api } from '../services/api';
import axios from 'axios'; // <-- ADIÇÃO 1 (Importação)

// --- 1. Definindo os Tipos de Dados ---

// O que esperamos que o usuário tenha
interface User {
  nome: string;
  role: string;
}

// O que o nosso "cofre" (Context) vai armazenar
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
// Este componente vai "embrulhar" nosso app e gerenciar o estado

interface AuthProviderProps {
  children: ReactNode;
}

// Usamos 'FC' em vez de 'React.FC', pois importamos o tipo 'FC'
export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [mustChangePass, setMustChangePass] = useState(false);

  // Efeito que roda UMA VEZ quando o app carrega
  useEffect(() => {
    // Tenta carregar dados do localStorage se o usuário recarregar a página
    const storedToken = localStorage.getItem('@HeadcountApp:token');
    const storedUser = localStorage.getItem('@HeadcountApp:user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
  }, []);

  // Função de LOGIN
  const login = async (matricula: string, senha: string) => {
    try {
      // 1. Chama o nosso backend (via "mensageiro" api)
      const response = await api.post('/auth/login', {
        matricula,
        senha,
      });

      // 2. Pega os dados da resposta
      const { token, user, must_change_password } = response.data;

      // 3. Salva no "cofre" (estado do React)
      setToken(token);
      setUser(user);
      setMustChangePass(must_change_password);

      // 4. Salva no "HD" do navegador (localStorage)
      localStorage.setItem('@HeadcountApp:token', token);
      localStorage.setItem('@HeadcountApp:user', JSON.stringify(user));

      // 5. Configura o "mensageiro" para usar esse token em TODAS as futuras requisições
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    } catch (error) {
      // --- ADIÇÃO 2 (Lógica de 'catch' melhorada) ---
      console.error("Erro no login:", error); // Isso vai mostrar o erro 401 real no console

      // Verifica se é um erro do Axios (erro de rede/API)
      if (axios.isAxiosError(error) && error.response) {
        
        // Se for um erro 401 (senha errada)
        if (error.response.status === 401) {
          throw new Error('Matrícula ou senha inválida.');
        }
        
        // Se for outro erro de servidor (ex: 500 que travou o backend)
        throw new Error('Erro inesperado no servidor. Tente novamente.');
      }

      // Se for um erro genérico (ex: rede caiu)
      throw new Error('Erro desconhecido ao tentar logar.');
      // --- FIM DA ADIÇÃO 2 ---
    }
  };

  // Função de LOGOUT
  const logout = () => {
    // 1. Limpa o "cofre" (estado)
    setUser(null);
    setToken(null);
    setMustChangePass(false);

    // 2. Limpa o "HD" (localStorage)
    localStorage.removeItem('@HeadcountApp:token');
    localStorage.removeItem('@HeadcountApp:user');

    // 3. Limpa o "mensageiro"
    api.defaults.headers.common['Authorization'] = undefined;
  };

  return (
    <AuthContext.Provider value={{ 
        isAuthenticated: !!token, // Se tem token, está autenticado
        user, 
        token, 
        mustChangePass, 
        login, 
        logout 
      }}>
      {children}
    </AuthContext.Provider>
  );
}; // <-- ESTA CHAVE '}' ESTAVA FALTANDO

// --- 4. O "Hook" (A Chave para o Cofre) ---
// Componentes usarão isso para acessar o cofre
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};