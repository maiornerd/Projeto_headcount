// Conteúdo para: src/routes/employee.routes.ts

import { Router } from 'express';
import { EmployeeController } from '../controllers/employee.controller';
import { ensureAuthenticated } from '../middleware/auth.middleware';

const employeeController = new EmployeeController();
const employeeRoutes = Router();

// GET /api/employee/:matricula
// (O :matricula é um parâmetro dinâmico)
employeeRoutes.get(
  '/:matricula',
  ensureAuthenticated, // Apenas usuários logados
  employeeController.getEmployee
);

export default employeeRoutes;