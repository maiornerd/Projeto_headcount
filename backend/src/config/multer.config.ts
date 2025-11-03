import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs'; // Para garantir que as pastas existem

// --- 1. CONFIGURAÇÃO ANTIGA (Para Uploads de Headcount/Funcionários) ---
// Esta configuração salva o ficheiro com um nome temporário na pasta 'uploads/'
// (Isto é o que o seu 'headcount.service.ts' espera)

const defaultStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/';
    fs.mkdirSync(uploadPath, { recursive: true }); // Garante que a pasta exista
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Nome único temporário
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Exporta o uploader padrão (para o headcount.routes.ts, se ele usar)
export const uploadDefault = multer({ storage: defaultStorage });


// --- 2. CONFIGURAÇÃO NOVA (Para PDFs de Descrição de Cargo) ---
// Esta configuração salva o ficheiro na pasta 'uploads/jd_pdfs/'
// com o nome baseado no 'cod_funcao' (ex: FIN-JR.pdf)

const jdStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/jd_pdfs/';
    fs.mkdirSync(uploadPath, { recursive: true }); // Garante que a pasta exista
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // O nome do ficheiro será o 'cod_funcao' vindo da URL + .pdf
    // Ex: /api/jd/upload/FIN-JR -> o ficheiro será FIN-JR.pdf
    const codFuncao = req.params.cod_funcao;
    const fileExt = path.extname(file.originalname); // .pdf
    
    if (codFuncao) {
      cb(null, `${codFuncao.toUpperCase()}${fileExt}`); // Garante maiúsculas
    } else {
      cb(new Error('cod_funcao não fornecido na URL'), '');
    }
  }
});

// Filtro de ficheiro (só aceita PDF)
const pdfFileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Tipo de ficheiro inválido. Apenas PDFs são permitidos.'), false);
  }
};

// Exporta o novo uploader (nomeado)
export const uploadJDPdf = multer({ 
  storage: jdStorage,
  fileFilter: pdfFileFilter
});

// --- 3. EXPORTAÇÃO PADRÃO ---
// Mantemos uma exportação padrão (default) para compatibilidade com o 
// seu 'headcount.routes.ts' existente.
export default uploadDefault;