from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    id = serializers.CharField(source='whatsapp', read_only=True)

    class Meta:
        model = User
        fields = ('id', 'whatsapp', 'first_name', 'last_name', 'role', 'store', 'ativo', 'password')
        read_only_fields = ('role',) # Prevent self-promotion through profile update

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        
        # Portuguese field mapping if any (though frontend currently uses first_name/last_name)
        # For now, just standard update
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
