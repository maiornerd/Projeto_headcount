import type { Request, Response } from 'express';
import { JobDescriptionService } from '../services/job-description.service';

const jdService = new JobDescriptionService();

export class JobDescriptionController {

  /**
   * Lida com a requisição de listar as descrições de cargo
   */
  public async handleGetDescriptions(req: Request, res: Response): Promise<Response> {
    try {
      const data = await jdService.getDescriptions();
      return res.status(200).json(data);
    } catch (error: any) {
      return res.status(500).json({ message: 'Erro ao buscar descrições de cargo.' });
    }
  }

  /**
   * Lida com o upload do PDF
   */
  public async handleUploadDescription(req: Request, res: Response): Promise<Response> {
    try {
      // 1. O 'cod_funcao' vem da URL (ex: /api/jd/upload/FIN-JR)
      const { cod_funcao } = req.params;

      // 2. Verificação de segurança para o TypeScript
      if (!cod_funcao) {
        return res.status(400).json({ message: 'O "cod_funcao" é obrigatório na URL. Ex: /upload/FIN-JR' });
      }
      
      // 2. O 'req.file' é injetado pelo Multer (que configuraremos na rota)
      if (!req.file) {
        return res.status(400).json({ message: 'Nenhum ficheiro PDF enviado.' });
      }

      // 3. Montamos o URL público (ex: /jd_pdfs/FIN-JR.pdf)
      // (O nome do ficheiro é definido no multer.config.ts)
      const publicUrl = `/jd_pdfs/${req.file.filename}`;

      // 4. Salva o caminho no banco de dados
      await jdService.updatePdfUrl(cod_funcao, publicUrl);

      return res.status(200).json({ message: 'Upload concluído!', path: publicUrl });

    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
}