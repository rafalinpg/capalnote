from django.db import models
from django.conf import settings


class Notebook(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notebooks")
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Tag(models.Model):
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=7)  # hex like #ffffff
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tags", null=True, blank=True)

    def __str__(self):
        return self.name


class Note(models.Model):
    notebook = models.ForeignKey(Notebook, on_delete=models.CASCADE, related_name="notes")
    title = models.CharField(max_length=255)
    content_rich = models.TextField(blank=True)
    content_text = models.TextField(blank=True)
    is_pinned = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    is_trashed = models.BooleanField(default=False)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notes")
    last_edited_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="edited_notes")
    tags = models.ManyToManyField(Tag, related_name="notes", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class NotePin(models.Model):
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name="pins")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="pinned_notes")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("note", "user")


class Attachment(models.Model):
    TYPE_CHOICES = (
        ("image", "image"),
        ("audio", "audio"),
        ("file", "file"),
        ("sketch", "sketch"),
    )
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name="attachments")
    type = models.CharField(max_length=16, choices=TYPE_CHOICES)
    file = models.FileField(upload_to='attachments/', null=True)
    file_name = models.CharField(max_length=255, blank=True)
    size_bytes = models.IntegerField(blank=True, null=True)
    mime_type = models.CharField(max_length=128, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Comment(models.Model):
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="comments")
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


class NoteMember(models.Model):
    ROLE_CHOICES = (
        ("full_access", "full_access"),
        ("editor", "editor"),
        ("viewer", "viewer"),
    )
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name="members")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="note_memberships")
    role = models.CharField(max_length=16, choices=ROLE_CHOICES)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('note', 'user')


class NotebookMember(models.Model):
    ROLE_CHOICES = (
        ("full_access", "full_access"),
        ("editor", "editor"),
        ("viewer", "viewer"),
    )
    notebook = models.ForeignKey(Notebook, on_delete=models.CASCADE, related_name="members")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notebook_memberships")
    role = models.CharField(max_length=16, choices=ROLE_CHOICES)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('notebook', 'user')


class ShareInvitation(models.Model):
    TARGET_TYPE_CHOICES = (
        ("note", "note"),
        ("notebook", "notebook"),
    )
    ROLE_CHOICES = (
        ("full_access", "full_access"),
        ("editor", "editor"),
        ("viewer", "viewer"),
    )
    email = models.EmailField()
    target_type = models.CharField(max_length=16, choices=TARGET_TYPE_CHOICES)
    target_id = models.IntegerField()  # ID of the note or notebook
    role = models.CharField(max_length=16, choices=ROLE_CHOICES)
    token = models.CharField(max_length=64, unique=True)
    invited_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_invitations")
    status = models.CharField(max_length=16, default='pending', choices=(('pending', 'pending'), ('accepted', 'accepted'), ('expired', 'expired')))
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Invite {self.email} to {self.target_type} {self.target_id}"


# Create your models here.
