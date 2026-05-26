import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://gestao-deposito.onrender.com'
});

// Intercepta todas as requisições antes de saírem para o Node.js
api.interceptors.request.use((config) => {
  // Busca o token salvo no navegador do usuário
  const token = localStorage.getItem('@Deposito:token');
  
  if (token) {
    // Se existir, coloca o crachá na requisição
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});