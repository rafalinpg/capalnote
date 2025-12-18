export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Notebook {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  isArchived: boolean;
  noteCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Attachment {
  id: string;
  noteId: string;
  type: 'image' | 'audio' | 'file' | 'sketch';
  fileUrl: string;
  fileName: string;
  sizeBytes: number;
  mimeType: string;
  createdAt: Date;
}

export interface Comment {
  id: string;
  noteId: string;
  authorId: string;
  author?: User;
  body: string;
  mentions: { userId: string }[];
  createdAt: Date;
}

export interface Note {
  id: string;
  notebookId: string;
  notebook?: Notebook;
  title: string;
  contentRich: string;
  contentText: string;
  isPinned: boolean;
  isArchived: boolean;
  isTrashed: boolean;
  authorId: string;
  author?: User;
  lastEditedBy?: string;
  tags: Tag[];
  attachments: Attachment[];
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteVersion {
  id: string;
  noteId: string;
  versionNo: number;
  title: string;
  contentRich: string;
  contentText: string;
  diffMeta?: Record<string, unknown>;
  createdAt: Date;
  authorId: string;
}

export interface ShareLink {
  id: string;
  targetType: 'note' | 'notebook';
  targetId: string;
  role: 'viewer' | 'editor';
  token: string;
  expiresAt?: Date;
  createdBy: string;
}

export interface NotebookMember {
  id: string;
  notebookId: string;
  userId: string;
  user?: User;
  role: 'owner' | 'editor' | 'viewer';
  addedAt: Date;
}
