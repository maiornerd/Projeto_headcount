// Conteúdo para: src/routes/auth.routes.ts (VERSÃO FINAL CORRIGIDA)

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { ensureAuthenticated, can } from '../middleware/auth.middleware';
import { prisma } from '../prisma';
import { Prisma } from '@prisma/client'; // Importa o namespace Prisma


// Instanciamos o controlador
const authController = new AuthController();

// Criamos o roteador
const authRoutes = Router();

// --- Rotas de Autenticação e Usuários ---

// POST /api/auth/login
authRoutes.post('/login', authController.login);

// POST /api/auth/change-password
authRoutes.post(
  '/change-password',
  ensureAuthenticated,
  authController.changePassword
);

// POST /api/auth/users (Admin cria usuário)
authRoutes.post(
  '/users',
  ensureAuthenticated,
  can('criar_usuarios'),
  authController.createUser
);

authRoutes.get(
  '/users',
  ensureAuthenticated,
  can('admin_geral'), // Ou 'criar_usuarios', ajuste a permissão
  authController.getUsers
);

// GET /api/auth/roles (Lista Roles)
authRoutes.get(
  '/roles',
  ensureAuthenticated,
  async (req, res) => { // <-- Changed to async/await for clarity
    try {
      // Type inference works better with async/await here
      const roles = await prisma.role.findMany();
      // The type of 'roles' will be correctly inferred as Prisma.Role[]
      res.status(200).json(roles);
    } catch (err: any) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      res.status(500).json({ message: message });
    }
  }
);

export default authRoutes; // Make sure export default is the very last thing