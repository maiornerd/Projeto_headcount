import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Alert, 
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { api } from '../services/api'; // O nosso 'mensageiro' Axios

// --- Tipos de Estado ---
type UploadStep = 'select' | 'preview' | 'confirming' | 'done';

interface PreviewData {
  headers: string[];
  previewRows: any[][];
  totalRows: number;
  sheetName: string;
  originalFilePath: string;
}

const steps = ['Selecionar Ficheiro', 'Pré-visualizar e Confirmar', 'Concluído'];

export function UploadPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  // --- Função 1: Lidar com a Seleção do Ficheiro ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      setError(null);
    }
  };

  // --- Função 2: Enviar para o Backend (Preview) ---
  const handlePreview = async () => {
    if (!selectedFile) {
      setError('Por favor, selecione um ficheiro primeiro.');
      return;
    }

    setLoading(true);
    setError(null);
    
    // O 'FormData' é como o Axios envia ficheiros
    const formData = new FormData();
    formData.append('file', selectedFile); // 'file' deve ser o nome que o Multer espera

    try {
      // Chama o endpoint de preview do seu backend
      const response = await api.post('/headcount/upload-preview', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setPreviewData(response.data);
      setActiveStep(1); // Avança para o passo de preview

    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao processar o ficheiro.');
    } finally {
      setLoading(false);
    }
  };
  
  // --- Função 3: Confirmar o Upload (Gravar no DB) ---
  const handleConfirm = async () => {
    if (!previewData) {
      setError('Não há dados de preview para confirmar.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Chama o endpoint de confirmação do seu backend
      const response = await api.post('/headcount/upload-confirm', {
        filePath: previewData.originalFilePath, // Envia o caminho que o backend nos deu
      });

      setActiveStep(2); // Avança para o passo "Concluído"
      setPreviewData(null); // Limpa o preview
      setSelectedFile(null); // Limpa a seleção

    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao confirmar o upload.');
    } finally {
      setLoading(false);
    }
  };

  // --- Função 4: Voltar ao início ---
  const handleReset = () => {
    setActiveStep(0);
    setSelectedFile(null);
    setPreviewData(null);
    setError(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Carregar Base de Funcionários (Excel/CSV)
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* --- PASSO 1: SELEÇÃO --- */}
        {activeStep === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Button
              variant="outlined"
              component="label" // Faz o botão agir como um <label>
              startIcon={<UploadFileIcon />}
            >
              Escolher Ficheiro (.xlsx, .xls, .csv)
              <input 
                type="file" 
                hidden 
                onChange={handleFileChange}
                accept=".xlsx, .xls, .csv"
              />
            </Button>
            {selectedFile && <Typography sx={{ mt: 2 }}>{selectedFile.name}</Typography>}
            
            <Button
              variant="contained"
              sx={{ mt: 3 }}
              onClick={handlePreview}
              disabled={!selectedFile || loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Pré-visualizar Dados'}
            </Button>
          </Box>
        )}

        {/* --- PASSO 2: PREVIEW --- */}
        {activeStep === 1 && previewData && (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Pré-visualização (primeiras 10 de {previewData.totalRows} linhas) da planilha '{previewData.sheetName}'.
            </Alert>
            
            <TableContainer component={Paper} sx={{ maxHeight: 400, mb: 3 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    {previewData.headers.map((header) => (
                      <TableCell key={header} sx={{ fontWeight: 'bold' }}>{header}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewData.previewRows.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Alert severity="warning" sx={{ mb: 3 }}>
              <strong>Atenção:</strong> Ao confirmar, a base de funcionários ('Employee') será <strong>completamente substituída</strong> pelos dados deste ficheiro. O sistema criará um backup automático.
            </Alert>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outlined" onClick={handleReset} disabled={loading}>
                Cancelar (Escolher outro ficheiro)
              </Button>
              <Button variant="contained" color="primary" onClick={handleConfirm} disabled={loading}>
                {loading ? <CircularProgress size={24} /> : 'Confirmar e Gravar no Banco'}
              </Button>
            </Box>
          </Box>
        )}

        {/* --- PASSO 3: CONCLUÍDO --- */}
        {activeStep === 2 && (
          <Box sx={{ textAlign: 'center' }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              Upload concluído com sucesso! A base de funcionários foi atualizada.
            </Alert>
            <Button variant="contained" onClick={handleReset}>
              Carregar Novo Ficheiro
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}