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

export const getMediaUrl = (url: string) => {
  if (!url) return '';
  
  try {
    // Tenta fazer o parse da URL (se for absoluta, ex: http://127.0.0.1:8000/media/...)
    const parsedUrl = new URL(url);
    
    // Em produção ou HTTPS, usamos apenas o pathname (ex: /media/attachments/...)
    // para aproveitar o proxy reverso e evitar erros de rota interna do servidor
    if (import.meta.env.PROD || window.location.protocol === 'https:') {
      return parsedUrl.pathname;
    }
    
    // Em dev local, força o uso do hostname atual na porta 8000
    return `http://${window.location.hostname}:8000${parsedUrl.pathname}`;
  } catch (e) {
    // Se falhar o parse (ex: url já é relativa '/media/...')
    if (import.meta.env.PROD || window.location.protocol === 'https:') {
      return url.startsWith('/') ? url : `/${url}`;
    }
    
    return `http://${window.location.hostname}:8000${url.startsWith('/') ? url : `/${url}`}`;
  }
};

export const processHtmlMediaUrls = (html: string) => {
  if (!html) return html;
  
  // Corrige URLs de mídia dentro de tags src="..." no conteúdo HTML salvo
  if (import.meta.env.PROD || window.location.protocol === 'https:') {
    // Substitui qualquer http://.../media/ ou /media/ por apenas /media/
    return html.replace(/src=["'](?:https?:\/\/[^/]+)?(\/media\/[^"']+)["']/g, 'src="$1"');
  } else {
    // Em dev local, garante que aponta para o backend
    const baseUrl = `http://${window.location.hostname}:8000`;
    return html.replace(/src=["'](?:https?:\/\/[^/]+)?(\/media\/[^"']+)["']/g, `src="${baseUrl}$1"`);
  }
};
