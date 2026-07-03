import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ShieldCheck, NotebookText, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

const backgroundColors = {
  start: '#004e1b',
  middle: '#55745fff',
  end: '#ffffffff',
  glowPrimary: '#f9b200',
  glowSecondary: '#b1c800',
  whiteOverlay: '#ffffff',
  text: '#ffffff',
  notesIcon: '#f9b200',
  securityIcon: '#b1c800',
  institutionalIcon: '#20c1f3',
};

const formColors = {
  pageBackground: '#f3f3f3ff',
  cardBackground: '#ffffff',
  softSurface: '#fbfcf8',
  softBorder: '#d6dfc2',
  softBorderStrong: '#e7edd8',
  title: '#004e1b',
  mutedText: '#537051',
  mutedIcon: '#6f8763',
  badgeBackground: '#eef5df',
  badgeText: '#39791f',
  inputRing: '#0070b8',
  buttonStart: '#b1c800',
  buttonMiddle: '#39791f',
  buttonEnd: '#004e1b',
};

const hexToRgba = (hex: string, alpha = 1) => {
  const normalized = hex.replace('#', '');
  const expanded = normalized.length === 3 || normalized.length === 4
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;

  let r = 255;
  let g = 255;
  let b = 255;
  let embeddedAlpha = 1;

  if (expanded.length === 6 || expanded.length === 8) {
    r = Number.parseInt(expanded.slice(0, 2), 16);
    g = Number.parseInt(expanded.slice(2, 4), 16);
    b = Number.parseInt(expanded.slice(4, 6), 16);

    if (expanded.length === 8) {
      embeddedAlpha = Number.parseInt(expanded.slice(6, 8), 16) / 255;
    }
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha * embeddedAlpha})`;
};

const brandTheme = {
  page: {
    background: formColors.pageBackground,
  },
  hero: {
    gradient: `linear-gradient(140deg, ${hexToRgba(backgroundColors.start, 0.9)} 0%, ${hexToRgba(backgroundColors.middle, 0.82)} 42%, ${hexToRgba(backgroundColors.end, 0.72)} 100%)`,
    glow: `radial-gradient(circle_at_top_left, ${hexToRgba(backgroundColors.glowPrimary, 0.14)}, transparent 34%), radial-gradient(circle_at_bottom_right, ${hexToRgba(backgroundColors.glowSecondary, 0.1)}, transparent 30%)`,
    bubbleBorder: hexToRgba(backgroundColors.whiteOverlay, 0.05),
    bubbleBackground: hexToRgba(backgroundColors.whiteOverlay, 0.03),
    chipBorder: hexToRgba(backgroundColors.whiteOverlay, 0.2),
    chipBackground: hexToRgba(backgroundColors.whiteOverlay, 0.1),
    chipText: hexToRgba(backgroundColors.whiteOverlay, 0.9),
    heading: backgroundColors.text,
    body: hexToRgba(backgroundColors.text, 0.8),
    featureBorder: hexToRgba(backgroundColors.whiteOverlay, 0.15),
    featureBackground: hexToRgba(backgroundColors.whiteOverlay, 0.1),
    iconNotes: backgroundColors.notesIcon,
    iconSecurity: backgroundColors.securityIcon,
    iconInstitutional: backgroundColors.institutionalIcon,
  },
  card: {
    background: formColors.cardBackground,
    border: formColors.softBorder,
    divider: formColors.softBorderStrong,
    shadow: `0 24px 60px ${hexToRgba(formColors.title, 0.1)}`,
    mobileShadow: `0 24px 60px ${hexToRgba(formColors.title, 0.08)}`,
    badgeBackground: formColors.badgeBackground,
    badgeText: formColors.badgeText,
    title: formColors.title,
    text: formColors.mutedText,
    inputBorder: formColors.softBorder,
    inputBackground: formColors.softSurface,
    inputRing: formColors.inputRing,
    icon: formColors.mutedIcon,
    iconHover: formColors.title,
    buttonShadow: `0 16px 30px ${hexToRgba(formColors.buttonMiddle, 0.25)}`,
    buttonGradient: `linear-gradient(135deg, ${formColors.buttonStart} 0%, ${formColors.buttonMiddle} 58%, ${formColors.buttonEnd} 100%)`,
  },
};

const Login = ({ onLogin }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const inviteToken = searchParams.get('token');

  useEffect(() => {
    const stateReason = (location.state as { reason?: string } | null)?.reason;
    const storedReason = sessionStorage.getItem("auth_reason");
    const reason = stateReason || storedReason;

    if (reason === "expired") {
      toast({
        title: "Sessão expirada",
        description: "Faça login novamente para continuar.",
        variant: "destructive",
      });
      sessionStorage.removeItem("auth_reason");
      navigate(location.pathname + location.search, { replace: true, state: null });
    }
  }, [location.pathname, location.search, location.state, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await onLogin(email, password);

    if (result.success) {
      toast({
        title: 'Bem-vindo ao CapalNote!',
        description: 'Login realizado com sucesso.',
      });
      
      if (inviteToken) {
        navigate(`/?token=${inviteToken}`);
      } else {
        navigate('/');
      }
    } else {
      toast({
        title: 'Erro no login',
        description: result.error,
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: brandTheme.page.background }}>
      <div
        className="hidden lg:flex lg:w-[54%] relative overflow-hidden text-white"
        style={{ background: brandTheme.hero.gradient }}
      >
        <div className="absolute inset-0" style={{ background: brandTheme.hero.glow }} />
        <div
          className="absolute bottom-16 left-10 h-56 w-56 rounded-full border blur-3xl"
          style={{
            borderColor: brandTheme.hero.bubbleBorder,
            backgroundColor: brandTheme.hero.bubbleBackground,
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 flex h-full w-full flex-col justify-between p-14"
        >
          <div className="max-w-xl">
            <img
              src="/capal-logo.png"
              alt="Capal"
              className="mb-8 w-full max-w-[280px] object-contain"
            />
            <span
              className="mb-4 inline-flex rounded-full border px-4 py-1.5 text-sm font-medium tracking-wide"
              style={{
                borderColor: brandTheme.hero.chipBorder,
                backgroundColor: brandTheme.hero.chipBackground,
                color: brandTheme.hero.chipText,
              }}
            >
              Ambiente corporativo seguro
            </span>
            <h1 className="mb-5 max-w-lg text-5xl font-bold leading-tight" style={{ color: brandTheme.hero.heading }}>
              Gerenciamento de Notas.
            </h1>
            <p className="max-w-lg text-lg leading-8" style={{ color: brandTheme.hero.body }}>
              Lembre-se de tudo e encare qualquer projeto com suas notas, tarefas e agenda, tudo em um só lugar.
            </p>
          </div>
        
        </motion.div>
      </div>

      <div className="w-full lg:w-[46%] flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div
            className="lg:hidden mb-8 rounded-3xl border p-5"
            style={{
              borderColor: brandTheme.card.border,
              backgroundColor: brandTheme.card.background,
              boxShadow: brandTheme.card.mobileShadow,
            }}
          >
            <img
              src="/capal-logo.png"
              alt="Capal"
              className="w-full max-w-[280px] object-contain"
            />
          </div>

          <div
            className="rounded-[28px] border p-8 sm:p-10"
            style={{
              borderColor: brandTheme.card.border,
              backgroundColor: brandTheme.card.background,
              boxShadow: brandTheme.card.shadow,
            }}
          >
            <div className="mb-8">
              <div
                className="mb-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
                style={{
                  backgroundColor: brandTheme.card.badgeBackground,
                  color: brandTheme.card.badgeText,
                }}
              >
                CapalNote
              </div>
              <h2 className="mb-2 text-3xl font-semibold" style={{ color: brandTheme.card.title }}>
                Entrar
              </h2>
              <p style={{ color: brandTheme.card.text }}>
                Acesse sua conta para continuar no ambiente corporativo.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" style={{ color: brandTheme.card.title }}>Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12"
                  style={{
                    borderColor: brandTheme.card.inputBorder,
                    backgroundColor: brandTheme.card.inputBackground,
                    ['--tw-ring-color' as string]: brandTheme.card.inputRing,
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" style={{ color: brandTheme.card.title }}>Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 pr-12"
                    style={{
                      borderColor: brandTheme.card.inputBorder,
                      backgroundColor: brandTheme.card.inputBackground,
                      ['--tw-ring-color' as string]: brandTheme.card.inputRing,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: brandTheme.card.icon }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = brandTheme.card.iconHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = brandTheme.card.icon;
                    }}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="h-12 w-full text-base font-medium text-white hover:opacity-95"
                style={{
                  background: brandTheme.card.buttonGradient,
                  boxShadow: brandTheme.card.buttonShadow,
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <div
              className="mt-8 border-t pt-6 text-sm"
              style={{
                borderColor: brandTheme.card.divider,
                color: brandTheme.card.text,
              }}
            >
              Plataforma institucional de anotações e compartilhamento interno.
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
