import os
from django.db.models.signals import post_delete
from django.dispatch import receiver
from .models import Attachment

@receiver(post_delete, sender=Attachment)
def delete_attachment_file(sender, instance, **kwargs):
    """
    Deletes file from filesystem when corresponding `Attachment` object is deleted.
    """
    if instance.file:
        try:
            if os.path.isfile(instance.file.path):
                os.remove(instance.file.path)
        except Exception as e:
            # Log error or print it, but don't stop the deletion process
            print(f"Error deleting file {instance.file.path}: {e}")
