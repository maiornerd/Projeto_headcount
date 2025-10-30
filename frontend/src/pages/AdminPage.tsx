// Em: frontend/src/pages/AdminPage.tsx (agora substituído)

import { useState } from 'react';
import { Box, Typography, Tab } from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';

// Importa as duas abas
import { LogsTab } from './Admin/LogsTab';
import { UsersTab } from './Admin/UsersTab';

export function AdminPage() {
  const [value, setValue] = useState('1'); // Controla qual aba está ativa

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Administração
      </Typography>
      
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleChange} aria-label="Abas de Administração">
            <Tab label="Logs de Auditoria" value="1" />
            <Tab label="Gestão de Utilizadores" value="2" />
          </TabList>
        </Box>
        
        {/* Painel 1: Logs (Carrega o seu código movido) */}
        <TabPanel value="1" sx={{ padding: 0, paddingTop: 3 }}>
          <LogsTab />
        </TabPanel>
        
        {/* Painel 2: Utilizadores (Carrega o novo código) */}
        <TabPanel value="2" sx={{ padding: 0, paddingTop: 3 }}>
          <UsersTab />
        </TabPanel>
        
      </TabContext>
    </Box>
  );
}