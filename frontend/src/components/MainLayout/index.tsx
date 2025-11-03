import { useState } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import type { Theme, CSSObject } from '@mui/material/styles';
import { 
  Box, 
  AppBar as MuiAppBar,
  Toolbar, 
  Typography, 
  Drawer as MuiDrawer, 
  List, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  CssBaseline,
  IconButton,
  Divider
} from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Ícones (alguns são novos)
import DashboardIcon from '@mui/icons-material/Dashboard'; // Headcount
import UploadFileIcon from '@mui/icons-material/UploadFile'; // Upload
import DescriptionIcon from '@mui/icons-material/Description'; // Descrição de Cargo
import PeopleIcon from '@mui/icons-material/People'; // Administração
import LogoutIcon from '@mui/icons-material/Logout'; // Sair
import AssessmentIcon from '@mui/icons-material/Assessment';
import MenuIcon from '@mui/icons-material/Menu'; // Ícone "Hamburguer"
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const drawerWidth = 240;

// --- Estilos de Animação para Abertura ---
const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

// --- Estilos de Animação para Fecho ---
const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`, // Apenas ícones
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

// --- Componente Customizado: Barra de Topo (AppBar) ---
// (Move-se quando o menu abre/fecha)
const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<{ open?: boolean }>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

// --- Componente Customizado: O Menu Lateral (Drawer) ---
const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);

// --- Componente Customizado: Cabeçalho do Drawer (para o botão de fechar) ---
const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));


export function MainLayout() {
  const theme = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();

  // **** O ESTADO QUE CONTROLA O MENU ****
  const [open, setOpen] = useState(false);

  const handleDrawerOpen = () => {
    setOpen(true);
  };
  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleLogout = () => {
    logout();
    // O App.tsx já trata o redirecionamento
  };
  
  // Lista de itens do menu para evitar repetição
  const menuItems = [
    { text: 'Headcount', icon: <DashboardIcon />, path: '/headcount' },
    { text: 'Upload', icon: <UploadFileIcon />, path: '/upload' },
    { text: 'Descrição de Cargo', icon: <DescriptionIcon />, path: '/job-descriptions' },
    { text: 'Área (Dashboard)', icon: <AssessmentIcon />, path: '/area' },
    { text: 'Administração', icon: <PeopleIcon />, path: '/admin' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* Barra do Topo */}
      <AppBar position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{
              marginRight: 5,
              ...(open && { display: 'none' }), // Esconde o ícone de menu se o menu estiver aberto
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Gestão de Headcount
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Menu Lateral (Sidebar) */}
      <Drawer variant="permanent" open={open}>
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />
        
        <List>
          {menuItems.map((item) => (
            <ListItemButton
              key={item.text}
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
              }}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {/* Só mostra o texto se o menu (open) estiver aberto */}
              <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} />
            </ListItemButton>
          ))}
        </List>
        
        <Divider />
        
        {/* Item de Logout (no final) */}
        <List sx={{ marginTop: 'auto' }}>
           <ListItemButton
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
              }}
              onClick={handleLogout}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                }}
              >
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Sair" sx={{ opacity: open ? 1 : 0 }} />
            </ListItemButton>
        </List>
      </Drawer>

      {/* Área do Conteúdo Principal */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <DrawerHeader /> {/* Espaçador para o conteúdo */}
        
        {/* É AQUI QUE NOSSAS PÁGINAS VÃO APARECER */}
        <Outlet /> 
        
      </Box>
    </Box>
  );
}