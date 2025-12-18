from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes

@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    return Response({
        "message": "Bem-vindo à API do CapalNote",
        "status": "online",
        "endpoints": {
            "token": "/api/token/",
            "token_refresh": "/api/token/refresh/",
            "me": "/api/me/",
            "admin": "/admin/"
        }
    })

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
