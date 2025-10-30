import { prisma } from '../prisma'; // Nosso cliente Prisma [cite: 84]
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { auditService } from './audit.service'; // 

const JWT_SECRET = process.env.JWT_SECRET || 'SEGREDO_SUPER_FORTE_PARA_TESTES_123';

export class AuthService { // [cite: 86]

  /**
   * Lógica de login
   * @param matricula Matrícula do usuário
   * @param senha_raw A senha em texto puro (ex: "123456")
   */
  public async login(matricula: string, senha_raw: string) {

    // 1. Achar o usuário no banco pela matrícula
    const user = await prisma.user.findUnique({
      where: { matricula },
      include: { role: true } // Inclui os dados do "Role" (permissões)
    });

    // Se usuário não existe, retorna erro
    if (!user|| !user.role) { // [cite: 87]
      throw new Error('Matrícula ou senha inválida.');
    } // [cite: 88]

    // 2. Comparar a senha enviada com o hash salvo no banco
    const isPasswordValid = await bcrypt.compare(senha_raw, user.senha_hash); // [cite: 89]

    // Se a senha for inválida, retorna erro
    if (!isPasswordValid) { // [cite: 89]
      throw new Error('Matrícula ou senha inválida.');
    } // [cite: 90]

    // 3. Gerar o JSON Web Token (JWT)
    const token = jwt.sign(
      {
        id: user.id,
        matricula: user.matricula,
        role: user.role.name,
        permissions: user.role.permissions // Permissões granulares
      },
      JWT_SECRET,
      { expiresIn: '8h' } // Token expira em 8 horas
    );

    // 4. Retornar os dados para o Controller
    
    // **** 👇 LOG DE AUDITORIA 1 INSERIDO AQUI 👇 ****
    await auditService.log({ userId: user.id, action: 'login' });
    // **** 👆 FIM DA INSERÇÃO 👆 ****

    return { // [cite: 91]
      token,
      must_change_password: user.must_change_password, // [cite: 91]
      user: { // [cite: 92]
        nome: user.nome,
        role: user.role.name
      }
    };
  } // [cite: 93]

  /**
   * Lógica de troca de senha
   * @param userId O ID do usuário (vem do token)
   * @param novaSenha A nova senha (ex: "nova@123")
   */
  public async changePassword(userId: string, novaSenha: string) {

    // 1. Criptografar a nova senha
    const salt = await bcrypt.genSalt(10);
    const senha_hash = await bcrypt.hash(novaSenha, salt); // [cite: 94]

    // 2. Atualizar o usuário no banco
    await prisma.user.update({
      where: {
        id: userId // Encontra o usuário pelo ID que veio do token
      },
      data: {
        senha_hash: senha_hash, // Salva a nova senha criptografada
        must_change_password: false // Requisito: marca que ele já trocou a senha
      }
    });

    // **** 👇 LOG DE AUDITORIA 2 INSERIDO AQUI 👇 ****
    await auditService.log({ userId: userId, action: 'change_password' });
    // **** 👆 FIM DA INSERÇÃO 👆 ****

    return { message: 'Senha alterada com sucesso.' }; // [cite: 95]
  }

  /**
   * Lógica de criação de usuário (Admin)
   */
  public async createUser(data: {
    matricula: string;
    nome: string;
    email: string;
    role_id: string; // O ID do Role (ex: "Gerente")
    senha_inicial: string;
  
  }) { // [cite: 96]
    
    // 1. Verifica se matrícula ou email já existem
    const userExists = await prisma.user.findFirst({
      where: { OR: [{ matricula: data.matricula }, { email: data.email }] }
    });

    if (userExists) { // [cite: 97]
      throw new Error('Matrícula ou e-mail já cadastrado.');
    } // [cite: 98]
    
    // 2. Garante que o Role (Função) existe
    const roleExists = await prisma.role.findUnique({ where: { id: data.role_id }}); // [cite: 99]
    if (!roleExists) { // [cite: 99]
        throw new Error('Função (Role) não encontrada.');
    } // [cite: 100]

    // 3. Criptografa a senha inicial genérica
    const salt = await bcrypt.genSalt(10);
    const senha_hash = await bcrypt.hash(data.senha_inicial, salt); // [cite: 101]

    // 4. Cria o usuário
    const newUser = await prisma.user.create({
      data: {
        matricula: data.matricula,
        nome: data.nome,
        email: data.email,
        senha_hash: senha_hash,
        role_id: data.role_id,
        must_change_password: true // Força a troca na primeira vez (requisito!)
      }
    });

    // 5. Retorna o usuário criado (sem a senha)
    const { senha_hash: _, ...userSemSenha } = newUser; // [cite: 102]

    // **** 👇 LOG DE AUDITORIA 3 INSERIDO AQUI 👇 ****
    // (Idealmente, o 'userId' seria do admin, mas vamos usar o do usuário criado)
    await auditService.log({
      userId: newUser.id,
      action: 'create_user',
      targetTable: 'User',
      targetId: newUser.id,
      details: { nome: newUser.nome, matricula: newUser.matricula }
    });
    // **** 👆 FIM DA INSERÇÃO 👆 ****

    return userSemSenha; // [cite: 103]
  }

  public async getUsers() {
    const users = await prisma.user.findMany({
      orderBy: {
        nome: 'asc'
      },
      // Inclui a informação do 'Role' de cada utilizador
      include: {
        role: {
          select: {
            name: true
          }
        }
      }
    });

    // Remove o hash da senha antes de enviar para o frontend
    return users.map(user => {
      const { senha_hash, ...userSemSenha } = user;
      return {
        ...userSemSenha,
        id: user.id, // Garante que o ID está presente para o DataGrid
        roleName: user.role ? user.role.name : 'Sem Role'
      };
    });
  }

} // <-- Este é o '}' final da classe AuthService