from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotebookViewSet, NoteViewSet, TagViewSet, AttachmentViewSet, ShareViewSet, UsersViewSet

router = DefaultRouter()
router.register(r'notebooks', NotebookViewSet)
router.register(r'notes', NoteViewSet)
router.register(r'tags', TagViewSet)
router.register(r'attachments', AttachmentViewSet)
router.register(r'share', ShareViewSet, basename='share')
router.register(r'users', UsersViewSet, basename='users')

urlpatterns = [
    path('', include(router.urls)),
]
