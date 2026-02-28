from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    id = serializers.CharField(source='whatsapp', read_only=True)

    class Meta:
        model = User
        fields = ('id', 'whatsapp', 'login_name', 'first_name', 'last_name', 'role', 'store', 'ativo', 'password', 'needs_password_setup', 'profile_image')
        read_only_fields = ('store',)

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
            user.needs_password_setup = False
        else:
            user.set_unusable_password()
            user.needs_password_setup = True
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
            instance.needs_password_setup = False
        return super().update(instance, validated_data)

class RegisterSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('whatsapp', 'password', 'business_name', 'first_name', 'last_name')

    def create(self, validated_data):
        business_name = validated_data.pop('business_name')
        password = validated_data.pop('password')
        # Store creation logic will be handled in the view or here
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user
