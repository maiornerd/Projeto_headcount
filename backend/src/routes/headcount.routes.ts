// Conteúdo para: src/routes/headcount.routes.ts

import { Router } from 'express';
import { HeadcountController } from '../controllers/headcount.controller';
import { ensureAuthenticated, can } from '../middleware/auth.middleware';
import upload from '../config/multer.config';
import { prisma } from '../prisma';

const headcountController = new HeadcountController();
const headcountRoutes = Router();

// GET /api/headcount
// Esta é a rota principal da tabela.
headcountRoutes.get(
  '/',
  ensureAuthenticated,        // 1º Porteiro: Está logado?
  can('ver_tabela'),          // 2º Segurança VIP: Tem permissão "ver_tabela"?
  headcountController.getHeadcount
);

// POST /api/headcount/upload-preview
// Rota para enviar a planilha e receber o preview
headcountRoutes.post(
  '/upload-preview',
  ensureAuthenticated,          // 1. Porteiro (Logado?)
  can('upload'),                // 2. Segurança VIP (Tem permissão de 'upload'?)
  upload.single('file'),  // 3. Multer (Pega o arquivo do campo 'file')
  headcountController.handleUploadPreview // 4. Controller
);
// Rota para confirmar o preview e salvar no banco
headcountRoutes.post(
  '/upload-confirm',
  ensureAuthenticated,      // 1. Porteiro
  can('upload'),            // 2. Segurança VIP
  headcountController.handleUploadConfirm // 3. Controller
  // (Note que não usamos o Multer aqui. Só recebemos JSON)
);
// Lista o histórico de uploads
headcountRoutes.get(
  '/uploads',
  ensureAuthenticated,
  can('admin_geral'), // Apenas admins podem ver o histórico
  async (req, res) => {
    try {
      const uploads = await prisma.upload.findMany({
        orderBy: { uploaded_at: 'desc' },
        include: {
          uploaded_by: { // Mostra quem fez o upload
            select: { nome: true, matricula: true }
          }
        }
      });
      res.status(200).json(uploads);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);
// POST /api/headcount/rollback-upload/:id
// Rota para reverter um upload (Admin)
headcountRoutes.post(
  '/rollback-upload/:id',
  ensureAuthenticated,
  can('admin_geral'), // Só Admin geral pode reverter
  headcountController.handleRollback
);
export default headcountRoutes;