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
  - SQLite (Desenvolvimento)

## Como rodar o projeto

### Pré-requisitos

- Node.js (v18+)
- Python (v3.10+)

### Backend

1. Navegue até a pasta `backend`:
   ```sh
   cd backend
   ```

2. Crie um ambiente virtual e ative-o:
   ```sh
   python -m venv venv
   # Windows
   .\venv\Scripts\activate
   # Linux/Mac
   source venv/bin/activate
   ```

3. Instale as dependências:
   ```sh
   pip install -r requirements.txt
   ```

4. Execute as migrações:
   ```sh
   python manage.py migrate
   ```

5. Inicie o servidor:
   ```sh
   python manage.py runserver
   ```

### Frontend

1. Navegue até a raiz do projeto:
   ```sh
   cd ..
   ```

2. Instale as dependências:
   ```sh
   npm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```sh
   npm run dev
   ```

A aplicação estará disponível em `http://localhost:8080`.
