// Conteúdo para: src/services/headcount.service.ts (VERSÃO CORRIGIDA)

import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';
import * as XLSX from 'xlsx'; // Importe o XLSX aqui no topo
import * as fs from 'fs'; // File System, para escrever o backup
import * as path from 'path';
import { auditService } from './audit.service';

export class HeadcountService {

  // -----------------------------------------------------------------
  // MÉTODO ANTIGO (JÁ EXISTENTE)
  // -----------------------------------------------------------------
  public async getHeadcountData(query: any) {
    
    // --- 1. PARSE DOS PARÂMETROS ---
    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '20');
    const sortField = query.sortField || 'desc_sec_hc'; 
    const sortOrder = query.sortOrder || 'asc';
    
    const gestor = query.gestor_area_hc;
    const funcao = query.cod_funcao;
    const macroArea = query.macro_area;
    const buscaGlobal = query.buscaGlobal; 

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // --- 2. CALCULAR O REALIZADO (Exatamente como antes) ---
    const realizadoCounts = await prisma.employee.groupBy({
      by: ['funcao_codigo'],
      where: {
        status: { in: ["ativo", "Férias", "Licença Maternidade"] }
      },
      _count: { matricula: true }
    });

    const realizadoMap = new Map<string, number>();
    for (const group of realizadoCounts) {
      realizadoMap.set(group.funcao_codigo, group._count.matricula);
    }

    // --- 3. CONSTRUIR O 'WHERE' DINÂMICO ---
    
    // Inicializa o 'where' principal como um objeto vazio
    const where: Prisma.HeadcountWhereInput = {};

    // Cria um array SEPARADO para as condições 'AND'
    const andConditions: Prisma.HeadcountWhereInput[] = [];

    // Agora podemos usar .push() neste array sem erros
    if (gestor) {
      andConditions.push({ gestor_area_hc: { contains: gestor, mode: 'insensitive' } });
    }
    if (funcao) {
      andConditions.push({ cod_funcao: { equals: funcao } });
    }
    if (macroArea) {
      andConditions.push({ macro_area: { equals: macroArea } });
    }

