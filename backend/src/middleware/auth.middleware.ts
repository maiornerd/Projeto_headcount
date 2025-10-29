// Conteúdo para: src/middleware/auth.middleware.ts

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Pega a mesma chave secreta que usamos para criar o token
const JWT_SECRET = process.env.JWT_SECRET || 'SEGREDO_SUPER_FORTE_PARA_TESTES_123';

/**
 * Define o "formato" do payload que está dentro do nosso token.
 * Isso ajuda o TypeScript a entender o que esperamos encontrar.
 */
interface AuthPayload {
  id: string;
  matricula: string;
  role: string;
  permissions: any;
  iat: number; // "Issued At" (Criado em) - padrão do JWT
  exp: number; // "Expires" (Expira em) - padrão do JWT
}

/**
 * Este é o "hack" do TypeScript.
 * Estamos dizendo ao Express: "Eu quero adicionar uma nova propriedade
 * chamada 'user' ao objeto 'Request', e ela terá o formato AuthPayload."
 */
declare global {
  namespace Express {
    export interface Request {
      user?: AuthPayload; // A propriedade 'user' agora é opcional no Request
    }
  }
}

/**
 * Nosso middleware "Porteiro"
 */
export const ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  // 1. Pegar o cabeçalho "Authorization" da requisição
  const authHeader = req.headers.authorization;

  // 2. Se o cabeçalho não existir, barra o usuário
  if (!authHeader) {
    return res.status(401).json({ message: 'Token não fornecido. Acesso negado.' });
  }

  // 3. O token vem no formato "Bearer [token_gigante]"
  //    Nós queremos apenas o token (a segunda parte do split)
  const [, token] = authHeader.split(' ');

  if (!token) {
    return res.status(401).json({ message: 'Token mal formatado.' });
  }

  // 4. Verificar se o token é válido
  try {
    // Tenta verificar o token usando nossa chave secreta
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;

    // 5. SE DEU CERTO: Anexa os dados do usuário na requisição
    req.user = decoded;

    // 6. Deixa a requisição passar para o próximo passo (o Controller)
    return next();

  } catch (err) {
    // 7. SE DEU ERRADO (token expirado, assinatura errada):
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
};

// Colocamos aqui o 'can' (verificador de permissão), etc.)
export const can = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // 1. Pega o usuário que o 'ensureAuthenticated' já decodificou
    const user = req.user;

    // 2. Se não houver usuário (algo deu muito errado), bloqueia
    if (!user) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    // 3. O 'Administrador' pode tudo. Ignora a verificação. (Requisito)
    if (user.role === 'Administrador') {
      return next(); // Deixa passar
    }

    // 4. Verifica se o JSON de permissões do usuário tem a chave necessária
    const permissions = user.permissions as Record<string, boolean>;

    if (permissions && permissions[permission]) {
      return next(); // Deixa passar! Ele tem a permissão.
    }

    // 5. Se chegou até aqui, ele não tem a permissão. Bloqueia.
    return res.status(403).json({ 
      message: 'Acesso negado. Você não tem permissão para esta ação.' 
    });
  };
};