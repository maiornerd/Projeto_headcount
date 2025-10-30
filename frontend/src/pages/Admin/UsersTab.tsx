import { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Alert
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { api } from '../../services/api'; 
import AddIcon from '@mui/icons-material/Add';

// --- Tipos ---
interface Role {
  id: string;
  name: string;
}
interface User {
  id: string;
  matricula: string;
  nome: string;
  email: string;
  roleName: string;
  must_change_password: boolean;
}
type FormData = {
  nome: string;
  matricula: string;
  email: string;
  role_id: string;
  senha_inicial: string;
}

// --- Colunas para a Tabela de Utilizadores ---
const columns: GridColDef[] = [
  { field: 'nome', headerName: 'Nome', width: 250 },
  { field: 'matricula', headerName: 'Matrícula', width: 150 },
  { field: 'email', headerName: 'Email', width: 250 },
  { field: 'roleName', headerName: 'Role (Função)', width: 150 },
  // (Poderíamos adicionar botões de Ação/Editar aqui)
];

// --- O Formulário Modal ---
function UserFormModal({ open, onClose, onSave }: { open: boolean, onClose: () => void, onSave: () => void }) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [formData, setFormData] = useState<FormData>({} as FormData);
  const [error, setError] = useState<string | null>(null);

  // Carrega os Roles (funções) quando o modal abre
  useEffect(() => {
    if (open) {
      api.get('/auth/roles') // Endpoint que você já tem
         .then(response => setRoles(response.data))
         .catch(err => setError('Não foi possível carregar as funções (Roles).'));
    }
  }, [open]);

  const handleChange = (e: any) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    setError(null);
    try {
      // Chama o endpoint POST /api/auth/users que você já tem
      await api.post('/auth/users', formData);
      onSave(); // Avisa o pai para recarregar a tabela
      onClose(); // Fecha o modal
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar utilizador.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Adicionar Novo Utilizador</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField name="nome" label="Nome Completo" onChange={handleChange} />
        <TextField name="matricula" label="Matrícula" onChange={handleChange} />
        <TextField name="email" label="Email" type="email" onChange={handleChange} />
        <TextField name="senha_inicial" label="Senha Inicial Provisória" onChange={handleChange} />
        <FormControl fullWidth>
          <InputLabel id="role-select-label">Role (Função)</InputLabel>
          <Select
            labelId="role-select-label"
            name="role_id"
            value={formData.role_id || ''}
            label="Role (Função)"
            onChange={handleChange}
          >
            {roles.map(role => (
              <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained">Salvar</Button>
      </DialogActions>
    </Dialog>
  );
}


// --- Componente Principal da Aba ---
export function UsersTab() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  // Função para (re)carregar os utilizadores
  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/users'); // O endpoint que criámos na Etapa 1
      setUsers(response.data);
    } catch (error) {
      console.error('Erro ao buscar utilizadores:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carrega os dados na primeira vez
  useEffect(() => {
    loadUsers();
  }, []);

  const handleSave = () => {
    loadUsers(); // Recarrega a tabela após salvar
  };

  return (
    <>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setModalOpen(true)}
        >
          Adicionar Utilizador
        </Button>
      </Box>

      <Paper sx={{ height: '70vh', width: '100%' }}>
        <DataGrid
          rows={users}
          columns={columns}
          loading={loading}
          density="compact"
        />
      </Paper>

      <UserFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </>
  );
}