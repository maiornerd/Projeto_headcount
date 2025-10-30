// Conteúdo para: src/controllers/admin.controller.ts

import type { Request, Response } from 'express';
import { auditService } from '../services/audit.service';

export class AdminController {

  public async getAuditLogs(req: Request, res: Response): Promise<Response> {
    try {
     // const page = parseInt(req.query.page as string || '1');
     // const pageSize = parseInt(req.query.pageSize as string || '10');

      const logs = await auditService.getLogs(req.query);

      return res.status(200).json(logs);

    } catch (error: any) {
      return res.status(500).json({ message: 'Erro ao buscar logs de auditoria.' });
    }
  }
}