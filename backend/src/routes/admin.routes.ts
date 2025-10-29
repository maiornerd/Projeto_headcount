// Conteúdo para: src/routes/admin.routes.ts

import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { ensureAuthenticated, can } from '../middleware/auth.middleware';

const adminController = new AdminController();
const adminRoutes = Router();

// GET /api/admin/logs
// Protegido por Admin
adminRoutes.get(
  '/logs',
  ensureAuthenticated,
  can('admin_geral'), // Apenas Admin pode ver os logs
  adminController.getAuditLogs
);

export default adminRoutes;