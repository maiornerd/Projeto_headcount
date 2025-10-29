// Conteúdo para: src/services/audit.service.ts (VERSÃO CORRIGIDA)

import { prisma } from '../prisma';

interface AuditLogData {
  userId: string;
  action: string; // Ex: 'login', 'create_user', 'rollback_upload'
  targetTable?: string; // Ex: 'User', 'Upload'
  targetId?: string; // Ex: o ID do usuário criado
  details?: any; // JSON para infos extras
}

export class AuditService {

  /**
   * Cria um novo registro de log de auditoria
   */
  public async log(data: AuditLogData) {
    try {
      await prisma.auditLog.create({
        data: {
          user_id: data.userId,
          action: data.action,

          // **** 👇 CORREÇÃO AQUI 👇 ****
          // Converte 'undefined' (da interface) para 'null' (que o Prisma espera)
          target_table: data.targetTable ?? null,
          target_id: data.targetId ?? null,
          details: data.details ?? null
          // **** 👆 FIM DA CORREÇÃO 👆 ****
        }
      });
    } catch (error) {
      // O que fazer se o log falhar?
      // Por enquanto, apenas registramos no console para não quebrar a ação principal
      console.error('Falha ao registrar log de auditoria:', error);
    }
  }

  /**
   * Busca os logs de auditoria (para o Admin)
   */
  public async getLogs(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const [totalItems, logs] = await prisma.$transaction([
      prisma.auditLog.count(),
      prisma.auditLog.findMany({
        skip,
        take,
        orderBy: { timestamp: 'desc' },
        include: {
          user: { // Pega o nome do usuário que fez a ação
            select: { nome: true, matricula: true }
          }
        }
      })
    ]);

    return {
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
      currentPage: page,
      pageSize,
      data: logs
    };
  }
}

// Exporta uma instância única para ser usada em todo o app
export const auditService = new AuditService();