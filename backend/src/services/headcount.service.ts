import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { auditService } from './audit.service';

export class HeadcountService {

  // -----------------------------------------------------------------
  // MÉTODO 1: getHeadcountData (Para a tabela principal)
  // -----------------------------------------------------------------
  public async getHeadcountData(query: any) {
    
    // 1. Parse dos parâmetros
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

    // 2. Calcular o Realizado (com base nos 'Employee')
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

    // 3. Construir o 'Where' dinâmico (filtros)
    const where: Prisma.HeadcountWhereInput = {};
    const andConditions: Prisma.HeadcountWhereInput[] = [];
    if (gestor) {
      andConditions.push({ gestor_area_hc: { contains: gestor, mode: 'insensitive' } });
    }
    if (funcao) {
      andConditions.push({ cod_funcao: { equals: funcao } });
    }
    if (macroArea) {
      andConditions.push({ macro_area: { equals: macroArea } });
    }
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }
    if (buscaGlobal) {
      where.OR = [
        { desc_funcao: { contains: buscaGlobal, mode: 'insensitive' } },
        { desc_sec_hc: { contains: buscaGlobal, mode: 'insensitive' } },
        { gestor_area_hc: { contains: buscaGlobal, mode: 'insensitive' } },
      ];
    }

    // 4. Executar Queries (Paginação e Contagem)
    const [totalItems, orcadoData] = await prisma.$transaction([
      prisma.headcount.count({ where }),
      prisma.headcount.findMany({
        where,
        orderBy: { [sortField]: sortOrder },
        skip: skip,
        take: take
      })
    ]);

    // 5. Juntar Orçado + Realizado (com cálculo de Saldo)
    const currentMonth = new Date().toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' });
    const resultadoFinal = orcadoData.map(linhaOrcado => {
      const realizado = realizadoMap.get(linhaOrcado.cod_funcao) || 0;
      const orcado = (linhaOrcado.qtd_orc_historico as any)[currentMonth] || 
                     (linhaOrcado.qtd_orc_historico as any)['10/2025'] || 0;
      const saldo = orcado - realizado;
      return {
        ...linhaOrcado,
        id: linhaOrcado.id, 
        qtd_orc: orcado,
        realizado: realizado,
        saldo: saldo,
      };
    });

