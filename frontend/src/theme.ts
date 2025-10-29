// Conteúdo para: src/theme.ts

import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light', // Tema claro
    primary: {
      main: '#004a99', // Azul-escuro (como no briefing)
    },
    secondary: {
      main: '#6c757d', // Cinza
    },
    background: {
      default: '#f4f6f8', // Um cinza bem claro para o fundo
      paper: '#ffffff', // Branco para cartões, tabelas, etc.
    },
  },
  typography: {
    // Requisito: Fonte Arial, 12px
    fontFamily: 'Arial, sans-serif',
    fontSize: 12,

    // Requisito: Títulos em negrito
    h1: { fontWeight: 'bold' },
    h2: { fontWeight: 'bold' },
    h3: { fontWeight: 'bold' },
    h4: { fontWeight: 'bold' },
    h5: { fontWeight: 'bold' },
    h6: { fontWeight: 'bold' },
  },
  components: {
    // Um pequeno ajuste para os botões ficarem mais profissionais
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Botões não serão em MAIÚSCULAS
          borderRadius: 8, // Bordas levemente arredondadas
        },
      },
    },
  },
});