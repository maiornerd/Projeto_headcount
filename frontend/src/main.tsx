// Conteúdo para: src/main.tsx (VERSÃO CORRIGIDA)

import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';
import './index.css'

// 1. Importar o nosso "Gerente do Cofre"
import { AuthProvider } from './context/AuthContext.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* 2. Embrulhar o App com o AuthProvider */}
      {/* Agora, o <App /> e todos os seus filhos têm acesso ao "cofre" */}
      <AuthProvider>
        <App />
      </AuthProvider>

    </ThemeProvider>
// 👇 PARÊNTESE ADICIONADO AQUI 👇
)