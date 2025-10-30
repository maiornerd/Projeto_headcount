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

          // Converte 'undefined' (da interface) para 'null' (que o Prisma espera)
          target_table: data.targetTable ?? null,
          target_id: data.targetId ?? null,
          details: data.details ?? null

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
  public async getLogs(query: any) { // <-- Aceita 'query' (da Etapa 1.2)
    // 1. Parse dos parâmetros de paginação
    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '30');
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // 2. Busca os logs E o total de itens (em paralelo)
    const [totalItems, logs] = await prisma.$transaction([
      prisma.auditLog.count(),
      prisma.auditLog.findMany({
        skip: skip,
        take: take,
        orderBy: {
          timestamp: 'desc' // Mais recentes primeiro
        },
        include: {
          user: {
            select: {
              nome: true,
              matricula: true
            }
          }
        }
      })
    ]);

    // 3. Formata os dados para o DataGrid (Etapa 2.1)
    const formattedData = logs.map(log => ({
      ...log,
      id: log.id, // O DataGrid precisa de um 'id'
      userName: log.user ? log.user.nome : 'Usuário Deletado',
      userMatricula: log.user ? log.user.matricula : 'N/A',
    }));

    // 4. Retorna o objeto de paginação
    return {
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
      currentPage: page,
      pageSize: pageSize,
      data: formattedData // <-- Devolve os dados formatados
    };
  }
}
// Exporta uma instância única para ser usada em todo o app
  export const auditService = new AuditService();