import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Check,
  Globe,
  Lock,
  Edit3,
  UserPlus,
  X,
  Shield,
  Eye,
  Send,
  Clock,
  Trash2,
  ChevronDown
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { AccessRole } from '@/types';

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemType: 'note' | 'notebook';
  itemId: string;
  itemName: string;
}

interface Member {
  id: number;
  user?: {
    id: number;
    username: string;
    email: string;
    name: string;
  };
  email?: string;
  role: AccessRole;
  added_at: string;
  status?: 'active' | 'pending';
  type?: 'member' | 'invitation';
}

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const API_URL = `http://${window.location.hostname}:8000/api`;

export function ShareModal({ open, onOpenChange, itemType, itemId, itemName }: ShareModalProps) {
  const { token, user } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AccessRole>('viewer');
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!token || !itemId) return;
    setLoadingMembers(true);
    try {
      const response = await fetch(`${API_URL}/share/members/?target_type=${itemType}&target_id=${itemId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoadingMembers(false);
    }
  }, [token, itemType, itemId]);

  useEffect(() => {
    if (open) {
      fetchMembers();
      setEmail('');
      setRole('viewer');
    }
  }, [open, fetchMembers]);

  const handleInvite = async () => {
    if (!email.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/share/invite/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          target_type: itemType,
          target_id: itemId,
          role,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao enviar convite');
      }

      toast({
        title: "Convite enviado",
        description: `Um email foi enviado para ${email}`,
      });
      setEmail('');
      fetchMembers();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar o convite.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (invitationId: number) => {
    try {
      const response = await fetch(`${API_URL}/share/resend/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invitation_id: invitationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao reenviar convite');
      }

      toast({
        title: "Convite reenviado",
        description: "O email de convite foi enviado novamente.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível reenviar o convite.",
        variant: "destructive",
      });
    }
  };

  const handleRevokeInvite = async (invitationId: number) => {
    try {
      const response = await fetch(`${API_URL}/share/revoke_invite/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invitation_id: invitationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao cancelar convite');
      }

      toast({
        title: "Convite cancelado",
        description: "O convite foi removido com sucesso.",
      });
      fetchMembers();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível cancelar o convite.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateRole = async (memberId: number, newRole: AccessRole) => {
    try {
      const response = await fetch(`${API_URL}/share/update_role/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_type: itemType,
          target_id: itemId,
          member_id: memberId,
          role: newRole,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar permissão');
      }

      toast({
        title: "Permissão atualizada",
        description: "A permissão do usuário foi alterada com sucesso.",
      });
      fetchMembers();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a permissão.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    try {
      const response = await fetch(`${API_URL}/share/remove_member/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_type: itemType,
          target_id: itemId,
          member_id: memberId,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao remover membro');
      }

      toast({
        title: "Acesso removido",
        description: "O usuário não tem mais acesso a este item.",
      });
      fetchMembers();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover o acesso.",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
      case 'full_access':
        return <Shield className="w-4 h-4" />;
      case 'editor':
        return <Edit3 className="w-4 h-4" />;
      case 'viewer':
        return <Eye className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Proprietário';
      case 'full_access':
        return 'Acesso total';
      case 'editor':
        return 'Pode editar';
      case 'viewer':
        return 'Pode visualizar';
      default:
        return role;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Compartilhar {itemType === 'note' ? 'Nota' : 'Caderno'}
          </DialogTitle>
          <DialogDescription className="truncate">
            Compartilhe "{itemName}" com outras pessoas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Adicionar nome ou e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex justify-between items-center gap-2 flex-wrap sm:flex-nowrap">
                <Select value={role} onValueChange={(v) => setRole(v as AccessRole)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_access">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        <span>Acesso total</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="editor">
                      <div className="flex items-center gap-2">
                        <Edit3 className="w-4 h-4" />
                        <span>Pode editar</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="viewer">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        <span>Pode visualizar</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={handleInvite} disabled={loading || !email} className="w-full sm:w-auto">
                  {loading ? 'Enviando...' : 'Enviar convite'}
                </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <Label>Pessoas com acesso</Label>
            <div className="space-y-3">
              {/* Owner (Simulated for now if not in list, usually owner is implied) */}
              
              {members.map((member) => (
                <div key={`${member.type || 'member'}-${member.id}`} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback>
                        {member.user?.name?.[0] || member.user?.username?.[0] || member.email?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 w-full">
                        <p className="text-sm font-medium truncate">
                          {member.user?.name || member.user?.username || member.email}
                        </p>
                        {member.status === 'pending' && (
                          <span className="shrink-0 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Pendente
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{member.user?.email || member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {member.status === 'pending' ? (
                      <>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground px-2" title={getRoleLabel(member.role)}>
                          {getRoleIcon(member.role)}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleResend(member.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                          title="Reenviar convite"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRevokeInvite(member.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-red-500 shrink-0"
                          title="Cancelar convite"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      // Active Member
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 gap-2 px-2 font-normal text-muted-foreground hover:text-foreground">
                            {getRoleIcon(member.role)}
                            <span className="hidden md:inline text-xs">{getRoleLabel(member.role)}</span>
                            <ChevronDown className="w-3 h-3 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleUpdateRole(member.id, 'full_access')}>
                            <Shield className="w-4 h-4 mr-2" />
                            Acesso total
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateRole(member.id, 'editor')}>
                            <Edit3 className="w-4 h-4 mr-2" />
                            Pode editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateRole(member.id, 'viewer')}>
                            <Eye className="w-4 h-4 mr-2" />
                            Pode visualizar
                          </DropdownMenuItem>
                          <Separator className="my-1" />
                          <DropdownMenuItem 
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remover acesso
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
              
              {members.length === 0 && !loadingMembers && (
                <div className="text-sm text-muted-foreground text-center py-2">
                  Apenas você tem acesso.
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
