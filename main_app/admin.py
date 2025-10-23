from django.contrib import admin
from .models import UserProfile

# Register your models here.
@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('actual_name', 'user', 'created_by_admin', 'created_at')
    list_filter = ('created_at', 'created_by_admin')
    search_fields = ('actual_name', 'user__username')
    readonly_fields = ('created_at',)
