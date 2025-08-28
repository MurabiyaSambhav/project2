from rest_framework import serializers
from .models import Cuser, Articles, Comment, Like
from django.contrib.auth import get_user_model

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cuser
        fields = ['id', 'username', 'email', 'phone']

class CommentSerializer(serializers.ModelSerializer):
    user = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Comment
        fields = ['id', 'user', 'content', 'created_at']


User = get_user_model()
class ArticleSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    likes = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    tag_list = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    comments = CommentSerializer(many=True, read_only=True)

    class Meta:
        model = Articles
        fields = [
            'id', 'title', 'content', 'tags', 'tag_list', 
            'author', 'author_name', 'is_draft', 'created_at', 
            'likes', 'comment_count', 'is_liked', 'comments'
        ]

    def get_tag_list(self, obj):
        return obj.get_tags_list()

    def get_likes(self, obj):
        return obj.likes_count()

    def get_comment_count(self, obj):
        return obj.comments.count()

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.like_entries.filter(user=request.user).exists()
        return False

