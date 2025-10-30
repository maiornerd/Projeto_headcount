// Em: frontend/src/pages/Login/index.tsx

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext'; // Apenas useAuth
import { 
  Container, 
  Box, 
  TextField, 
  Button, 
  Typography, 
  CircularProgress, 
  Alert 
} from '@mui/material';
// NENHUMA importação de 'react-router-dom' aqui

export function Login() {
  const { login } = useAuth(); // Apenas 'login' é necessário

  // Estados (tudo igual)
  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // NENHUM 'if (isAuthenticated)' aqui

  // Função chamada ao clicar no botão "Entrar"
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); 

    if (!matricula || !senha) {
      setError('Matrícula e senha são obrigatórios.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Chama a função de login
      await login(matricula.trim(), senha.trim());
      
      // SUCESSO!
      // NÃO FAZEMOS NADA AQUI. App.tsx vai cuidar de tudo.

    } catch (err: any) {
      // FALHA!
      // Nós SÓ paramos o loading se o login FALHAR.
      setLoading(false);
      setError((err as Error).message || 'Erro desconhecido ao tentar logar.');
    }
  };

  // O JSX do 'return (...)' permanece exatamente o mesmo
  return (
    <Container 
      component="main" 
      maxWidth="xs"
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh' 
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 4,
          backgroundColor: 'background.paper',
          borderRadius: 2,
          boxShadow: 3,
        }}
        component="form"
        onSubmit={handleSubmit}
      >
        <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold' }}>
          Controle de Headcount
        </Typography>

        <TextField
          margin="normal"
          required
          fullWidth
          id="matricula"
          label="Matrícula"
          name="matricula"
          autoFocus
          value={matricula}
          onChange={(e) => setMatricula(e.target.value)}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="senha"
          label="Senha"
          type="password"
          id="senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />

        {error && (
          <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
            {error}
          </Alert>
        )}

        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2, padding: 1.5 }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
        </Button>
      </Box>
    </Container>
  );
}