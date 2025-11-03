// Em: backend/src/routes/job-description.routes.ts
import { Router } from 'express';
import { JobDescriptionController } from '../controllers/job-description.controller';
import { ensureAuthenticated, can } from '../middleware/auth.middleware';
import { uploadJDPdf } from '../config/multer.config';

const jdController = new JobDescriptionController();
const jdRoutes = Router();

// Rota 1: Listar todas as descrições (Todos os logados podem ver)
jdRoutes.get(
  '/',
  ensureAuthenticated,
  jdController.handleGetDescriptions
);

// Rota 2: Fazer o upload de um PDF (Apenas Admin)
// Usamos o 'cod_funcao' na URL para saber a qual cargo o PDF pertence
jdRoutes.post(
  '/upload/:cod_funcao',
  ensureAuthenticated,
  can('admin_geral'), // Protegido!
  uploadJDPdf.single('pdf'), // Usamos o import nomeado
  jdController.handleUploadDescription
);

export default jdRoutes;