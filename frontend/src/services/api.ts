import axios from 'axios';

// 1. Cria a instância do "mensageiro"
export const api = axios.create({
  // 2. Define a URL base (nosso backend)
  baseURL: 'http://localhost:3001/api' 
});

// 3. (Opcional, mas MUITO recomendado)
// Isso é um "Interceptor". Ele vai "interceptar" CADA requisição
// que sair do frontend e adicionar o token de login automaticamente.
api.interceptors.request.use(async (config) => {
  // Pega o token do localStorage (onde vamos salvá-lo)
  const token = localStorage.getItem('@HeadcountApp:token');

  if (token) {
    // Se o token existir, adiciona-o ao cabeçalho 'Authorization'
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});