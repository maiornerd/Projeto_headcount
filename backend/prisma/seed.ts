// Conteúdo para: prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Hack para garantir a conexão (vamos manter por enquanto)
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:Al4n%24%21lv%40@localhost:5432/headcount_sgh?schema=public"
    }
  }
});

async function main() {
  console.log('🌱 Iniciando o seeding...');

  // 1. Limpar dados antigos
  await prisma.auditLog.deleteMany();
  await prisma.upload.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.headcount.deleteMany();
  await prisma.jobDescription.deleteMany();

  console.log('🚮 Dados antigos limpos.');

  // 2. Criar os Roles
  const adminRole = await prisma.role.create({
    data: {
      name: 'Administrador',
      permissions: {
        ver_tabela: true,
        editar_tabela: true,
        upload: true,
        exportar: true,
        imprimir: true,
        baixar: true,
        criar_usuarios: true,
        admin_geral: true,
      },
    },
  });
  const gerenteRole = await prisma.role.create({
    data: { name: 'Gerente', permissions: { ver_tabela: true } },
  });
  // (O resto dos roles...)
  console.log('🎭 Roles criados.');

  // 3. Criar o usuário Admin
  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('Mudar123#', salt); // Usando a senha que você já trocou

  await prisma.user.create({
    data: {
      matricula: 'admin',
      nome: 'Administrador do Sistema',
      email: 'admin@suaempresa.com',
      senha_hash: adminHash,
      role_id: adminRole.id,
      must_change_password: false, // Você já trocou
    },
  });
  console.log(`👤 Usuário admin criado.`);

  // ######################################################
  // ##           👇 DADOS DE EXEMPLO NOVOS 👇           ##
  // ######################################################

  // 4. Criar Funcionários (Base do "Realizado")
  await prisma.employee.createMany({
    data: [
      { matricula: '1001', nome: 'Ana Silva', data_nascimento: new Date('1990-05-15'), data_admissao: new Date('2020-01-10'), funcao_codigo: 'FIN-JR', funcao_desc: 'Analista Financeiro Jr', setor: 'Financeiro', jornada: 220, salario_atual: 3500, status: 'ativo' },
      { matricula: '1002', nome: 'Bruno Costa', data_nascimento: new Date('1985-11-02'), data_admissao: new Date('2018-03-15'), funcao_codigo: 'FIN-JR', funcao_desc: 'Analista Financeiro Jr', setor: 'Financeiro', jornada: 220, salario_atual: 3500, status: 'Férias' },
      { matricula: '1003', nome: 'Carla Dias', data_nascimento: new Date('1995-02-20'), data_admissao: new Date('2022-07-01'), funcao_codigo: 'FIN-PL', funcao_desc: 'Analista Financeiro Pl', setor: 'Financeiro', jornada: 220, salario_atual: 5000, status: 'ativo' },
      { matricula: '1004', nome: 'Daniel Lima', data_nascimento: new Date('1992-09-30'), data_admissao: new Date('2021-11-05'), funcao_codigo: 'TI-SR', funcao_desc: 'Analista de TI Sênior', setor: 'TI', jornada: 220, salario_atual: 7500, status: 'Licença Maternidade' },
      { matricula: '1005', nome: 'Elisa Rocha', data_nascimento: new Date('1988-07-12'), data_admissao: new Date('2015-06-01'), funcao_codigo: 'TI-SR', funcao_desc: 'Analista de TI Sênior', setor: 'TI', jornada: 220, salario_atual: 7500, status: 'ativo' },
      { matricula: '1006', nome: 'Fabio Mendes', data_nascimento: new Date('1990-01-25'), data_admissao: new Date('2023-01-15'), funcao_codigo: 'TI-SR', funcao_desc: 'Analista de TI Sênior', setor: 'TI', jornada: 220, salario_atual: 7500, status: 'Demitido' }, // Este não deve contar
    ],
  });
  console.log('👥 Funcionários (Employee) de exemplo criados.');

  // 5. Criar Vagas (Base do "Orçado")
  await prisma.headcount.createMany({
    data: [
      {
        colig: '1', cod_colig: 'C-01', empresa_hc: 'Matriz SA', cod_sec_hc: '1.1.01', cod_sec: '1.1.01', gestor_area_hc: 'Gestor Financeiro', atividade_hc: 'Controladoria',
        desc_sec_hc: 'FINANCEIRO', desc_area_rm: 'FINANCEIRO', macro_area: 'FINANÇAS',
        cod_funcao: 'FIN-JR', desc_funcao: 'Analista Financeiro Jr',
        qtd_orc_historico: { "09/2025": 2, "10/2025": 3 } // Orçado: 3
      },
      {
        colig: '1', cod_colig: 'C-01', empresa_hc: 'Matriz SA', cod_sec_hc: '1.1.01', cod_sec: '1.1.01', gestor_area_hc: 'Gestor Financeiro', atividade_hc: 'Controladoria',
        desc_sec_hc: 'FINANCEIRO', desc_area_rm: 'FINANCEIRO', macro_area: 'FINANÇAS',
        cod_funcao: 'FIN-PL', desc_funcao: 'Analista Financeiro Pl',
        qtd_orc_historico: { "09/2025": 1, "10/2025": 1 } // Orçado: 1
      },
      {
        colig: '1', cod_colig: 'C-01', empresa_hc: 'Matriz SA', cod_sec_hc: '1.2.01', cod_sec: '1.2.01', gestor_area_hc: 'Gestor de TI', atividade_hc: 'Sistemas',
        desc_sec_hc: 'TECNOLOGIA', desc_area_rm: 'TI', macro_area: 'TI',
        cod_funcao: 'TI-SR', desc_funcao: 'Analista de TI Sênior',
        qtd_orc_historico: { "09/2025": 2, "10/2025": 2 } // Orçado: 2
      },
    ]
  });
  console.log('📊 Vagas (Headcount) de exemplo criadas.');
  
// 6. Criar Descrições de Cargo (Exemplo)
  await prisma.jobDescription.createMany({
    data: [
      {
        cod_funcao: 'FIN-JR',
        titulo: 'Analista Financeiro Jr',
        conteudo_html: '<h1>Descrição - Analista Fin Jr</h1><p>Responsável por...</p>',
        arquivo_url: '/files/FIN-JR.pdf',
        descricao_sumaria: 'Colocar argolas nas alças das peças manualmente, e realizar o arremate das peças de modo a efetuar o fechamento do lote que será recolhido e encaminhado para o Controle de Qualidade – CQ. Conferir as peças recebidas da bancada com as Ordens de Fabricação de Confecção – OFC, e dobrá-las para que sejam embaladas em sacos plásticos e/ou caixas etiquetadas a fim de realizar o correto direcionamento. Ao término das operações, retirar os tickets da régua de tickets referente ao trabalho que foi realizado, e assinar a fim de comprovar seu trabalho feito.'
      },
      {
        cod_funcao: 'FIN-PL',
        titulo: 'Analista Financeiro Pl',
        conteudo_html: '<h1>Descrição - Analista Fin Pl</h1><p>Responsável por...</p>',
        arquivo_url: '/files/FIN-PL.pdf',
        descricao_sumaria: 'Descrição sumária do Analista Financeiro Pleno...' // Adicione um placeholder
      },
      {
        cod_funcao: 'TI-SR',
        titulo: 'Analista de TI Sênior',
        conteudo_html: '<h1>Descrição - Analista TI Sr</h1><p>Responsável por...</p>',
        arquivo_url: '/files/TI-SR.pdf',
        descricao_sumaria: 'Descrição sumária do Analista de TI Sênior...' // Adicione um placeholder
      }
    ]
  });
  console.log('📄 Descrições de Cargo (JobDescription) criadas.');

  console.log('✅ Seeding completo!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });