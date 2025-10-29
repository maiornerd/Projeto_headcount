// Conteúdo para: src/config/multer.config.ts

import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

// Define o local de armazenamento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 'uploads/' é a pasta na raiz do backend onde os arquivos ficarão
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Gera um nome de arquivo aleatório + nome original
    crypto.randomBytes(16, (err, hash) => {
      if (err) cb(err, file.originalname);

      const fileName = `${hash.toString('hex')}-${file.originalname}`;
      cb(null, fileName);
    });
  }
});

// Filtro de arquivos: Aceitar apenas Excel e CSV
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'text/csv' // .csv
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo inválido. Apenas Excel (.xls, .xlsx) ou .csv são permitidos.'));
  }
};

// Exporta a configuração do Multer
export const uploadConfig = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 10 // Limite de 10MB por arquivo
  },
  fileFilter: fileFilter
});