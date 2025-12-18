from django.contrib import admin
from .models import Notebook, Tag, Note, Attachment, Comment, NoteVersion, ShareLink, NotebookMember


@admin.register(Notebook)
class NotebookAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "owner", "is_archived", "created_at", "updated_at")
    search_fields = ("name",)


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "color")
    search_fields = ("name",)


class AttachmentInline(admin.TabularInline):
    model = Attachment
    extra = 0


class CommentInline(admin.TabularInline):
    model = Comment
    extra = 0


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "notebook", "author", "is_pinned", "is_archived", "created_at")
    search_fields = ("title", "content_text")
    list_filter = ("is_pinned", "is_archived", "notebook")
    inlines = [AttachmentInline, CommentInline]


@admin.register(NoteVersion)
class NoteVersionAdmin(admin.ModelAdmin):
    list_display = ("id", "note", "version_no", "created_at", "author")


@admin.register(ShareLink)
class ShareLinkAdmin(admin.ModelAdmin):
    list_display = ("id", "target_type", "note", "notebook", "role", "token", "expires_at", "created_by")


@admin.register(NotebookMember)
class NotebookMemberAdmin(admin.ModelAdmin):
    list_display = ("id", "notebook", "user", "role", "added_at")
