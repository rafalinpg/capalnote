from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken

@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    return Response({
        "message": "Bem-vindo à API do CapalNote",
        "status": "online",
        "endpoints": {
            "token": "/api/token/",
            "token_refresh": "/api/token/refresh/",
            "register": "/api/register/",
            "me": "/api/me/",
            "admin": "/admin/"
        }
    })

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        name = request.data.get('name', '')
        
        if not email or not password:
            return Response({'error': 'Email e senha são obrigatórios'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Use email as username
        username = email
        
        if User.objects.filter(username=username).exists():
            return Response({'error': 'Usuário com este email já existe'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Split name into first and last
        first_name = ''
        last_name = ''
        if name:
            parts = name.strip().split(' ', 1)
            first_name = parts[0]
            if len(parts) > 1:
                last_name = parts[1]
                
        try:
            user = User.objects.create_user(
                username=username, 
                email=email, 
                password=password,
                first_name=first_name,
                last_name=last_name
            )
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'name': f"{user.first_name} {user.last_name}".strip()
                }
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class UserDetail(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "name": f"{user.first_name} {user.last_name}".strip() or user.username
        })

    def put(self, request):
        user = request.user
        data = request.data
        
        # Update Email/Name
        if 'email' in data:
            new_email = data['email']
            if new_email and new_email != user.email:
                if User.objects.filter(email=new_email).exclude(id=user.id).exists():
                     return Response({'error': 'Este email já está em uso.'}, status=status.HTTP_400_BAD_REQUEST)
                user.email = new_email
                user.username = new_email # Keep username synced with email
                user.save()
                
        if 'name' in data:
            name = data['name']
            parts = name.strip().split(' ', 1)
            user.first_name = parts[0]
            if len(parts) > 1:
                user.last_name = parts[1]
            else:
                user.last_name = ''
            user.save()
            
        # Update Password
        if 'new_password' in data and 'current_password' in data:
            if not user.check_password(data['current_password']):
                return Response({'error': 'Senha atual incorreta.'}, status=status.HTTP_400_BAD_REQUEST)
            
            user.set_password(data['new_password'])
            user.save()
            
            # Re-generate tokens since password changed (optional but good practice)
            # But standard JWT stateless doesn't strictly require it unless we blacklist.
            # However, the client might need to re-login or we can return new tokens.
            # For simplicity, we just return success and let client handle auth state.
            
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "name": f"{user.first_name} {user.last_name}".strip() or user.username,
            "message": "Perfil atualizado com sucesso."
        })
