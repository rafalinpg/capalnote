import { User, Notebook, Tag, Note } from '@/types';

export const currentUser: User = {
  id: '1',
  name: 'Ana Silva',
  email: 'ana.silva@empresa.com',
  avatar: undefined,
};

export const mockTags: Tag[] = [
  { id: '1', name: 'Urgente', color: '#ef4444' },
  { id: '2', name: 'Projeto Alpha', color: '#f59e0b' },
  { id: '3', name: 'Reunião', color: '#3b82f6' },
  { id: '4', name: 'Ideias', color: '#8b5cf6' },
  { id: '5', name: 'Revisão', color: '#10b981' },
];

export const mockNotebooks: Notebook[] = [
  {
    id: '1',
    name: 'Projetos 2024',
    description: 'Anotações sobre projetos do ano',
    ownerId: '1',
    isArchived: false,
    noteCount: 12,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-12-15'),
  },
  {
    id: '2',
    name: 'Reuniões',
    description: 'Atas e pautas de reuniões',
    ownerId: '1',
    isArchived: false,
    noteCount: 28,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-12-18'),
  },
  {
    id: '3',
    name: 'Pessoal',
    description: 'Notas pessoais e lembretes',
    ownerId: '1',
    isArchived: false,
    noteCount: 5,
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-12-10'),
  },
  {
    id: '4',
    name: 'Arquivo 2023',
    description: 'Notas arquivadas do ano anterior',
    ownerId: '1',
    isArchived: true,
    noteCount: 45,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-12-31'),
  },
];

export const mockNotes: Note[] = [
  {
    id: '1',
    notebookId: '1',
    title: 'Planejamento Q1 2025',
    contentRich: `# Planejamento Q1 2025

## Objetivos Principais
- Lançar nova versão do produto
- Expandir equipe de desenvolvimento
- Melhorar métricas de satisfação do cliente

## Cronograma
| Mês | Atividade |
|-----|-----------|
| Janeiro | Definição de escopo |
| Fevereiro | Desenvolvimento |
| Março | Testes e lançamento |

## Próximos Passos
1. Reunir equipe para kickoff
2. Definir OKRs trimestrais
3. Alocar recursos necessários`,
    contentText: 'Planejamento Q1 2025. Objetivos Principais: Lançar nova versão do produto...',
    isPinned: true,
    isArchived: false,
    authorId: '1',
    tags: [mockTags[1], mockTags[3]],
    attachments: [],
    comments: [],
    createdAt: new Date('2024-12-10'),
    updatedAt: new Date('2024-12-18'),
  },
  {
    id: '2',
    notebookId: '2',
    title: 'Reunião de Alinhamento - 15/12',
    contentRich: `# Reunião de Alinhamento

**Data:** 15 de Dezembro de 2024
**Participantes:** @ana.silva, @joao.santos, @maria.costa

## Pauta
- Status do projeto Alpha
- Bloqueios identificados
- Próximas entregas

## Decisões
- Priorizar feature de exportação
- Adiar integração com sistema legado

## Action Items
- [ ] Ana: Revisar documentação técnica
- [ ] João: Estimar nova feature
- [ ] Maria: Agendar demo com cliente`,
    contentText: 'Reunião de Alinhamento. Data: 15 de Dezembro de 2024...',
    isPinned: true,
    isArchived: false,
    authorId: '1',
    tags: [mockTags[2], mockTags[1]],
    attachments: [],
    comments: [],
    createdAt: new Date('2024-12-15'),
    updatedAt: new Date('2024-12-15'),
  },
  {
    id: '3',
    notebookId: '1',
    title: 'Ideias para MVP',
    contentRich: `# Ideias para MVP

## Conceito Principal
Simplificar o fluxo de trabalho do usuário final através de automação inteligente.

## Features Essenciais
- Dashboard personalizável
- Notificações em tempo real
- Integração com ferramentas existentes

## Diferencial
> "A simplicidade é a sofisticação final" - Leonardo da Vinci

Focar em UX excepcional com mínimo de cliques.`,
    contentText: 'Ideias para MVP. Conceito Principal: Simplificar o fluxo...',
    isPinned: false,
    isArchived: false,
    authorId: '1',
    tags: [mockTags[3]],
    attachments: [],
    comments: [],
    createdAt: new Date('2024-12-05'),
    updatedAt: new Date('2024-12-12'),
  },
  {
    id: '4',
    notebookId: '3',
    title: 'Lista de Leitura',
    contentRich: `# Lista de Leitura 📚

## Em Andamento
- **"Thinking, Fast and Slow"** - Daniel Kahneman
  - Capítulo 12

## Próximos
- "The Design of Everyday Things" - Don Norman
- "Inspired" - Marty Cagan

## Concluídos
- ~~"Atomic Habits" - James Clear~~ ✓
- ~~"Deep Work" - Cal Newport~~ ✓`,
    contentText: 'Lista de Leitura. Em Andamento: Thinking, Fast and Slow...',
    isPinned: false,
    isArchived: false,
    authorId: '1',
    tags: [],
    attachments: [],
    comments: [],
    createdAt: new Date('2024-11-20'),
    updatedAt: new Date('2024-12-08'),
  },
  {
    id: '5',
    notebookId: '2',
    title: 'Sprint Review - Dezembro',
    contentRich: `# Sprint Review - Dezembro

## Entregas
- ✅ Sistema de autenticação
- ✅ Dashboard principal
- ⚠️ Relatórios (parcial)

## Métricas
- **Velocity:** 42 pontos
- **Bugs resolvidos:** 8
- **Cobertura de testes:** 78%

## Feedback
O time demonstrou boa performance apesar dos desafios técnicos enfrentados.`,
    contentText: 'Sprint Review - Dezembro. Entregas: Sistema de autenticação...',
    isPinned: false,
    isArchived: false,
    authorId: '1',
    tags: [mockTags[2], mockTags[4]],
    attachments: [],
    comments: [],
    createdAt: new Date('2024-12-16'),
    updatedAt: new Date('2024-12-17'),
  },
];
