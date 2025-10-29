import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Container, 
  Box, 
  TextField, 
  Button, 
  Typography, 
  CircularProgress, 
  Alert 
} from '@mui/material';

export function Login() {
  // Pega a função de 'login' do nosso "cofre" (AuthContext)
  const { login } = useAuth();

  // Estados para controlar os campos do formulário
  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função chamada ao clicar no botão "Entrar"
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); // Impede o navegador de recarregar a página

    console.log(`Enviando para o backend: [${matricula}] e [${senha}]`);

    if (!matricula || !senha) {
      setError('Matrícula e senha são obrigatórios.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Chama a função de login do "cofre"
      // O "cofre" vai chamar o "mensageiro" (Axios)
      // O "mensageiro" vai chamar o backend (localhost:3001)
      await login(matricula, senha);
      // Se o login der certo, o AuthContext vai nos redirecionar (veremos isso no App.tsx)

    } catch (err: any) {
      // Se o backend retornar um erro (ex: 401), o "cofre" joga o erro para cá
      setError(err.message || 'Erro desconhecido ao tentar logar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container 
      component="main" 
      maxWidth="xs" // Define um tamanho máximo pequeno (típico de login)
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh' // Centraliza verticalmente na tela
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 4,
          backgroundColor: 'background.paper', // Usa a cor do tema
          borderRadius: 2, // Bordas arredondadas
          boxShadow: 3, // Sombra
        }}
        component="form" // Isso se torna uma tag <form>
        onSubmit={handleSubmit} // Chama nossa função ao enviar
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

        {/* Mostra a mensagem de erro, se houver */}
        {error && (
          <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
            {error}
          </Alert>
        )}

        <Button
          type="submit"
          fullWidth
          variant="contained" // Botão com fundo azul (do tema)
          sx={{ mt: 3, mb: 2, padding: 1.5 }}
          disabled={loading} // Desabilita o botão enquanto carrega
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
        </Button>
      </Box>
    </Container>
  );
}