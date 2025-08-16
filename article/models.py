from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings

class Cuser(AbstractUser):
    phone = models.CharField(max_length=15, blank=True, null=True)

    def __str__(self):
        return self.username  

class Articles(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    tags = models.CharField(max_length=100)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,  
        on_delete=models.CASCADE
    )
    is_draft = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    def get_tags_list(self):
        return [tag.strip() for tag in self.tags.split(',') if tag.strip()]
