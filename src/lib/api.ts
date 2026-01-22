export const getApiUrl = () => {
  // Em produção, usamos URL relativa para aproveitar o proxy reverso (Nginx)
  // Isso evita problemas de CORS e Mixed Content (HTTP/HTTPS)
  if (import.meta.env.PROD) {
    return '/api';
  }
  
  // Se estivermos rodando em HTTPS (ex: via túnel ou proxy reverso em homologação),
  // devemos usar URL relativa para evitar Mixed Content
  if (window.location.protocol === 'https:') {
    return '/api';
  }
  
  // Em desenvolvimento local (HTTP), assumimos que o backend está rodando na porta 8000
  return `http://${window.location.hostname}:8000/api`;
};

export const API_URL = getApiUrl();
