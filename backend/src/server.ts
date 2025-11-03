import authRoutes from './routes/auth.routes';
import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import headcountRoutes from './routes/headcount.routes';
import employeeRoutes from './routes/employee.routes';
import adminRoutes from './routes/admin.routes';
import jobDescRoutes from './routes/job-description.routes';
import path from 'path'; // Importe o 'path'
import jdRoutes from './routes/job-description.routes';

// Carrega o dotenv assim que o app inicia (importante para o Prisma)
import 'dotenv/config'; 

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middlewares Essenciais ---

// 1. Permite que o frontend (rodando em outro domínio) acesse esta API
app.use(cors());

// 2. Permite que o Express entenda JSON no corpo das requisições (ex: login)
app.use(express.json());

// --- Rotas Principais da API ---
app.use('/api/auth', authRoutes);
app.use('/api/headcount', headcountRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/job-descriptions', jobDescRoutes);
app.use('/jd_pdfs', express.static(path.join(__dirname, '../uploads/jd_pdfs')));
app.use('/api/jd', jdRoutes);

// --- Rota de Teste ---
// Vamos criar uma rota simples só para ver se o servidor está vivo
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    message: 'Servidor de Headcount está no ar!',
    timestamp: new Date().toISOString(),
  });
});


// --- Inicialização do Servidor ---
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🔗 Rota de teste: http://localhost:${PORT}/api/health`);
});