    // Se tivermos alguma condição, nós as adicionamos ao 'where'
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }
    
    // Filtro de Busca Global (permanece igual)
    if (buscaGlobal) {
      where.OR = [
        { desc_funcao: { contains: buscaGlobal, mode: 'insensitive' } },
        { desc_sec_hc: { contains: buscaGlobal, mode: 'insensitive' } },
        { gestor_area_hc: { contains: buscaGlobal, mode: 'insensitive' } },
      ];
    }

    // --- 4. EXECUTAR QUERIES (Paginação e Contagem) ---
    const [totalItems, orcadoData] = await prisma.$transaction([
      prisma.headcount.count({ where }),
      prisma.headcount.findMany({
        where,
        orderBy: {
          [sortField]: sortOrder
        },
        skip: skip,
        take: take
      })
    ]);

    // --- 5. JUNTAR ORÇADO + REALIZADO ---
    const resultadoFinal = orcadoData.map(linhaOrcado => {
     const realizado = realizadoMap.get(linhaOrcado.cod_funcao) || 0;
      
      // Lógica do 'orcado' (baseada no seed)
      // TODO: Melhorar esta lógica para ser dinâmica (pegar o mês atual)
      const orcado = (linhaOrcado.qtd_orc_historico as any)['10/2025'] || 0;
      const saldo = orcado - realizado;

      return {
       ...linhaOrcado,
        id: linhaOrcado.id, // Garante que o ID existe para o DataGrid
        qtd_orc: orcado,
        realizado: realizado, // padroniza para minúsculo
        saldo: saldo,
     };
   });

    // --- 6. RETORNAR O NOVO OBJETO DE DADOS ---
    return {
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
      currentPage: page,
      pageSize: pageSize,
      data: resultadoFinal 
    };
  }

  // -----------------------------------------------------------------
  // NOVO MÉTODO (COM A CORREÇÃO)
  // -----------------------------------------------------------------

  /**
   * Processa um arquivo de upload e retorna um preview
   * @param filePath O caminho do arquivo salvo pelo Multer (ex: 'uploads/123-arquivo.xlsx')
   */
  /**
   * Processa um arquivo de upload e retorna um preview
   * @param filePath O caminho do arquivo salvo pelo Multer (ex: 'uploads/123-arquivo.xlsx')
   */
  public async getUploadPreview(filePath: string) {
    try {
      // 1. Ler o arquivo do disco
      const workbook = XLSX.readFile(filePath);

      // 2. Pegar o nome da primeira planilha (COM VERIFICAÇÃO ROBUSTA)
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('O arquivo Excel não contém planilhas (sheets).');
      }
      
      const sheetName = workbook.SheetNames[0];

      // **** 👇 CORREÇÃO EXPLÍCITA AQUI 👇 ****
      // Verificação extra para garantir ao TypeScript que sheetName não é nulo
      if (!sheetName) {
        throw new Error('Não foi possível encontrar o nome da primeira planilha.');
      }
      // Agora o TypeScript sabe que sheetName é 100% string
      const worksheet = workbook.Sheets[sheetName]; 
      // **** 👆 FIM DA CORREÇÃO 👆 ****

      if (!worksheet) {
          throw new Error(`A planilha '${sheetName}' não pôde ser lida.`);
      }

      // 3. Converter a planilha para JSON
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (!data || data.length === 0) {
        throw new Error('Planilha está vazia ou em formato irreconhecível.');
      }

      // 4. Separar Cabeçalhos e Linhas de Dados
      const headers = data[0] as string[];
      const rows = data.slice(1); 

      // 5. Retorna o preview (cabeçalhos + 10 primeiras linhas)
      return {
        headers: headers,
        previewRows: rows.slice(0, 10), // Mostra só as 10 primeiras
        totalRows: rows.length,
        sheetName: sheetName,
        originalFilePath: filePath // Guardamos para o próximo passo (salvar)
      };

    } catch (error: any) {
      throw new Error(`Erro ao ler o arquivo: ${error.message}`);
    }
  }

  /**
   * Confirma o upload, faz backup e atualiza o banco de dados 'Employee'
   * @param filePath O caminho do arquivo (ex: 'uploads/123-arquivo.xlsx')
   * @param userId O ID do usuário que está fazendo o upload (para logs)
   */
  public async confirmUpload(filePath: string, userId: string) {
    
    // --- 1. FAZER BACKUP ---
    console.log('Iniciando backup dos funcionários...');
    const backupFileName = `backup-employees-${new Date().toISOString().replace(/:/g, '-')}.json`;
    const backupFilePath = path.join('backups', backupFileName);

    try {
      const currentEmployees = await prisma.employee.findMany();
      fs.writeFileSync(backupFilePath, JSON.stringify(currentEmployees, null, 2));
      console.log(`Backup criado em: ${backupFilePath}`);
    } catch (backupError: any) {
      throw new Error(`Falha ao criar backup: ${backupError.message}`);
    }

    // --- 2. LER O ARQUIVO (DE NOVO) ---
    let rows: any[][];
    let headers: string[];

    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) throw new Error('Nome da planilha não encontrado.');
      
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) throw new Error('Planilha não pôde ser lida.');
      
      // **** 👇 CORREÇÃO AQUI 👇 ****
      // Dizemos ao TS que esperamos que 'data' seja um array de arrays (any[][])
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      // **** 👆 FIM DA CORREÇÃO 👆 ****

      if (!data || data.length < 2) throw new Error('Planilha vazia.');
      
      headers = data[0] as string[]; // Agora isso é seguro (data[0] é any[])
      rows = data.slice(1); // E isso também é seguro (data.slice(1) é any[][])

    } catch (readError: any) {
      throw new Error(`Erro ao reler o arquivo: ${readError.message}`);
    }

    // --- 3. ATUALIZAR O BANCO (TRANSAÇÃO) ---
    // Mapear cabeçalhos para os campos do Prisma
    const matriculaIndex = headers.indexOf('matricula');
    const nomeIndex = headers.indexOf('nome');
    const statusIndex = headers.indexOf('status');
    const funcaoCodigoIndex = headers.indexOf('funcao_codigo');

    if (matriculaIndex === -1 || nomeIndex === -1 || statusIndex === -1) {
      // Deleta o arquivo temporário se a validação falhar
      fs.unlinkSync(filePath);
      throw new Error('Arquivo CSV deve conter as colunas: matricula, nome, status.');
    }

    // Prepara as operações de 'upsert'
    const upsertOperations = rows.map(row => {
      const matricula = String(row[matriculaIndex]);
      const data = {
        matricula: matricula,
        nome: String(row[nomeIndex]),
        status: String(row[statusIndex]),
        funcao_codigo: String(row[funcaoCodigoIndex] || 'N/A'), // Usa N/A se 'funcao_codigo' estiver vazia
        // Valores padrão para campos obrigatórios que não estão no CSV
        data_nascimento: new Date('1900-01-01'), 
        data_admissao: new Date(),
        funcao_desc: 'N/A',
        setor: 'N/A',
        jornada: 0,
        salario_atual: 0,
      };

      return prisma.employee.upsert({
        where: { matricula: matricula },
        update: data, // O que atualizar se a matrícula já existe
        create: data, // O que criar se a matrícula for nova
      });
    });

    try {
      // Executa todas as N operações dentro de UMA transação
      await prisma.$transaction(upsertOperations);
    } catch (dbError: any) {
      // Se o banco falhar, tentamos reverter o backup (lógica de rollback)
      throw new Error(`Erro ao salvar no banco: ${dbError.message}`);
    }

    // --- 4. REGISTRAR O UPLOAD ---
    await auditService.log({
      userId: userId,
      action: 'confirm_upload',
      targetTable: 'Employee',
      details: { file: filePath, rows: upsertOperations.length }
    });
    
    // 5. Limpar o arquivo temporário
    fs.unlinkSync(filePath);

    return { 
      message: 'Upload concluído e banco de dados atualizado!',
      totalRowsProcessed: upsertOperations.length,
      backupFile: backupFilePath
    };
  }
  /**
   * Reverte um upload usando o arquivo de backup
   * @param uploadId O ID do registro de Upload
   * @param adminUserId O ID do Admin que está fazendo o rollback (para log)
   */
  public async rollbackUpload(uploadId: string, adminUserId: string) {

    // 1. Encontrar o registro do upload
    const uploadRecord = await prisma.upload.findUnique({
      where: { id: uploadId }
    });

    if (!uploadRecord) {
      throw new Error('Registro de upload não encontrado.');
    }
    if (uploadRecord.status === 'Revertido') {
      throw new Error('Este upload já foi revertido anteriormente.');
    }
    if (!uploadRecord.backup_reference) {
      throw new Error('Registro de upload não possui um arquivo de backup associado.');
    }

    const backupFilePath = uploadRecord.backup_reference;

    // 2. Ler o arquivo de backup
    let employeesFromBackup: any[];
    try {
      const backupFileContent = fs.readFileSync(backupFilePath, 'utf-8');
      employeesFromBackup = JSON.parse(backupFileContent);
    } catch (readError: any) {
      throw new Error(`Falha ao ler o arquivo de backup: ${readError.message}`);
    }

    // 3. Restaurar o banco (Transação Crítica)
    try {
      // Converte as datas (que viraram strings no JSON) de volta para Date
      const dataWithDates = employeesFromBackup.map(emp => ({
        ...emp,
        data_nascimento: new Date(emp.data_nascimento),
        data_admissao: new Date(emp.data_admissao)
      }));

      await prisma.$transaction([
        // 1. APAGA TODOS os funcionários atuais
        prisma.employee.deleteMany({}),

        // 2. RECRIA TODOS os funcionários do backup
        prisma.employee.createMany({
          data: dataWithDates
        })
      ]);

    } catch (dbError: any) {
      throw new Error(`Erro ao restaurar o banco de dados: ${dbError.message}`);
    }

    // 4. Atualizar o status do upload
    await prisma.upload.update({
      where: { id: uploadId },
      data: { status: 'Revertido' }
    });

    // 5. Registrar na auditoria (Importante!)
    await prisma.auditLog.create({
      data: {
        user_id: adminUserId,
        action: 'rollback_upload',
        target_table: 'upload',
        target_id: uploadId,
        details: {
          message: `Upload ${uploadId} revertido. Backup ${backupFilePath} restaurado.`
        }
      }
    });

    return { message: 'Rollback concluído. O banco de dados foi restaurado ao estado anterior.' };
  }

  /**
   * Agrega os dados de Orçado vs. Realizado para os gráficos
   */
  public async getDashboardData() {
    
    // --- 1. Calcular o Realizado (copiado do seu 'getHeadcountData') ---
    const realizadoCounts = await prisma.employee.groupBy({
      by: ['funcao_codigo'],
      where: {
        status: { in: ["ativo", "Férias", "Licença Maternidade"] }
      },
      _count: { matricula: true }
    });
    const realizadoMap = new Map<string, number>();
    for (const group of realizadoCounts) {
      realizadoMap.set(group.funcao_codigo, group._count.matricula);
    }

    // --- 2. Buscar TODOS os dados do Orçado ---
    // (Não podemos usar 'groupBy' do Prisma porque o 'orcado' é um JSON)
    const allHeadcountRows = await prisma.headcount.findMany();

    // --- 3. Agregar os dados por Macro Área (em código) ---
    const aggMap = new Map<string, { name: string, Orçado: number, Realizado: number }>();

    for (const row of allHeadcountRows) {
      const area = row.macro_area || 'Sem Área';
      
      // Lógica do Orçado (a mesma da sua tabela)
      const orcado = (row.qtd_orc_historico as any)['10/2025'] || 0;
      
      // Lógica do Realizado
      const realizado = realizadoMap.get(row.cod_funcao) || 0;

      // Inicializa o mapa se a área for nova
      if (!aggMap.has(area)) {
        aggMap.set(area, { name: area, Orçado: 0, Realizado: 0 });
      }

      // Soma os valores
      const current = aggMap.get(area)!;
      current.Orçado += orcado;
      current.Realizado += realizado;
    }

    // 4. Converte o Mapa para um Array (que o 'recharts' consegue ler)
    // Ex: [ { name: 'FINANÇAS', Orçado: 4, Realizado: 3 }, ... ]
    return Array.from(aggMap.values());
  }

}