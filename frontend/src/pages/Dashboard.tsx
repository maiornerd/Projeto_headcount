import { useState, useEffect } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { 
  DataGrid, 
  GridToolbar
} from '@mui/x-data-grid';
import type { 
  GridColDef, 
  GridPaginationModel, 
  GridSortModel,     // <-- Agora vamos usar isto
  GridFilterModel,   // <-- E isto
  GridRenderCellParams 
} from '@mui/x-data-grid';
import { api } from '../services/api'; 

// Colunas (Exatamente como antes)
const columns: GridColDef[] = [
  // ... (As suas colunas 'desc_area_rm', 'macro_area', etc., ficam aqui iguais)
  { field: 'desc_area_rm', headerName: 'DESCRIÇÃO ÁREA', width: 180 },
  { field: 'macro_area', headerName: 'MACRO ÁREA', width: 130 },
  { field: 'desc_sec_hc', headerName: 'DESCRIÇÃO SEÇÃO', width: 180 },
  { field: 'gestor_area_hc', headerName: 'Gestor da Área', width: 180 },
  { field: 'cod_funcao', headerName: 'Cód Função', width: 110 },
  { field: 'desc_funcao', headerName: 'Descrição da função', width: 250 },
  { field: 'qtd_orc', headerName: 'Orçado', type: 'number', width: 90, align: 'center', headerAlign: 'center' },
  { field: 'realizado', headerName: 'Realizado', type: 'number', width: 90, align: 'center', headerAlign: 'center' },
  {
    field: 'saldo',
    headerName: 'Saldo',
    type: 'number',
    width: 90,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params: GridRenderCellParams) => {
      const saldo = params.value as number;
      let color: 'success' | 'error' | 'default' = 'default';
      if (saldo > 0) color = 'success';
      if (saldo < 0) color = 'error';
      return <Chip label={saldo} color={color} variant="outlined" size="small" />;
    },
  },
];

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);

  // --- 1. ESTADO PARA PAGINAÇÃO, ORDENAÇÃO E FILTROS ---
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25,
  });
  
  // Estado para ordenação (valor inicial igual ao default do backend)
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: 'desc_sec_hc', sort: 'asc' },
  ]);

  // Estado para filtros
  const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [] });

  // --- 2. HOOK DE EFEITO ATUALIZADO ---
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      
      const params = new URLSearchParams();
      
      // Parâmetros de Paginação
      params.append('page', (paginationModel.page + 1).toString());
      params.append('pageSize', paginationModel.pageSize.toString());
      
      // Parâmetros de Ordenação (compatível com o backend)
      if (sortModel.length > 0) {
        params.append('sortField', sortModel[0].field);
        params.append('sortOrder', sortModel[0].sort || 'asc');
      }

      // Parâmetros de Filtro (compatível com o backend)
      
      // A) Filtro Global (da barra de pesquisa)
      if (filterModel.quickFilterValues && filterModel.quickFilterValues.length > 0) {
        params.append('buscaGlobal', filterModel.quickFilterValues.join(' '));
      }
      
      // B) Filtros por Coluna
      filterModel.items.forEach(item => {
        // Garantir que temos um campo e um valor antes de enviar
        if (item.field && item.value) {
          // O backend espera 'gestor_area_hc', 'cod_funcao', etc.
          params.append(item.field, item.value);
        }
      });

      try {
        const response = await api.get(`/headcount?${params.toString()}`);
        setRows(response.data.data);
        setTotalItems(response.data.totalItems); 

      } catch (error) {
        console.error('Erro ao buscar dados da API:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    // Dependência atualizada: recarrega se paginação, ordenação OU filtro mudar
  }, [paginationModel, sortModel, filterModel]); 

  return (
    <Box sx={{ height: '80vh', width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Quadro de Vagas (Contagem de Cabeças)
      </Typography>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        
        // --- 3. PROPRIEDADES DO DATAGRID ATUALIZADAS ---
        rowCount={totalItems}
        paginationMode="server"
        sortingMode="server"  // <-- LIGADO
        filterMode="server"   // <-- LIGADO
        
        // Controladores de Paginação
        onPaginationModelChange={setPaginationModel}
        paginationModel={paginationModel}
        
        // Controladores de Ordenação
        onSortModelChange={setSortModel}
        sortModel={sortModel}

        // Controladores de Filtro
        onFilterModelChange={setFilterModel}
        filterModel={filterModel}
        
        pageSizeOptions={[10, 25, 50, 100]}
        slots={{ toolbar: GridToolbar }} // A Toolbar já tem os controlos de filtro
        density="compact"
        autoHeight={false}
      />
    </Box>
  );
}