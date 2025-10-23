from django.shortcuts import render, redirect
from django.views.generic import View
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required, user_passes_test
from django.utils.decorators import method_decorator
from django.contrib import messages
from django.views.decorators.csrf import csrf_exempt
from .models import UserProfile
import json

# Create your views here.
class LoginView(View):
    template_name = 'login.html'
    
    def get(self, request, *args, **kwargs):
        """Handle GET requests - show login page"""
        if request.user.is_authenticated:
            return redirect('birthday')
        
        context = {
            'page_title': "Welcome to Lehau007's world"
        }
        return render(request, self.template_name, context)
    
    def post(self, request, *args, **kwargs):
        """Handle POST requests - process login"""
        username = request.POST.get('username')
        password = request.POST.get('password')
        
        if username and password:
            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                messages.success(request, f'Welcome back!')
                return redirect('birthday')
            else:
                messages.error(request, 'Invalid username or password.')
        else:
            messages.error(request, 'Please fill in all fields.')
        
        context = {
            'page_title': "Welcome to Lehau007's world",
            'username': username
        }
        return render(request, self.template_name, context)

@method_decorator(login_required, name='dispatch')
class BirthdayView(View):
    template_name = 'birthday.html'
    
    def get(self, request, *args, **kwargs):
        """Handle GET requests - render the birthday page"""
        try:
            user_profile = UserProfile.objects.get(user=request.user)
            actual_name = user_profile.actual_name
        except UserProfile.DoesNotExist:
            actual_name = request.user.first_name or request.user.username
        
        # # Debug session information
        # session_key = request.session.session_key
        # print(f"Session Key: {session_key}")
        # print(f"Session Data: {dict(request.session)}")
        # print(f"User: {request.user}")
        # print(f"Is Authenticated: {request.user.is_authenticated}")

        context = {
            'page_title': 'Happy Birthday!',
            'message': f'Welcome to your Birthday Celebration, {actual_name}!',
            'actual_name': actual_name,
            'show_balloons': True
        }
        return render(request, self.template_name, context)
    
    def post(self, request, *args, **kwargs):
        """Handle POST requests - process birthday wishes or form data"""
        try:
            user_profile = UserProfile.objects.get(user=request.user)
            actual_name = user_profile.actual_name
        except UserProfile.DoesNotExist:
            actual_name = request.user.first_name or request.user.username
            
        try:
            # Check if it's JSON data
            if request.content_type == 'application/json':
                data = json.loads(request.body)
                wish_text = data.get('wish', '')
                user_name = data.get('name', actual_name)
                
                # Process the birthday wish
                response_data = {
                    'status': 'success',
                    'message': f'Thank you {user_name}! Your wish "{wish_text}" has been received!',
                    'wish_count': self.get_wish_count() + 1
                }
                return JsonResponse(response_data)
            
            # Handle form data
            else:
                wish_text = request.POST.get('wish', '')
                user_name = request.POST.get('name', actual_name)
                
                if wish_text:
                    # Process the wish (you could save to database here)
                    context = {
                        'page_title': 'Happy Birthday!',
                        'message': f'Thank you {user_name}! Your wish has been received!',
                        'actual_name': actual_name,
                        'show_balloons': True,
                        'success': True,
                        'wish_text': wish_text
                    }
                else:
                    context = {
                        'page_title': 'Happy Birthday!',
                        'message': 'Please enter a birthday wish!',
                        'actual_name': actual_name,
                        'show_balloons': True,
                        'error': True
                    }
                
                return render(request, self.template_name, context)
        
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': f'An error occurred: {str(e)}'
            }, status=400)
    
    def get_wish_count(self):
        """Helper method to get wish count (could be from database)"""
        # For now, return a dummy count
        # In a real app, you'd query your database here
        return 42

def is_admin(user):
    return user.is_superuser or user.is_staff

@method_decorator([login_required, user_passes_test(is_admin)], name='dispatch')
class CreateUserView(View):
    template_name = 'create_user.html'
    
    def get(self, request, *args, **kwargs):
        """Handle GET requests - show create user form"""
        context = {
            'page_title': 'Create New User - Admin Panel'
        }
        return render(request, self.template_name, context)
    
    def post(self, request, *args, **kwargs):
        """Handle POST requests - create new user"""
        username = request.POST.get('username')
        password = request.POST.get('password')
        actual_name = request.POST.get('actual_name')
        
        if username and password and actual_name:
            # Check if username already exists
            if User.objects.filter(username=username).exists():
                messages.error(request, 'Username already exists.')
            else:
                try:
                    # Create new user
                    user = User.objects.create_user(
                        username=username,
                        password=password,
                        first_name=actual_name
                    )
                    
                    # Create user profile
                    UserProfile.objects.create(
                        user=user,
                        actual_name=actual_name,
                        created_by_admin=request.user
                    )
                    
                    messages.success(request, f'User account created successfully for {actual_name}!')
                    return redirect('create_user')
                except Exception as e:
                    messages.error(request, f'Error creating user: {str(e)}')
        else:
            messages.error(request, 'Please fill in all fields.')
        
        context = {
            'page_title': 'Create New User - Admin Panel',
            'username': username,
            'actual_name': actual_name
        }
        return render(request, self.template_name, context)

@login_required
def logout_view(request):
    logout(request)
    messages.success(request, 'You have been logged out successfully.')
    return redirect('login')