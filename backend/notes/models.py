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


class NoteVersion(models.Model):
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name="versions")
    version_no = models.IntegerField()
    title = models.CharField(max_length=255)
    content_rich = models.TextField()
    content_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)


class ShareLink(models.Model):
    TARGET_TYPE_CHOICES = (
        ("note", "note"),
        ("notebook", "notebook"),
    )
    ROLE_CHOICES = (
        ("viewer", "viewer"),
        ("editor", "editor"),
    )
    target_type = models.CharField(max_length=16, choices=TARGET_TYPE_CHOICES)
    note = models.ForeignKey(Note, null=True, blank=True, on_delete=models.CASCADE)
    notebook = models.ForeignKey(Notebook, null=True, blank=True, on_delete=models.CASCADE)
    role = models.CharField(max_length=16, choices=ROLE_CHOICES)
    token = models.CharField(max_length=64, unique=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)


class NotebookMember(models.Model):
    ROLE_CHOICES = (
        ("owner", "owner"),
        ("editor", "editor"),
        ("viewer", "viewer"),
    )
    notebook = models.ForeignKey(Notebook, on_delete=models.CASCADE, related_name="members")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.CharField(max_length=16, choices=ROLE_CHOICES)
    added_at = models.DateTimeField(auto_now_add=True)

# Create your models here.
