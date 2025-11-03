import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, useTheme } from '@mui/material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { api } from '../services/api';

// --- Tipos ---
interface DashboardData {
  name: string;      // ex: 'FINANÇAS'
  Orçado: number;
  Realizado: number;
}

// --- Componente do Gráfico de Barras ---
function OrçadoRealizadoChart({ data }: { data: DashboardData[] }) {
  const theme = useTheme(); // Para aceder às cores do tema

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="Orçado" fill={theme.palette.primary.main} />
        <Bar dataKey="Realizado" fill={theme.palette.success.main} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// --- Componente do Gráfico de Pizza (Total Realizado) ---
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

function RealizadoPorAreaChart({ data }: { data: DashboardData[] }) {
  // Filtra áreas sem funcionários para não poluir o gráfico
  const pieData = data.filter(d => d.Realizado > 0).map(d => ({
    name: d.name,
    value: d.Realizado
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart
      // Dá 30px de "espaço de respiração" nos lados
        margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
        >

        <Pie
          data={pieData}
          cx="55%"
          cy="50%"
          labelLine={false}
          label={(entry) => `${entry.name} (${entry.value})`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}


// --- Página Principal ---
export function AreaPage() {
  const [data, setData] = useState<DashboardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // 1. Chama o novo endpoint do backend
        const response = await api.get('/headcount/dashboard-data');
        setData(response.data);
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []); // '[]' = Carrega apenas uma vez

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Área - Dashboard de Gráficos
      </Typography>

      {loading ? (
        <Typography>A carregar dados...</Typography>
      ) : (
        <Grid container spacing={3}> {/* */}
          {/* Gráfico 1: Barras */}
          <Grid xs={12} lg={8}> {/* */}
          {/* **** 👆 FIM DA CORREÇÃO 1 👆 **** */}
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Orçado vs. Realizado por Macro Área
              </Typography>
              <OrçadoRealizadoChart data={data} />
            </Paper>
          </Grid>
          
          {/* Gráfico 2: Pizza */}
          <Grid xs={12} lg={4}>
          {/* **** 👆 FIM DA CORREÇÃO 2 👆 **** */}
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Distribuição do Realizado
              </Typography>
              <RealizadoPorAreaChart data={data} />
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}