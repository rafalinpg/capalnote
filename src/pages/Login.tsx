import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

const backgroundColors = {
  start: '#004e1b',
  middle: '#9ab18f',
  end: '#ffffff',
  glowPrimary: '#f9b200',
  glowSecondary: '#b1c800',
  whiteOverlay: '#ffffff',
  text: '#ffffff',
  shellGlow: '#0070b8',
};

const formColors = {
  pageBackground: '#eef1eb',
  cardBackground: 'rgba(255, 255, 255, 0.94)',
  panelBackground: 'rgba(255, 255, 255, 0.78)',
  softSurface: 'rgba(255, 255, 255, 0.95)',
  softBorder: 'rgba(57, 121, 31, 0.18)',
  softBorderStrong: 'rgba(57, 121, 31, 0.20)',
  title: '#004e1b',
  mutedText: '#66756a',
  mutedIcon: '#66756a',
  badgeText: '#39791f',
  inputRing: '#0070b8',
  buttonStart: '#39791f',
  buttonMiddle: '#176d2a',
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
    shellGlow: `radial-gradient(circle at left top, ${hexToRgba(backgroundColors.shellGlow, 0.18)}, transparent 28%), radial-gradient(circle at right bottom, ${hexToRgba(backgroundColors.glowSecondary, 0.20)}, transparent 32%), linear-gradient(140deg, #edf1e8 0%, #f8faf7 48%, #eef5ee 100%)`,
  },
  hero: {
    gradient: `linear-gradient(180deg, ${hexToRgba(backgroundColors.end, 0.84)} 0%, ${hexToRgba(backgroundColors.middle, 0.82)} 52%, ${hexToRgba(backgroundColors.start, 0.92)} 100%), linear-gradient(135deg, ${hexToRgba(backgroundColors.shellGlow, 0.14)}, ${hexToRgba(backgroundColors.glowPrimary, 0.12)})`,
    shapeTop: `linear-gradient(135deg, ${hexToRgba(backgroundColors.glowPrimary, 0.9)}, ${hexToRgba(backgroundColors.shellGlow, 0.95)})`,
    shapeBottom: `linear-gradient(135deg, ${hexToRgba(backgroundColors.glowSecondary, 0.95)}, ${hexToRgba(backgroundColors.start, 1)})`,
    heading: backgroundColors.text,
    eyebrow: hexToRgba(backgroundColors.text, 0.8),
    body: hexToRgba(backgroundColors.text, 0.9),
  },
  card: {
    background: formColors.cardBackground,
    panelBackground: formColors.panelBackground,
    border: formColors.softBorder,
    divider: formColors.softBorderStrong,
    shadow: `0 24px 60px ${hexToRgba(formColors.title, 0.1)}`,
    mobileShadow: `0 24px 60px ${hexToRgba(formColors.title, 0.08)}`,
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
  accents: {
    divider: `linear-gradient(90deg, ${backgroundColors.glowPrimary}, ${backgroundColors.glowSecondary}, ${backgroundColors.start}, ${backgroundColors.shellGlow})`,
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
    <div
      className="h-screen overflow-hidden px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6"
      style={{
        backgroundColor: brandTheme.page.background,
        backgroundImage: brandTheme.page.shellGlow,
        fontFamily: 'Corbel, "Trebuchet MS", "Segoe UI", Arial, sans-serif',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="mx-auto flex h-full max-w-[980px] items-center justify-center"
      >
        <div
          className="relative grid max-h-full w-full overflow-hidden rounded-[28px] border md:grid-cols-[minmax(280px,1.05fr)_minmax(320px,0.95fr)]"
          style={{
            borderColor: brandTheme.card.border,
            backgroundColor: brandTheme.card.background,
            boxShadow: brandTheme.card.shadow,
            backdropFilter: 'blur(10px)',
          }}
        >
          <div
            className="absolute left-[46%] top-[-28px] z-0 h-[250px] w-[250px] -translate-x-1/2 rounded-[28px] rotate-[35deg]"
            style={{ background: brandTheme.hero.shapeTop, opacity: 0.58 }}
          />
          <div
            className="relative z-10 min-h-[480px] overflow-hidden px-9 py-8 md:px-10 lg:px-12"
            style={{ background: brandTheme.hero.gradient }}
          >
            <div
              className="absolute -bottom-24 -left-24 h-[280px] w-[280px] rounded-[28px] rotate-[25deg]"
              style={{ background: brandTheme.hero.shapeBottom, opacity: 0.58 }}
            />

            <div className="relative z-10 flex h-full flex-col">
              <div className="pt-4">
                <img
                  src="/capal-logo.png"
                  alt="Capal"
                  className="mx-auto mb-16 w-full max-w-[240px] object-contain sm:max-w-[270px]"
                />
                <div
                  className="mb-3 text-[28px] font-bold tracking-[0.01em] sm:text-[40px]"
                  style={{ color: formColors.title }}
                >
                  CapalNote
                </div>
                <h1
                  className="max-w-[430px] text-[1.9rem] font-bold leading-[1.02] sm:text-[2.5rem]"
                  style={{ color: brandTheme.hero.heading }}
                >
                  Gerenciamento de Notas
                </h1>
              </div>
            </div>
          </div>

          <div
            className="relative z-10 flex items-center justify-center px-7 py-7 sm:px-9 sm:py-8 lg:px-9 lg:py-8"
            style={{
              background: `linear-gradient(180deg, ${formColors.panelBackground}, rgba(255, 255, 255, 0.88)), linear-gradient(135deg, ${hexToRgba(backgroundColors.shellGlow, 0.03)}, ${hexToRgba(backgroundColors.glowSecondary, 0.04)})`,
            }}
          >
            <div className="mx-auto max-w-[340px]">
              <h2 className="mb-1 text-[1.95rem] font-bold leading-none" style={{ color: brandTheme.card.title }}>
                Entrar
              </h2>
              <p className="max-w-[300px] text-[0.98rem] font-bold leading-7" style={{ color: brandTheme.card.badgeText }}>
                Acesso ao ambiente de gerenciamento de notas
              </p>
              <div className="mb-6 mt-3 h-1 w-[72px] rounded-full" style={{ background: brandTheme.accents.divider }} />
              <p className="mb-6 text-[0.92rem] leading-[1.5]" style={{ color: brandTheme.card.text }}>
                Informe seu usuario e senha para acessar o painel.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[0.84rem] font-bold" style={{ color: brandTheme.card.title }}>Usuario</Label>
                  <Input
                    id="email"
                    type="text"
                    autoComplete="username"
                    placeholder=""
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-[52px] rounded-[14px] px-[14px]"
                    style={{
                      borderColor: brandTheme.card.inputBorder,
                      backgroundColor: brandTheme.card.inputBackground,
                      ['--tw-ring-color' as string]: brandTheme.card.inputRing,
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-[0.84rem] font-bold" style={{ color: brandTheme.card.title }}>Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder=""
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-[52px] rounded-[14px] px-[14px] pr-12"
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
                  className="mt-1 h-[52px] w-full rounded-[14px] text-[0.98rem] font-bold text-white hover:opacity-95"
                  style={{
                    background: brandTheme.card.buttonGradient,
                    boxShadow: brandTheme.card.buttonShadow,
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>

              <p className="mt-[18px] text-[0.8rem] leading-[1.45]" style={{ color: brandTheme.card.text }}>
                Caso não saiba o seu usuário, entre em contato com Rafael Weckerlin.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
