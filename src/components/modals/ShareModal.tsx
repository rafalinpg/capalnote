import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Link,
  Copy,
  Check,
  Globe,
  Lock,
  Users,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemType: 'note' | 'notebook';
  itemName: string;
}

export function ShareModal({ open, onOpenChange, itemType, itemName }: ShareModalProps) {
  const [linkEnabled, setLinkEnabled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [permission, setPermission] = useState<'viewer' | 'editor'>('viewer');
  const [expiresAt, setExpiresAt] = useState<string>('');

  const shareLink = 'https://notas.empresa.com/s/abc123xyz';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Compartilhar {itemType === 'note' ? 'Nota' : 'Caderno'}
          </DialogTitle>
          <DialogDescription>
            Compartilhe "{itemName}" com outros colaboradores
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Link Sharing */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                  <Link className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">Link de compartilhamento</p>
                  <p className="text-xs text-muted-foreground">
                    Qualquer pessoa com o link pode acessar
                  </p>
                </div>
              </div>
              <Switch checked={linkEnabled} onCheckedChange={setLinkEnabled} />
            </div>

            {linkEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 pl-13"
              >
                <div className="flex gap-2">
                  <Input
                    value={shareLink}
                    readOnly
                    className="bg-muted text-sm font-mono"
                  />
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleCopy}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Permissão</Label>
                    <Select value={permission} onValueChange={(v: 'viewer' | 'editor') => setPermission(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            Visualizar
                          </div>
                        </SelectItem>
                        <SelectItem value="editor">
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            Editar
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Expira em</Label>
                    <Select value={expiresAt} onValueChange={setExpiresAt}>
                      <SelectTrigger>
                        <SelectValue placeholder="Nunca" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nunca</SelectItem>
                        <SelectItem value="1d">1 dia</SelectItem>
                        <SelectItem value="7d">7 dias</SelectItem>
                        <SelectItem value="30d">30 dias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <Separator />

          {/* Direct Sharing */}
          <div className="space-y-4">
            <Label>Convidar colaboradores</Label>
            <div className="flex gap-2">
              <Input placeholder="Digite o email do colaborador" className="flex-1" />
              <Button variant="secondary">Convidar</Button>
            </div>

            <div className="text-sm text-muted-foreground text-center py-4">
              Nenhum colaborador adicionado ainda
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Concluir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
