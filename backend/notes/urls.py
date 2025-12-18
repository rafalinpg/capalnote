from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotebookViewSet, NoteViewSet, TagViewSet, AttachmentViewSet

router = DefaultRouter()
router.register(r'notebooks', NotebookViewSet)
router.register(r'notes', NoteViewSet)
router.register(r'tags', TagViewSet)
router.register(r'attachments', AttachmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
