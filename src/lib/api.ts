export const getApiUrl = () => {
  // Em produção, usamos URL relativa para aproveitar o proxy reverso (Nginx)
  // Isso evita problemas de CORS e Mixed Content (HTTP/HTTPS)
  if (import.meta.env.PROD) {
    return '/api';
  }
  
  // Em desenvolvimento, assumimos que o backend está rodando na porta 8000
  return `http://${window.location.hostname}:8000/api`;
};

export const API_URL = getApiUrl();
