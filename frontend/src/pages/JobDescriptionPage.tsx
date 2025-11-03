// Em: frontend/src/pages/JobDescriptionPage.tsx
import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  Tooltip, 
  IconButton,
  Alert
} from '@mui/material';
import { useAuth } from '../context/AuthContext'; // Caminho corrigido
import { api } from '../services/api'; // Caminho corrigido
import VisibilityIcon from '@mui/icons-material/Visibility';
import UploadFileIcon from '@mui/icons-material/UploadFile';

// --- Tipo de Dados ---
interface JobDesc {
  id: string;
  cod_funcao: string;
  titulo: string;
  descricao_sumaria: string | null;
  arquivo_url: string | null; // ex: /jd_pdfs/FIN-JR.pdf
}

// --- Componente de Upload (só para o Admin) ---
function UploadButton({ codFuncao, onUploadSuccess }: { codFuncao: string, onUploadSuccess: () => void }) {
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    const file = event.target.files[0];
    
    const formData = new FormData();
    formData.append('pdf', file); // 'pdf' (como definido na Rota 3.3)

    try {
      // Chama a rota de upload do Admin
      await api.post(`/jd/upload/${codFuncao}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUploadSuccess(); // Recarrega a lista
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro no upload.');
    }
  };

  return (
    <Box>
      <IconButton color="primary" component="label">
        <UploadFileIcon />
        <input type="file" hidden accept="application/pdf" onChange={handleFileChange} />
      </IconButton>
      {error && <Alert severity="error" sx={{mt: 1, fontSize: '0.8rem'}}>{error}</Alert>}
    </Box>
  );
}

// --- Página Principal ---
export function JobDescriptionPage() {
  const { user } = useAuth(); // Pega o utilizador logado
  const [jds, setJds] = useState<JobDesc[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/jd'); // Rota 3.3 (Listar)
      setJds(response.data);
    } catch (error) {
      console.error('Erro ao buscar JDs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // O seu backend está em localhost:3001, o frontend em :5173
  // Precisamos do URL completo do backend para o link do PDF
  const backendUrl = 'http://localhost:3001'; 

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Descrições de Cargo
      </Typography>
      <Paper sx={{ p: 2 }}>
        {loading && <Typography>A carregar...</Typography>}
        <List>
          {jds.map((jd) => (
            <Tooltip 
              key={jd.id}
              // O SEU REQUISITO DO TOOLTIP
              title={jd.descricao_sumaria || 'Sem descrição sumária.'}
              placement="bottom-start"
              arrow
            >
              <ListItem 
                divider
                secondaryAction={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* Botão de Visualizar (Todos) */}
                    <IconButton 
                      edge="end" 
                      aria-label="visualizar"
                      disabled={!jd.arquivo_url}
                      // O SEU REQUISITO DE VISUALIZAÇÃO (abre o PDF)
                      href={`${backendUrl}${jd.arquivo_url}`} // Link direto para o PDF
                      target="_blank" // Abre numa nova aba
                    >
                      <VisibilityIcon />
                    </IconButton>

                    {/* Botão de Upload (SÓ ADMIN) */}
                    {user?.role === 'Administrador' && (
                      <UploadButton 
                        codFuncao={jd.cod_funcao} 
                        onUploadSuccess={loadData} 
                      />
                    )}
                  </Box>
                }
              >
                <ListItemText 
                  primary={jd.titulo}
                  secondary={jd.cod_funcao} 
                />
              </ListItem>
            </Tooltip>
          ))}
        </List>
      </Paper>
    </Box>
  );
}