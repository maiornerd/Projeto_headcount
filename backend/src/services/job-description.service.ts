// Em: backend/src/services/job-description.service.ts
import { prisma } from '../prisma';

export class JobDescriptionService {

  /**
   * Lista todas as descrições de cargo
   */
  public async getDescriptions() {
    return prisma.jobDescription.findMany({
      orderBy: {
        titulo: 'asc'
      },
      // Selecionamos apenas os campos necessários para a lista
      select: {
        id: true,
        cod_funcao: true,
        titulo: true,
        descricao_sumaria: true,
        arquivo_url: true // O caminho do PDF
      }
    });
  }

  /**
   * Atualiza o caminho do PDF de uma descrição de cargo
   * @param codFuncao O 'FIN-JR', 'TI-SR', etc.
   * @param filePath O novo caminho (ex: '/uploads/jd_pdfs/FIN-JR.pdf')
   */
  public async updatePdfUrl(codFuncao: string, filePath: string) {
    return prisma.jobDescription.update({
      where: {
        cod_funcao: codFuncao
      },
      data: {
        arquivo_url: filePath
      }
    });
  }
}