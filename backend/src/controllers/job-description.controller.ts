// Conteúdo para: src/controllers/job-description.controller.ts

import type { Request, Response } from 'express';
import { prisma } from '../prisma';

export class JobDescriptionController {

  /**
   * Lista todas as descrições de cargo (paginado)
   */
  public async listDescriptions(req: Request, res: Response): Promise<Response> {
    try {
      const descriptions = await prisma.jobDescription.findMany({
        select: {
          id: true,
          cod_funcao: true,
          titulo: true,
        }
      });
      return res.status(200).json(descriptions);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Busca UMA descrição de cargo (o conteúdo completo)
   */
  public async getDescription(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      // **** 👇 CORREÇÃO AQUI 👇 ****
      // Verificação para garantir que o ID existe antes de usá-lo
      if (!id) {
        return res.status(400).json({ message: 'O ID da descrição é obrigatório na URL. Ex: /job-descriptions/seu-id-aqui' });
      }
      // **** 👆 FIM DA CORREÇÃO 👆 ****

      // Agora o TypeScript sabe que 'id' é 100% string
      const description = await prisma.jobDescription.findUnique({
        where: { id: id } // Esta linha agora é segura
      });

      if (!description) {
        return res.status(404).json({ message: 'Descrição de cargo não encontrada.' });
      }

      // O frontend vai ler as permissões do usuário e decidir se mostra
      // o 'conteudo_html' ou o 'arquivo_url'. O backend apenas entrega os dados.
      return res.status(200).json(description);
      
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
}