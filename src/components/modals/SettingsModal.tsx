import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail, User } from "lucide-react";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    name: string;
    email: string;
  } | null;
  onUpdateUser: (data: any) => void;
}

import { API_URL } from '@/lib/api';

export function SettingsModal({ open, onOpenChange, user, onUpdateUser }: SettingsModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("security");
  
  // Form states
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      setName(user.name);
      setEmail(user.email);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [open, user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }

      const response = await fetch(`${API_URL}/me/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.detail || 'Falha ao atualizar perfil');
      }

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });
      
      onUpdateUser(data);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
        toast({
          title: "Erro",
          description: "A nova senha deve ter pelo menos 6 caracteres.",
          variant: "destructive",
        });
        return;
    }

    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('access_token');

      if (!token) {
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }

      const response = await fetch(`${API_URL}/me/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.detail || 'Falha ao atualizar senha');
      }

      toast({
        title: "Senha atualizada",
        description: "Sua senha foi alterada com sucesso.",
      });
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl h-[500px] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>Configurações</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-1 overflow-hidden">
          <Tabs 
            defaultValue="security" 
            value={activeTab} 
            onValueChange={setActiveTab}
            orientation="vertical" 
            className="flex w-full h-full"
          >
            <div className="w-64 border-r bg-muted/10 p-4 shrink-0">
              <TabsList className="flex flex-col h-auto bg-transparent gap-1 p-0">
                <TabsTrigger 
                  value="security"
                  className="w-full justify-start gap-2 px-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                >
                  <Lock className="w-4 h-4" />
                  Login e segurança
                </TabsTrigger>
                {/* Future tabs can be added here */}
              </TabsList>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <TabsContent value="security" className="m-0 space-y-8">
                {/* Profile Section */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Perfil</h3>
                    <p className="text-sm text-muted-foreground">
                      Atualize suas informações pessoais.
                    </p>
                  </div>
                  
                  <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-sm">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome</Label>
                      <Input 
                        id="name" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        placeholder="Seu nome"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        placeholder="seu@email.com"
                      />
                      <p className="text-xs text-muted-foreground">
                        Nota: Alterar seu email não afetará seus compartilhamentos existentes.
                      </p>
                    </div>
                    
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </form>
                </div>
                
                <div className="h-px bg-border" />
                
                {/* Password Section */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Senha</h3>
                    <p className="text-sm text-muted-foreground">
                      Altere sua senha de acesso.
                    </p>
                  </div>
                  
                  <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-sm">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Senha Atual</Label>
                      <Input 
                        id="current-password" 
                        type="password" 
                        value={currentPassword} 
                        onChange={(e) => setCurrentPassword(e.target.value)} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new-password">Nova Senha</Label>
                      <Input 
                        id="new-password" 
                        type="password" 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                      <Input 
                        id="confirm-password" 
                        type="password" 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                      />
                    </div>
                    
                    <Button type="submit" variant="secondary" disabled={isLoading || !currentPassword || !newPassword}>
                      {isLoading ? 'Salvando...' : 'Alterar Senha'}
                    </Button>
                  </form>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}