# CapalNote

CapalNote é uma aplicação de gerenciamento de notas e cadernos para a Cooperativa Capal.

## Funcionalidades

- Criação e edição de notas com texto rico
- Organização em cadernos
- Sistema de etiquetas (tags)
- Compartilhamento de notas e cadernos
- Suporte a anexos
- Modo escuro

## Tecnologias Utilizadas

- **Frontend**:
  - React
  - TypeScript
  - Vite
  - Tailwind CSS
  - shadcn/ui
  - Tiptap (Editor de texto)

- **Backend**:
  - Django
  - Django REST Framework
  - PostgreSQL (Produção) / SQLite (Opcional em Dev)

## Instalação e Deploy

### Pré-requisitos Gerais

- Node.js (v18+)
- Python (v3.10+)
- PostgreSQL (Recomendado para produção)

### Configuração de Variáveis de Ambiente

Para produção, é **obrigatório** criar um arquivo `.env` na pasta `backend/` (no mesmo nível do `manage.py`).

Exemplo de conteúdo para o arquivo `.env`:

```ini
# Segurança
DEBUG=False
SECRET_KEY=sua-chave-secreta-gerada-aleatoriamente
ALLOWED_HOSTS=seu-dominio.com,192.168.0.214,localhost

# Banco de Dados
DB_NAME=capalnote
DB_USER=capalnote_user
DB_PASSWORD=sua_senha_segura
DB_HOST=localhost
DB_PORT=5432

# Email (opcional, para convites)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=seu_email@gmail.com
EMAIL_HOST_PASSWORD=sua_senha_de_app

# CORS (Frontend)
CORS_ALLOWED_ORIGINS=http://seu-dominio.com,http://localhost:8081
```

> **Nota:** Nunca comite o arquivo `.env` no Git. Ele contém senhas e chaves de segurança.

---

### 🐧 Instalação em Servidor Linux (Ubuntu/Debian)

#### 1. Configurar Banco de Dados (PostgreSQL)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo -u postgres psql
```
No prompt do PostgreSQL:
```sql
CREATE DATABASE capalnote;
CREATE USER capalnote_user WITH PASSWORD 'sua_senha_segura';
ALTER ROLE capalnote_user SET client_encoding TO 'utf8';
ALTER ROLE capalnote_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE capalnote_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE capalnote TO capalnote_user;
\q
```

#### 2. Backend (Django + Gunicorn)
1. Instale dependências do sistema:
   ```bash
   sudo apt install python3-venv python3-dev libpq-dev nginx curl
   ```

2. Clone o repositório e configure o backend:
   ```bash
   # Exemplo: /var/www/capalnote
   cd /var/www/capalnote/backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. Aplique as migrações:
   ```bash
   python manage.py migrate
   python manage.py collectstatic
   ```

4. Execute com Gunicorn (ou configure um serviço Systemd):
   ```bash
   gunicorn --bind 0.0.0.0:8000 core.wsgi
   ```

#### 3. Frontend (Build + Nginx)
1. Instale dependências e faça o build:
   ```bash
   cd ../
   npm install
   npm run build
   ```
   O build será gerado na pasta `dist`.

2. Configure o Nginx (exemplo básico em `/etc/nginx/sites-available/capalnote`):
   ```nginx
   server {
       listen 80;
       server_name seu_dominio_ou_ip;

       location / {
           root /var/www/capalnote/dist;
           try_files $uri $uri/ /index.html;
       }

       location /api/ {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```
3. Ative o site e reinicie o Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/capalnote /etc/nginx/sites-enabled
   sudo systemctl restart nginx
   ```

---

### 🪟 Instalação em Servidor Windows

#### 1. Backend
1. Instale o Python e PostgreSQL para Windows.
2. Crie o banco de dados via pgAdmin.
3. No PowerShell (como Administrador):
   ```powershell
   cd backend
   python -m venv venv
   .\venv\Scripts\Activate
   pip install -r requirements.txt
   python manage.py migrate
   ```
4. Para rodar em produção no Windows, utilize o **Waitress**:
   ```powershell
   waitress-serve --listen=*:8000 core.wsgi:application
   ```

#### 2. Frontend
1. Instale o Node.js.
2. Na raiz do projeto:
   ```powershell
   npm install
   npm run build
   ```
3. Para servir a pasta `dist`, você pode usar o **IIS** ou o pacote `serve`:
   ```powershell
   npm install -g serve
   serve -s dist -l 8081
   ```

---

### 🛠️ Desenvolvimento Local

1. **Backend**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   .\venv\Scripts\activate   # Windows
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver
   ```

2. **Frontend**:
   ```bash
   npm install
   npm run dev
   ```
   Acesse: `http://localhost:8081`
