from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        identifier = attrs.get(self.username_field)
        if identifier and "@" in identifier:
            User = get_user_model()
            try:
                user = User.objects.get(email__iexact=identifier)
                attrs[self.username_field] = getattr(user, User.USERNAME_FIELD)
            except User.DoesNotExist:
                # mantém identificação original para falhar normalmente
                pass
        return super().validate(attrs)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

