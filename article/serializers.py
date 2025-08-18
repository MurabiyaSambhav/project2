from rest_framework import serializers
from .models import Articles

class ArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Articles
        fields = ['id', 'title', 'content','tags', 'created_at']
