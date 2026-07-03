# Debug Session: login-route-blocked

Status: [OPEN]

## Symptom
- Usuario informa que o login nao conclui a entrada na aplicacao.

## Hypotheses
1. A rota `/login` nao esta registrada corretamente no roteador.
2. Um guard de autenticacao esta redirecionando antes da tela de login montar.
3. O submit nao conclui ou a promise de login nao resolve corretamente.
4. A navegacao apos login esta incorreta por causa de `navigate('/')`.
5. A chamada `/api/me/` falha e o frontend continua tratando o login como sucesso.

## Evidence Collected
- `src/App.tsx`: a rota `/login` foi avaliada com `isLoading=false`, `hasUser=false`, `hasToken=false`.
- `src/pages/Login.tsx`: o formulario foi submetido normalmente.
- `src/hooks/useAuth.ts`: `POST /api/token/` respondeu `200` com `access` e `refresh`.
- Em tentativas anteriores, `src/hooks/useAuth.ts` registrou `fetchUser threw error` com `Failed to fetch`.
- Nessas mesmas tentativas, `src/pages/Login.tsx` registrou `login form resolved` com `success=true`, mesmo sem usuario carregado.
- Em tentativa posterior, com backend recarregado, houve sucesso em `backend/core/views.py` (`user detail entered`) e `src/hooks/useAuth.ts` (`fetchUser resolved successfully`).

## Conclusion
- Hipoteses 1 e 2 foram refutadas.
- A causa funcional observada e: quando `/api/me/` falha, o frontend ainda considera o login bem-sucedido e tenta navegar para `/`.
- Como `user` permanece nulo, o guard redireciona de volta para `/login`, produzindo a sensacao de que "nao entra".

## Fix Applied
- `src/hooks/useAuth.ts`: `fetchUser()` agora retorna `boolean`.
- `src/hooks/useAuth.ts`: `login()` so retorna `success=true` quando o perfil em `/api/me/` carrega com sucesso.
- Quando `/api/me/` falha, o login retorna erro explicito em vez de navegar falsamente como sucesso.

## Pending Verification
- Reproduzir o login apos a correcao para comparar o comportamento pos-fix.
- Manter a instrumentacao ate confirmacao do usuario.
