// Conteúdo para: src/services/employee.service.ts

import { prisma } from '../prisma';

/**
 * Função utilitária para calcular a diferença (anos, meses, dias) entre duas datas
 */
function calculateTimeDifference(startDate: Date): { years: number, months: number, days: number } {
  const now = new Date();
  // Define a data atual para o fuso horário local (ex: São Paulo)
  // Isso evita bugs de "um dia a menos" dependendo do fuso
  const today = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));

  let years = today.getFullYear() - startDate.getFullYear();
  let months = today.getMonth() - startDate.getMonth();
  let days = today.getDate() - startDate.getDate();

  // Ajusta os dias negativos
  if (days < 0) {
    months--;
    // Pega o último dia do mês anterior
    days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  }
  // Ajusta os meses negativos
  if (months < 0) {
    years--;
    months += 12;
  }

  return { years, months, days };
}

export class EmployeeService {

  /**
   * Busca um funcionário pela matrícula e calcula campos dinâmicos
   * @param matricula Matrícula do funcionário
   */
  public async getEmployeeByMatricula(matricula: string) {

    // 1. Buscar o funcionário no banco
    const employee = await prisma.employee.findUnique({
      where: { matricula: matricula }
    });

    // Se não encontrar, o Controller cuidará do erro 404
    if (!employee) {
      return null; 
    }

    // 2. Calcular Campos Dinâmicos (Requisito do Briefing)

    // Calcular Idade
    const ageDiff = calculateTimeDifference(employee.data_nascimento);
    const idade = ageDiff.years;

    // Calcular Tempo de Casa
    const tempoCasaDiff = calculateTimeDifference(employee.data_admissao);
    const tempoDeCasa = `${tempoCasaDiff.years} anos, ${tempoCasaDiff.months} meses, ${tempoCasaDiff.days} dias`;

    // (Nota: O briefing pede "Tempo na Função Atual". Nosso schema 'Employee'
    // não tem 'data_inicio_funcao'. Vamos retornar 'N/A' por enquanto.)

    // 3. Montar o objeto de resposta
    return {
      // Dados do Banco
      nome: employee.nome,
      data_nascimento: employee.data_nascimento.toISOString().split('T')[0], // Formato YYYY-MM-DD
      funcao_atual: employee.funcao_desc,
      data_admissao: employee.data_admissao.toISOString().split('T')[0], // Formato YYYY-MM-DD
      salario_hora: employee.salario_hora,
      jornada: employee.jornada,
      salario_atual: employee.salario_atual,
      setor_atual: employee.setor,
      escolaridade: employee.escolaridade,

      // Campos 'Mockados' (não existem no schema)
      devedor: 'N/A', 
      tempo_na_funcao_atual: 'N/A', // Campo a ser implementado

      // Dados Calculados
      idade: idade,
      tempo_de_casa: tempoDeCasa,
    };
  }
}