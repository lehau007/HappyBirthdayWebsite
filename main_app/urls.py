from django.contrib import admin
from django.urls import path
from .views import LoginView, BirthdayView, CreateUserView, logout_view

urlpatterns = [
    path('', LoginView.as_view(), name='login'),
    path('birthday/', BirthdayView.as_view(), name='birthday'),
    path('admin/create-user/', CreateUserView.as_view(), name='create_user'),
    path('logout/', logout_view, name='logout'),
]