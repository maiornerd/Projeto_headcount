import type { Request, Response } from 'express';
import { HeadcountService } from '../services/headcount.service';

// Instancia o serviço
const headcountService = new HeadcountService();

export class HeadcountController {

  /**
   * Lida com a requisição de buscar o Headcount (com filtros)
   */
  public async getHeadcount(req: Request, res: Response): Promise<Response> {
    try {
      // 1. Captura todos os query params da URL (ex: ?page=1, ?gestor=...)
      const queryParams = req.query;
      
      // 2. Repassa os filtros para o serviço
      const data = await headcountService.getHeadcountData(queryParams);
      
      return res.status(200).json(data);

    } catch (error: any) {
      return res.status(500).json({ message: 'Erro ao buscar dados de headcount.' });
    }
  }


  /**
   * Lida com a requisição de upload (Preview)
   */
  public async handleUploadPreview(req: Request, res: Response): Promise<Response> {
    try {
      // 1. Verifica se o Multer anexou o arquivo
      if (!req.file) {
        return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
      }

      // 2. Pega o caminho do arquivo salvo
      const filePath = req.file.path;

      // 3. Chama o serviço para ler o arquivo
      const previewData = await headcountService.getUploadPreview(filePath);

      // 4. Retorna o preview
      return res.status(200).json(previewData);

    } catch (error: any) {
      // Captura erros (ex: tipo de arquivo inválido, planilha vazia)
      return res.status(400).json({ message: error.message });
    }
  }

  /**
   * Lida com a confirmação do upload
   */
  public async handleUploadConfirm(req: Request, res: Response): Promise<Response> {
    try {
      // 1. Pega o caminho do arquivo (que veio do preview)
      const { filePath } = req.body;
      // 2. Pega o ID do usuário (do token)
      const userId = req.user!.id;

      if (!filePath) {
        return res.status(400).json({ message: 'O caminho do arquivo (filePath) é obrigatório.' });
      }

      // 3. Chama o serviço para fazer o trabalho pesado
      const result = await headcountService.confirmUpload(filePath, userId);

      return res.status(200).json(result);

    } catch (error: any) {
      // Captura erros de backup, leitura ou banco
      return res.status(500).json({ message: error.message });
    }
  }  

  /**
   * Lida com a requisição de Rollback
   */
  public async handleRollback(req: Request, res: Response): Promise<Response> {
    try {
      // 1. Pega o ID do upload (da URL)
      const { id } = req.params;
      // 2. Pega o ID do Admin (do token)
      const adminUserId = req.user!.id;

      // Verificação para garantir que o ID existe
      if (!id) {
        return res.status(400).json({ message: 'O ID do upload é obrigatório na URL. Ex: /rollback-upload/seu-id-aqui' });
      }

      // Agora o TypeScript sabe que 'id' é 100% string
      const result = await headcountService.rollbackUpload(id, adminUserId);

      return res.status(200).json(result);

    } catch (error: any) {
      // Se o upload não existe ou já foi revertido
      if (error.message.includes('não encontrado') || error.message.includes('já foi revertido')) {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: error.message });
    }
  }

} // <- Este é o '}' de fechamento da classe HeadcountController