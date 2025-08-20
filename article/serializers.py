from rest_framework import serializers
from .models import Articles, Cuser

# -------------------- Article Serializer --------------------
class ArticleSerializer(serializers.ModelSerializer):
    author = serializers.ReadOnlyField(source='author.id')  # store author ID
    author_name = serializers.ReadOnlyField(source='author.username')  # frontend-friendly
    tag_list = serializers.SerializerMethodField()  # list of tags

    class Meta:
        model = Articles
        fields = ['id', 'title', 'content', 'tags', 'tag_list', 'author', 'author_name', 'created_at', 'is_draft']

    author_name = serializers.SerializerMethodField()

    def get_author_name(self, obj):
        return obj.author.username if obj.author else "Anonymous"

    def get_tag_list(self, obj):
        return [tag.strip().lower() for tag in obj.tags.split(',') if tag.strip()]

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['author'] = request.user
        return super().create(validated_data)

# -------------------- User Serializer --------------------
    # class UserSerializer(serializers.ModelSerializer):
    #     class Meta:
    #         model = Cuser
    #         fields = ['id', 'username', 'password', 'email', 'first_name', 'last_name', 'phone', 'is_active', 'is_staff', 'date_joined']
    #         extra_kwargs = {'password': {'write_only': True}}

    #     def validate_username(self, value):
    #         user = self.instance
    #         if Cuser.objects.exclude(pk=user.pk if user else None).filter(username=value).exists():
    #             raise serializers.ValidationError("Username is already taken.")
    #         return value

    #     def validate_email(self, value):
    #         user = self.instance
    #         if Cuser.objects.exclude(pk=user.pk if user else None).filter(email=value).exists():
    #             raise serializers.ValidationError("Email is already taken.")
    #         return value

    #     def create(self, validated_data):
    #         user = Cuser.objects.create(**validated_data)
    #         user.set_password(validated_data['password'])
    #         user.save()
    #         return user

    #     def update(self, instance, validated_data):
    #         password = validated_data.pop('password', None)
    #         for attr, val in validated_data.items():
    #             setattr(instance, attr, val)
    #         if password:
    #             instance.set_password(password)
    #         instance.save()
    #         return instance
