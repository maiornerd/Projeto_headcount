// Conteúdo para: src/controllers/auth.controller.ts

import type { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

// Instanciamos o serviço (o cérebro)
const authService = new AuthService();

export class AuthController {

  /**
   * Lida com a requisição de Login
   */
  public async login(req: Request, res: Response): Promise<Response> {
    try {
      // 1. Pega os dados do corpo da requisição (o JSON)
      const { matricula, senha } = req.body;

      // Validação simples
      if (!matricula || !senha) {
        return res.status(400).json({ message: 'Matrícula e senha são obrigatórios.' });
      }

      // 2. Chama o serviço para executar a lógica
      const result = await authService.login(matricula, senha);

      // 3. Retorna sucesso (HTTP 200) com o token
      return res.status(200).json(result);

    } catch (error: any) {
      // 4. Se o serviço der erro (ex: senha errada), captura o erro
      // e retorna um erro de "Não Autorizado" (HTTP 401)
      if (error.message === 'Matrícula ou senha inválida.') {
        return res.status(401).json({ message: error.message });
      }

      console.error('ERRO INESPERADO NO LOGIN:', error);

      // Para qualquer outro erro inesperado
      return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  }

  // (Futuramente, colocaremos aqui o 'changePassword', 'createUser', etc.)
  /**
   * Lida com a requisição de Troca de Senha
   */
  public async changePassword(req: Request, res: Response): Promise<Response> {
    try {
      // 1. Pega a nova senha do corpo da requisição
      const { novaSenha } = req.body;

      // 2. Pega o ID do usuário (que o nosso Middleware 'ensureAuthenticated' anexou!)
      // O '!' no final diz ao TypeScript: "Confie em mim, 'req.user' vai existir"
      const userId = req.user!.id; 

      if (!novaSenha || novaSenha.length < 6) {
        return res.status(400).json({ message: 'A nova senha é obrigatória e deve ter pelo menos 6 caracteres.' });
      }

      // 3. Chama o serviço
      const result = await authService.changePassword(userId, novaSenha);

      return res.status(200).json(result);

    } catch (error: any) {
      return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  }
/**
   * Lida com a requisição de Criação de Usuário (Admin)
   */
  public async createUser(req: Request, res: Response): Promise<Response> {
    try {
      // Pega os dados do body
      const { matricula, nome, email, role_id, senha_inicial } = req.body;

      // Validação simples
      if (!matricula || !nome || !email || !role_id || !senha_inicial) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
      }

      const newUser = await authService.createUser(req.body);

      // Sucesso
      return res.status(201).json(newUser); // 201 = Created

    } catch (error: any) {
      // Se for um erro conhecido (email duplicado)
      if (error.message.includes('já cadastrado') || error.message.includes('não encontrada')) {
         return res.status(400).json({ message: error.message });
      }
      // Outro erro
      return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  }
  
}