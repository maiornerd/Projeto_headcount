import { Box, AppBar, Toolbar, Typography, Drawer, List, ListItemButton, ListItemIcon, ListItemText, CssBaseline } from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom'; // Outlet é onde as páginas vão carregar
import { useAuth } from '../../context/AuthContext'; // Para o botão Sair

// Ícones (precisamos instalar)
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import LogoutIcon from '@mui/icons-material/Logout';

const drawerWidth = 240; // Largura do menu lateral

export function MainLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login'); // Opcional, o App.tsx já deve fazer isso
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* Barra do Topo */}
      <AppBar
        position="fixed"
        sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px` }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Gestão de Headcount
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Menu Lateral (Sidebar) */}
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Toolbar /> {/* Espaçador para ficar abaixo da AppBar */}
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {/* Item 1: Headcount */}
            <ListItemButton onClick={() => navigate('/')}>
              <ListItemIcon>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Headcount" />
            </ListItemButton>
            
            {/* Item 2: Upload */}
            <ListItemButton onClick={() => navigate('/upload')}>
              <ListItemIcon>
                <UploadFileIcon />
              </ListItemIcon>
              <ListItemText primary="Upload" />
            </ListItemButton>

            {/* Item 3: Admin (Exemplo) */}
            <ListItemButton onClick={() => navigate('/admin')}>
              <ListItemIcon>
                <PeopleIcon />
              </ListItemIcon>
              <ListItemText primary="Administração" />
            </ListItemButton>
          </List>
          
          {/* Item de Logout (no final) */}
          <List sx={{ position: 'absolute', bottom: 0, width: '100%' }}>
            <ListItemButton onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Sair" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>

      {/* Área do Conteúdo Principal */}
      <Box
        component="main"
        sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}
      >
        <Toolbar /> {/* Espaçador para o conteúdo */}
        
        {/* É AQUI QUE NOSSAS PÁGINAS VÃO APARECER */}
        <Outlet /> 
        
      </Box>
    </Box>
  );
}