from rest_framework import serializers
from .models import Notebook, Note, Tag, Attachment

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'color', 'owner']
        extra_kwargs = {
            'owner': {'read_only': True}
        }

class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ['id', 'note', 'type', 'file', 'file_name', 'size_bytes', 'mime_type', 'created_at']
        read_only_fields = ['file_name', 'size_bytes', 'mime_type', 'created_at']

class NoteSerializer(serializers.ModelSerializer):
    author = serializers.ReadOnlyField(source='author.username')
    last_edited_by = serializers.ReadOnlyField(source='last_edited_by.username')
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=Tag.objects.all(), source='tags', required=False
    )
    attachments = AttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Note
        fields = [
            'id', 'notebook', 'title', 'content_rich', 'content_text', 
            'is_pinned', 'is_archived', 'is_trashed', 'author', 'last_edited_by', 'tags', 'tag_ids',
            'attachments',
            'created_at', 'updated_at'
        ]

class NotebookSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')
    note_count = serializers.SerializerMethodField()

    class Meta:
        model = Notebook
        fields = ['id', 'name', 'description', 'owner', 'is_archived', 'created_at', 'updated_at', 'note_count']

    def get_note_count(self, obj):
        return obj.notes.filter(is_trashed=False).count()
