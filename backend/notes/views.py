from rest_framework import viewsets, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils.crypto import get_random_string
from django.core.mail import send_mail
from django.conf import settings
from .models import Notebook, Note, Tag, Attachment, NoteMember, NotebookMember, ShareInvitation
from .serializers import (
    NotebookSerializer, NoteSerializer, TagSerializer, AttachmentSerializer, 
    NoteMemberSerializer, NotebookMemberSerializer, ShareInvitationSerializer
)

class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Return only tags owned by the current user
        if self.request.user.is_superuser:
            return self.queryset.order_by('name')
        return self.queryset.filter(owner=self.request.user).order_by('name')

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class NotebookViewSet(viewsets.ModelViewSet):
    queryset = Notebook.objects.all()
    serializer_class = NotebookSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return self.queryset.order_by('-created_at')
        return self.queryset.filter(
            Q(owner=user) | Q(members__user=user)
        ).distinct().order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
        
    def perform_update(self, serializer):
        # Check permissions
        notebook = serializer.instance
        user = self.request.user
        
        if notebook.owner == user or user.is_superuser:
            serializer.save()
            return
            
        # Check membership role
        member = notebook.members.filter(user=user).first()
        if member and member.role in ['editor', 'full_access']:
            serializer.save()
        else:
            raise PermissionDenied("You do not have permission to edit this notebook.")

    def perform_destroy(self, instance):
        # Only owner can delete notebook
        if instance.owner != self.request.user and not self.request.user.is_superuser:
            raise PermissionDenied("Only the owner can delete this notebook.")
        instance.delete()

class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return self.queryset.order_by('-updated_at')
        return self.queryset.filter(
            Q(author=user) | 
            Q(members__user=user) | 
            Q(notebook__owner=user) | 
            Q(notebook__members__user=user)
        ).distinct().order_by('-updated_at')

    def perform_create(self, serializer):
        # Check if user has permission to add note to the selected notebook
        notebook = serializer.validated_data.get('notebook')
        user = self.request.user
        
        can_create = False
        if notebook.owner == user or user.is_superuser:
            can_create = True
        else:
            member = notebook.members.filter(user=user).first()
            if member and member.role in ['editor', 'full_access']:
                can_create = True
                
        if not can_create:
            raise PermissionDenied("You do not have permission to add notes to this notebook.")
            
        serializer.save(author=self.request.user, last_edited_by=self.request.user)

    @action(detail=False, methods=['delete'])
    def empty_trash(self, request):
        if not request.user.is_superuser:
            raise PermissionDenied("Only superusers can empty the trash.")
        
        # Delete all trashed notes
        count, _ = Note.objects.filter(is_trashed=True).delete()
        
        return Response({'status': 'success', 'deleted_count': count})

    def perform_update(self, serializer):
        note = serializer.instance
        user = self.request.user
        
        # Check if only is_pinned is being updated (to avoid updating updated_at)
        # However, we still need to check permissions for pinning!
        
        # Determine user role
        role = 'viewer' # Default
        if note.author == user or note.notebook.owner == user:
            role = 'owner'
        else:
            member = note.members.filter(user=user).first()
            if member:
                role = member.role
            else:
                nb_member = note.notebook.members.filter(user=user).first()
                if nb_member:
                    role = nb_member.role
        
        if role not in ['owner', 'full_access', 'editor']:
             raise PermissionDenied("You do not have permission to edit this note.")

        if len(serializer.validated_data) == 1 and 'is_pinned' in serializer.validated_data:
            # Bypass auto_now=True by using update() directly
            # We don't update last_edited_by for pin operations either
            Note.objects.filter(pk=serializer.instance.pk).update(
                is_pinned=serializer.validated_data['is_pinned']
            )
            # Update instance manually so response reflects change
            serializer.instance.is_pinned = serializer.validated_data['is_pinned']
        else:
            note = serializer.save(last_edited_by=self.request.user)

            
    def perform_destroy(self, instance):
        user = self.request.user
        
        if not user.is_superuser:
            raise PermissionDenied("Apenas superusuários podem excluir notas permanentemente.")
            
        instance.delete()

class AttachmentViewSet(viewsets.ModelViewSet):
    queryset = Attachment.objects.all()
    serializer_class = AttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return self.queryset.order_by('-created_at')
        return self.queryset.filter(
            Q(note__author=user) |
            Q(note__members__user=user) |
            Q(note__notebook__owner=user) |
            Q(note__notebook__members__user=user)
        ).distinct().order_by('-created_at')

    def perform_create(self, serializer):
        file = self.request.data.get('file')
        file_name = file.name if file else ''
        size_bytes = file.size if file else 0
        mime_type = file.content_type if file else ''
        serializer.save(file_name=file_name, size_bytes=size_bytes, mime_type=mime_type)

class ShareViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'])
    def invite(self, request):
        email = request.data.get('email')
        target_type = request.data.get('target_type') # 'note' or 'notebook'
        target_id = request.data.get('target_id')
        role = request.data.get('role', 'viewer')

        if not email or not target_type or not target_id:
            return Response({'error': 'Missing fields'}, status=400)

        # Check permissions
        # Only owner or full_access can share
        can_share = False
        user = request.user
        
        if user.is_superuser:
            can_share = True
        elif target_type == 'notebook':
            notebook = get_object_or_404(Notebook, id=target_id)
            if notebook.owner == user:
                can_share = True
            else:
                member = notebook.members.filter(user=user).first()
                if member and member.role == 'full_access':
                    can_share = True
        elif target_type == 'note':
            note = get_object_or_404(Note, id=target_id)
            
            if note.is_trashed:
                return Response({'error': 'Não é permitido compartilhar notas que estão na lixeira.'}, status=400)
                
            if note.author == user:
                can_share = True
            elif note.notebook.owner == user:
                can_share = True
            else:
                member = note.members.filter(user=user).first()
                if member and member.role == 'full_access':
                    can_share = True
                else:
                    nb_member = note.notebook.members.filter(user=user).first()
                    if nb_member and nb_member.role == 'full_access':
                        can_share = True

        if not can_share:
            return Response({'error': 'Permission denied'}, status=403)

        token = get_random_string(32)
        invitation = ShareInvitation.objects.create(
            email=email,
            target_type=target_type,
            target_id=target_id,
            role=role,
            token=token,
            invited_by=request.user
        )
        
        # Use the configured frontend port (8080)
        invite_link = f"http://localhost:8080/register?token={token}"
        
        # Send email
        print(f"Sending invite to {email} with token {token}")
        print(f"Link: {invite_link}")
        
        try:
            send_mail(
                subject='Convite para colaborar no CapalNote',
                message=f'Você foi convidado por {request.user.email} para colaborar em uma nota/caderno no CapalNote.\n\nAcesse o link para aceitar: {invite_link}',
                from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@capalnote.com',
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"Failed to send email: {e}")
            # Don't fail the request, just log the error
        
        return Response(ShareInvitationSerializer(invitation).data)

    @action(detail=False, methods=['post'])
    def accept(self, request):
        token = request.data.get('token')
        invitation = get_object_or_404(ShareInvitation, token=token, status='pending')
        
        user = request.user
        
        # Check if user email matches invitation email
        # if user.email != invitation.email:
        #    return Response({'error': 'Email mismatch'}, status=400)
        
        if invitation.target_type == 'notebook':
            notebook = get_object_or_404(Notebook, id=invitation.target_id)
            # Remove existing membership if any
            NotebookMember.objects.filter(notebook=notebook, user=user).delete()
            NotebookMember.objects.create(notebook=notebook, user=user, role=invitation.role)
        elif invitation.target_type == 'note':
            note = get_object_or_404(Note, id=invitation.target_id)
            NoteMember.objects.filter(note=note, user=user).delete()
            NoteMember.objects.create(note=note, user=user, role=invitation.role)
            
        invitation.status = 'accepted'
        invitation.save()
        
        return Response({'status': 'success'})

    @action(detail=False, methods=['get'])
    def members(self, request):
        target_type = request.query_params.get('target_type')
        target_id = request.query_params.get('target_id')
        
        response_data = []
        
        if target_type == 'notebook':
            notebook = get_object_or_404(Notebook, id=target_id)
            # Fetch active members
            members = notebook.members.all()
            members_data = NotebookMemberSerializer(members, many=True).data
            for m in members_data:
                m['status'] = 'active'
                m['type'] = 'member'
            response_data.extend(members_data)
            
        elif target_type == 'note':
            note = get_object_or_404(Note, id=target_id)
            # Fetch active members
            members = note.members.all()
            members_data = NoteMemberSerializer(members, many=True).data
            for m in members_data:
                m['status'] = 'active'
                m['type'] = 'member'
            response_data.extend(members_data)
            
        else:
            return Response({'error': 'Invalid target'}, status=400)
            
        # Fetch pending invitations
        invitations = ShareInvitation.objects.filter(
            target_type=target_type,
            target_id=target_id,
            status='pending'
        )
        invitations_data = ShareInvitationSerializer(invitations, many=True).data
        for inv in invitations_data:
            inv['type'] = 'invitation'
            # Map created_at to added_at for sorting consistency
            inv['added_at'] = inv['created_at']
            
        return Response(response_data + invitations_data)

    @action(detail=False, methods=['post'])
    def resend(self, request):
        invitation_id = request.data.get('invitation_id')
        invitation = get_object_or_404(ShareInvitation, id=invitation_id, status='pending')
        
        # Check permissions
        user = request.user
        can_share = self._check_share_permission(user, invitation.target_type, invitation.target_id)
        
        if not can_share:
            return Response({'error': 'Permission denied'}, status=403)
            
        # Use the configured frontend port (8080)
        invite_link = f"http://localhost:8080/register?token={invitation.token}"
        
        try:
            send_mail(
                subject='Convite para colaborar no CapalNote (Reenvio)',
                message=f'Você foi convidado por {user.email} para colaborar em uma nota/caderno no CapalNote.\n\nAcesse o link para aceitar: {invite_link}',
                from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@capalnote.com',
                recipient_list=[invitation.email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"Failed to send email: {e}")
            return Response({'error': 'Failed to send email'}, status=500)
            
        return Response({'status': 'sent'})

    @action(detail=False, methods=['post'])
    def revoke_invite(self, request):
        invitation_id = request.data.get('invitation_id')
        invitation = get_object_or_404(ShareInvitation, id=invitation_id, status='pending')
        
        # Check permissions
        user = request.user
        can_revoke = self._check_share_permission(user, invitation.target_type, invitation.target_id)
        
        if not can_revoke:
            # Also allow the inviter to revoke even if they lost access? 
            # Usually strict RBAC is better.
            if invitation.invited_by != user:
                return Response({'error': 'Permission denied'}, status=403)
        
        invitation.delete()
        return Response({'status': 'revoked'})

    @action(detail=False, methods=['post'])
    def update_role(self, request):
        target_type = request.data.get('target_type')
        target_id = request.data.get('target_id')
        member_id = request.data.get('member_id')
        new_role = request.data.get('role')
        
        if not all([target_type, target_id, member_id, new_role]):
             return Response({'error': 'Missing fields'}, status=400)
             
        # Check permissions
        user = request.user
        can_manage = self._check_share_permission(user, target_type, target_id)
        
        if not can_manage:
            return Response({'error': 'Permission denied'}, status=403)
            
        if target_type == 'notebook':
            member = get_object_or_404(NotebookMember, id=member_id)
            if member.notebook.id != int(target_id):
                return Response({'error': 'Mismatch target'}, status=400)
        elif target_type == 'note':
            member = get_object_or_404(NoteMember, id=member_id)
            if member.note.id != int(target_id):
                return Response({'error': 'Mismatch target'}, status=400)
        else:
            return Response({'error': 'Invalid target type'}, status=400)
            
        # Prevent changing own role via this endpoint if needed, but UI should handle.
        # Ideally, owner cannot be changed here (owner is on Note/Notebook model, not Member).
        
        member.role = new_role
        member.save()
        return Response({'status': 'updated'})

    @action(detail=False, methods=['post'])
    def remove_member(self, request):
        target_type = request.data.get('target_type')
        target_id = request.data.get('target_id')
        member_id = request.data.get('member_id')
        
        if not all([target_type, target_id, member_id]):
             return Response({'error': 'Missing fields'}, status=400)
             
        # Check permissions
        user = request.user
        can_manage = self._check_share_permission(user, target_type, target_id)
        
        if not can_manage:
            # Allow user to remove themselves (Leave)
            # We need to fetch member first to check if it matches request.user
            pass

        if target_type == 'notebook':
            member = get_object_or_404(NotebookMember, id=member_id)
            if member.notebook.id != int(target_id):
                return Response({'error': 'Mismatch target'}, status=400)
        elif target_type == 'note':
            member = get_object_or_404(NoteMember, id=member_id)
            if member.note.id != int(target_id):
                return Response({'error': 'Mismatch target'}, status=400)
        else:
             return Response({'error': 'Invalid target type'}, status=400)
             
        # Allow self-removal
        if member.user == user:
            can_manage = True
            
        if not can_manage:
            return Response({'error': 'Permission denied'}, status=403)
            
        member.delete()
        return Response({'status': 'removed'})

    def _check_share_permission(self, user, target_type, target_id):
        can_share = False
        if user.is_superuser:
            return True
        if target_type == 'notebook':
            notebook = get_object_or_404(Notebook, id=target_id)
            if notebook.owner == user:
                can_share = True
            else:
                member = notebook.members.filter(user=user).first()
                if member and member.role == 'full_access':
                    can_share = True
        elif target_type == 'note':
            note = get_object_or_404(Note, id=target_id)
            if note.author == user or note.notebook.owner == user:
                can_share = True
            else:
                member = note.members.filter(user=user).first()
                if member and member.role == 'full_access':
                    can_share = True
                else:
                    nb_member = note.notebook.members.filter(user=user).first()
                    if nb_member and nb_member.role == 'full_access':
                        can_share = True
        return can_share

