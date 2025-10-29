// Conteúdo para: src/routes/job-description.routes.ts

import { Router } from 'express';
import { JobDescriptionController } from '../controllers/job-description.controller';
import { ensureAuthenticated, can } from '../middleware/auth.middleware';

const jobDescController = new JobDescriptionController();
const jobDescRoutes = Router();

// GET /api/job-descriptions
// Lista todas as descrições (requer 'ver_tabela')
jobDescRoutes.get(
  '/',
  ensureAuthenticated,
  can('ver_tabela'),
  jobDescController.listDescriptions
);

// GET /api/job-descriptions/:id
// Vê uma descrição específica (requer 'ver_tabela')
jobDescRoutes.get(
  '/:id',
  ensureAuthenticated,
  can('ver_tabela'),
  jobDescController.getDescription
);

// (No futuro, podemos adicionar rotas POST, PUT, DELETE
// protegidas por 'admin_geral' para gerenciar as descrições)

export default jobDescRoutes;