    // 6. Retornar o objeto de dados
    return {
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
      currentPage: page,
      pageSize: pageSize,
      data: resultadoFinal 
    };
  }

  // -----------------------------------------------------------------
  // MÉTODO 2: getUploadPreview (Para o Upload)
  // -----------------------------------------------------------------
  public async getUploadPreview(filePath: string) {
    try {
      const workbook = XLSX.readFile(filePath);
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('O arquivo Excel não contém planilhas (sheets).');
      }
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error('Não foi possível encontrar o nome da primeira planilha.');
      }
      const worksheet = workbook.Sheets[sheetName]; 
      if (!worksheet) {
          throw new Error(`A planilha '${sheetName}' não pôde ser lida.`);
      }
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      if (!data || data.length === 0) {
        throw new Error('Planilha está vazia ou em formato irreconhecível.');
      }
      const headers = data[0] as string[];
      const rows = data.slice(1); 
      return {
        headers: headers,
        previewRows: rows.slice(0, 10), 
        totalRows: rows.length,
        sheetName: sheetName,
        originalFilePath: filePath 
      };
    } catch (error: any) {
      throw new Error(`Erro ao ler o arquivo: ${error.message}`);
    }
  }

  // -----------------------------------------------------------------
  // MÉTODO 3: confirmUpload (A Lógica de RECRIAÇÃO)
  // -----------------------------------------------------------------
  public async confirmUpload(filePath: string, userId: string) {
    // Verificar se o diretório de backup existe
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // --- 1. FAZER BACKUP ---
    console.log('Iniciando backup dos funcionários...');
    const backupFileName = `backup-employees-${new Date().toISOString().replace(/:/g, '-')}.json`;
    const backupFilePath = path.join(backupDir, backupFileName);
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
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      if (!data || data.length < 2) throw new Error('Planilha vazia.');
      headers = data[0] as string[]; 
      rows = data.slice(1);
    } catch (readError: any) {
      throw new Error(`Erro ao reler o arquivo: ${readError.message}`);
    }

    // --- 3. PREPARAR OS DADOS (Lógica de Mapeamento) ---
    const matriculaIndex = headers.indexOf('matricula');
    const nomeIndex = headers.indexOf('nome');
    const statusIndex = headers.indexOf('status');
    const funcaoCodigoIndex = headers.indexOf('funcao_codigo');
    
    if (matriculaIndex === -1 || nomeIndex === -1 || statusIndex === -1) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw new Error('Arquivo deve conter as colunas: matricula, nome, status.');
    }

    const newEmployeesData = rows
      .filter(row => row[matriculaIndex] && String(row[matriculaIndex]).trim())
      .map(row => ({
        matricula: String(row[matriculaIndex]).trim(),
        nome: String(row[nomeIndex] || '').trim(),
        status: String(row[statusIndex] || '').trim(),
        funcao_codigo: String(row[funcaoCodigoIndex] || 'N/A').trim(),
        data_nascimento: new Date('1900-01-01'), 
        data_admissao: new Date(),
        funcao_desc: 'N/A',
        setor: 'N/A',
        jornada: 0,
        salario_atual: 0,
      }));

    if (newEmployeesData.length === 0) {
      throw new Error('Nenhum dado válido encontrado no arquivo.');
    }

    // --- 4. ATUALIZAR O BANCO (LÓGICA DE RECRIAÇÃO) ---
    try {
      await prisma.$transaction([
        prisma.employee.deleteMany({}),
        prisma.employee.createMany({
          data: newEmployeesData
        })
      ]);
    } catch (dbError: any) {
      throw new Error(`Erro ao salvar no banco: ${dbError.message}`);
    }

    // --- 5. REGISTRAR O UPLOAD ---
    await auditService.log({
      userId: userId,
      action: 'confirm_upload',
      targetTable: 'Employee',
      details: { file: filePath, rows: newEmployeesData.length }
    });

    // Limpar o arquivo temporário
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return { 
      message: 'Upload concluído e base de funcionários atualizada!',
      totalRowsProcessed: newEmployeesData.length,
      backupFile: backupFilePath
    };
  }

  // -----------------------------------------------------------------
  // MÉTODO 4: rollbackUpload (Para o Admin)
  // -----------------------------------------------------------------
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
      const dataWithDates = employeesFromBackup.map(emp => ({
        ...emp,
        data_nascimento: new Date(emp.data_nascimento),
        data_admissao: new Date(emp.data_admissao)
      }));
      await prisma.$transaction([
        prisma.employee.deleteMany({}),
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

    // 5. Registrar na auditoria
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

  // -----------------------------------------------------------------
  // MÉTODO 5: getDashboardData (Para os Gráficos)
  // -----------------------------------------------------------------
  public async getDashboardData() {
    // 1. Calcular o Realizado
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

    // 2. Buscar TODOS os dados do Orçado
    const allHeadcountRows = await prisma.headcount.findMany();

    // 3. Agregar os dados por Macro Área (em código)
    const aggMap = new Map<string, { name: string, Orçado: number, Realizado: number }>();
    const currentMonth = new Date().toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' });
    
    for (const row of allHeadcountRows) {
      const area = row.macro_area || 'Sem Área';
      const orcado = (row.qtd_orc_historico as any)[currentMonth] || 
                     (row.qtd_orc_historico as any)['10/2025'] || 0;
      const realizado = realizadoMap.get(row.cod_funcao) || 0;
      
      if (!aggMap.has(area)) {
        aggMap.set(area, { name: area, Orçado: 0, Realizado: 0 });
      }
      const current = aggMap.get(area)!;
      current.Orçado += orcado;
      current.Realizado += realizado;
    }

    // 4. Converte o Mapa para um Array
    return Array.from(aggMap.values());
  }
}