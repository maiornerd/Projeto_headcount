import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Tooltip } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef,
              GridPaginationModel, 
              GridRenderCellParams } from '@mui/x-data-grid';
import { api } from '../../services/api'; 
import { format } from 'date-fns'; // Para formatar datas
import { ptBR } from 'date-fns/locale';

// Colunas para a tabela de Logs
const columns: GridColDef[] = [
  { 
    field: 'timestamp', 
    headerName: 'Data/Hora', 
    width: 180,
    renderCell: (params: GridRenderCellParams) => (
      <Tooltip title={new Date(params.value as string).toISOString()}>
        <span>
          {format(new Date(params.value as string), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
        </span>
      </Tooltip>
    )
  },
  { 
    field: 'userName', 
    headerName: 'Usuário',
    width: 220,
    valueGetter: (value, row) => `${row.userName} (${row.userMatricula})`
  },
  { field: 'action', headerName: 'Ação', width: 150 },
  { field: 'targetTable', headerName: 'Tabela Alvo', width: 120 },
  { 
    field: 'details', 
    headerName: 'Detalhes', 
    flex: 1, // Ocupa o espaço restante
    renderCell: (params: GridRenderCellParams) => (
      <Tooltip title={JSON.stringify(params.value, null, 2)}>
        <pre style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {JSON.stringify(params.value)}
        </pre>
      </Tooltip>
    )
  },
];

export function LogsTab() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 30,
  });

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', (paginationModel.page + 1).toString());
      params.append('pageSize', paginationModel.pageSize.toString());
      
      try {
        const response = await api.get(`/admin/logs?${params.toString()}`);
        setRows(response.data.data);
        setTotalItems(response.data.totalItems);
      } catch (error) {
        console.error('Erro ao buscar logs:', error);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, [paginationModel]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Administração - Logs de Auditoria
      </Typography>
      <Paper sx={{ height: '75vh', width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          rowCount={totalItems}
          paginationMode="server"
          onPaginationModelChange={setPaginationModel}
          paginationModel={paginationModel}
          pageSizeOptions={[30, 50, 100]}
          density="compact"
        />
      </Paper>
    </Box>
  );
}