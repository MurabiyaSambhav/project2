from rest_framework import serializers
from .models import Articles
from .models import Cuser
class ArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Articles
        fields = ['id', 'title', 'content','tags', 'created_at']
from .models import Cuser   # your custom user model

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)  # hide password in responses

    class Meta:
        model = Cuser
        fields = ['id', 'username','password', 'email', 'first_name', 'last_name', 'phone', 'password', 'is_active','is_staff', 'date_joined']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = Cuser(**validated_data)
        if password:
            user.set_password(password) 
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance