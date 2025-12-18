from rest_framework import viewsets, permissions
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Notebook, Note, Tag, Attachment
from .serializers import NotebookSerializer, NoteSerializer, TagSerializer, AttachmentSerializer

class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Return only tags owned by the current user
        return self.queryset.filter(owner=self.request.user).order_by('name')

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class NotebookViewSet(viewsets.ModelViewSet):
    queryset = Notebook.objects.all()
    serializer_class = NotebookSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Return only notebooks owned by the current user
        return self.queryset.filter(owner=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Return only notes owned by the current user
        return self.queryset.filter(author=self.request.user).order_by('-updated_at')

    def perform_create(self, serializer):
        serializer.save(author=self.request.user, last_edited_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(last_edited_by=self.request.user)

class AttachmentViewSet(viewsets.ModelViewSet):
    queryset = Attachment.objects.all()
    serializer_class = AttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        return self.queryset.filter(note__author=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        file = self.request.data.get('file')
        file_name = file.name if file else ''
        size_bytes = file.size if file else 0
        mime_type = file.content_type if file else ''
        serializer.save(file_name=file_name, size_bytes=size_bytes, mime_type=mime_type)
