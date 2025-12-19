from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Notebook, Note, Tag, Attachment, NoteMember, NotebookMember, ShareInvitation, NoteVersion

class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'name']
        
    def get_name(self, obj):
        return obj.get_full_name() or obj.username

class NoteMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = NoteMember
        fields = ['id', 'user', 'role', 'added_at']

class NotebookMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = NotebookMember
        fields = ['id', 'user', 'role', 'added_at']

class ShareInvitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShareInvitation
        fields = ['id', 'email', 'target_type', 'target_id', 'role', 'status', 'created_at']
        read_only_fields = ['token', 'status', 'created_at']

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
    user_role = serializers.SerializerMethodField()

    class Meta:
        model = Note
        fields = [
            'id', 'notebook', 'title', 'content_rich', 'content_text', 
            'is_pinned', 'is_archived', 'is_trashed', 'author', 'last_edited_by', 'tags', 'tag_ids',
            'attachments', 'user_role',
            'created_at', 'updated_at'
        ]

    def get_user_role(self, obj):
        user = self.context['request'].user
        if not user.is_authenticated:
            return None
        
        # Check ownership
        if obj.author == user:
            return 'owner'
            
        # Check direct membership
        try:
            member = obj.members.get(user=user)
            return member.role
        except NoteMember.DoesNotExist:
            pass
            
        # Check notebook ownership (inherited)
        if obj.notebook.owner == user:
            return 'owner'
            
        # Check notebook membership (inherited)
        try:
            member = obj.notebook.members.get(user=user)
            return member.role
        except NotebookMember.DoesNotExist:
            return None

class NoteVersionSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.username')
    
    class Meta:
        model = NoteVersion
        fields = ['id', 'version_no', 'title', 'content_rich', 'content_text', 'created_at', 'author', 'author_name']


class NotebookSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')
    note_count = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()

    class Meta:
        model = Notebook
        fields = ['id', 'name', 'description', 'owner', 'is_archived', 'created_at', 'updated_at', 'note_count', 'user_role']

    def get_note_count(self, obj):
        return obj.notes.filter(is_trashed=False).count()

    def get_user_role(self, obj):
        user = self.context['request'].user
        if not user.is_authenticated:
            return None
            
        if obj.owner == user:
            return 'owner'
            
        try:
            member = obj.members.get(user=user)
            return member.role
        except NotebookMember.DoesNotExist:
            return None
