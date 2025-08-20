from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from article.models import Cuser, Articles
from django.core.paginator import Paginator
from collections import Counter
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from rest_framework.decorators import action, permission_classes
from django.contrib.auth.decorators import login_required
from rest_framework.permissions import IsAuthenticated
from django.http import JsonResponse
from django.db.models import Q

# -------------------- Imports for API Views --------------------
from rest_framework.response import Response
from .models import Articles , Cuser
from article.serializers import ArticleSerializer
# from article.serializers import UserSerializer
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny

class ArticleHybridViewSet(viewsets.ModelViewSet):
    queryset = Articles.objects.all()
    serializer_class = ArticleSerializer 
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'content']
    # http_method_names = ['get', 'post']

    # ---------------- Permissions ----------------

    def get_permissions(self):
        if self.action in ['search_articles']:
            return [AllowAny()]
        return [IsAuthenticated()]

    # ---------------- Custom search endpoint ----------------

    @action(detail=False, methods=['get'], url_path='search')
    @permission_classes([AllowAny])
    def search_articles(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

   # # Apply pagination if available
        # page = self.paginate_queryset(queryset)
        # if page is not None:
        #     serializer = self.get_serializer(page, many=True)
        #     return self.get_paginated_response(serializer.data)
       
        # Return all results if no pagination
# -------------------- api for user--------------------
# class UserHybridViewSet(viewsets.ModelViewSet):
#     queryset = Cuser.objects.all()
#     serializer_class = UserSerializer

#     # def list(self, request, *args, **kwargs):
#     def list(self, request):
#         queryset = Cuser.objects.values('id', 'username', 'password', 'email', 'first_name', 'last_name', 'phone', 'is_active', 'is_staff', 'date_joined')
#         return Response(list(queryset))


# -------------------- Register --------------------
def register(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        email = request.POST.get('email')
        password = request.POST.get('password')
        phone = request.POST.get('phone')

        # Check for existing email
        if Cuser.objects.filter(email=email).exists():
            msg = "Email already registered!"
            if request.headers.get("x-requested-with") == "XMLHttpRequest":
                return JsonResponse({"success": False, "message": msg})
            messages.error(request, msg)
            return redirect('register')

        # Check for existing username
        if Cuser.objects.filter(username=name).exists():
            msg = "Username already taken!"
            if request.headers.get("x-requested-with") == "XMLHttpRequest":
                return JsonResponse({"success": False, "message": msg})
            messages.error(request, msg)
            return redirect('register')

        # Create user
        user = Cuser(username=name, email=email, phone=phone)
        user.set_password(password)
        user.save()

        msg = "Registration successful!"
        if request.headers.get("x-requested-with") == "XMLHttpRequest":
            return JsonResponse({"success": True, "message": msg, "redirect": "login"})
        messages.success(request, msg)
        return redirect('login')

    # Render for SPA
    if request.headers.get("x-requested-with") == "XMLHttpRequest" and request.GET.get("format") == "html":
        return render(request, 'register.html')
    return render(request, 'register.html')

# -------------------- Login --------------------
def login(request):
    if request.user.is_authenticated:
        msg = "You are already logged in."
        if request.headers.get("x-requested-with") == "XMLHttpRequest":
            return JsonResponse({"success": False, "message": msg, "redirect": "article"})
        messages.info(request, msg)
        return redirect('article')

    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')

        user = None
        try:
            user_obj = Cuser.objects.get(email=email)
            user = authenticate(request, username=user_obj.username, password=password)
        except Cuser.DoesNotExist:
            pass

        if user:
            auth_login(request, user)
            msg = "Login successful!"
            if request.headers.get("x-requested-with") == "XMLHttpRequest":
                return JsonResponse({"success": True, "message": msg, "redirect": "article"})
            messages.success(request, msg)
            return redirect('article')
        else:
            msg = "Invalid email or password."
            if request.headers.get("x-requested-with") == "XMLHttpRequest":
                return JsonResponse({"success": False, "message": msg})
            messages.error(request, msg)
            return redirect('login')

    # Render for SPA
    if request.headers.get("x-requested-with") == "XMLHttpRequest" and request.GET.get("format") == "html":
        return render(request, 'login.html')
    return render(request, 'login.html')


# -------------------- Logout --------------------
def logout(request):
    auth_logout(request)
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({"success": True, "message": "You have been logged out.", "redirect": "article"})
    return redirect('/article/')

# -------------------- Article List --------------------
def article(request):
    user = request.user if request.user.is_authenticated else None

    # Get search query from GET parameters
    search_query = request.GET.get('search', '').strip()

    # Get all published articles
    articles_qs = Articles.objects.filter(is_draft=False).select_related('author').order_by('-created_at')

    # Apply search filter if query exists (match whole words only)
    if search_query:
        # Escape regex special characters in search_query
        import re
        escaped_query = re.escape(search_query)
        articles_qs = articles_qs.filter(
            Q(title__iregex=rf'\b{escaped_query}\b') | Q(content__iregex=rf'\b{escaped_query}\b')
        )

    # Pagination
    paginator = Paginator(articles_qs, 5)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    # Prepare articles for template
    processed_articles = [
        {
            'id': art.id,
            'title': art.title,
            'content': art.content,
            'tags': art.tags,
            'tag_list': [tag.strip() for tag in art.tags.split(',') if tag.strip()],
            'author_name': art.author.username,
            'created_at': art.created_at,
        }
        for art in page_obj
    ]

    # Tags for sidebar
    all_tags_flat = []
    for art in Articles.objects.filter(is_draft=False):
        all_tags_flat.extend([tag.strip() for tag in art.tags.split(',') if tag.strip()])
    tag_counts = Counter(all_tags_flat)
    tag_counts_list = sorted(tag_counts.items())

    # Check draft status for navbar
    has_drafts = Articles.objects.filter(author=user, is_draft=True).exists() if user else False

    context = {
        'articles': processed_articles,
        'user_name': user.username if user else None,
        'is_logged_in': bool(user),
        'all_tags': sorted(set(all_tags_flat)),
        'tag_counts_list': tag_counts_list,
        'page_obj': page_obj,
        'has_drafts': has_drafts,
        'no_drafts': not has_drafts,
        'search_query': search_query,  # keep query in input field
    }

    # SPA response
    if request.headers.get("x-requested-with") == "XMLHttpRequest" and request.GET.get("format") == "html":
        return render(request, 'article.html', context)

    return render(request, 'article.html', context)

# -------------------- Save/Add/Edit Article --------------------
@login_required(login_url='login')
def save_article(request, article_id=None):
    user = request.user
    article = get_object_or_404(Articles, id=article_id, author=user) if article_id else None

    if request.method == 'POST':
        action = request.POST.get('action')  
        title = request.POST.get('title')
        content = request.POST.get('content')
        tags = request.POST.get('tags')

        # Cancel button
        if action == 'cancel':
            redirect_to = 'draft_article' if article and article.is_draft else 'article'
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'success': True, 'redirect': redirect_to})
            return redirect(redirect_to)

        if action == 'delete' and article:
            article.delete()

            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({
                    "success": True,
                    "message": "Article deleted!",
                    "redirect": "article",
                    "alert_type": "error"  # must be error
                })

            messages.success(request, "Article deleted!")
            return redirect('draft_article')


        # Draft or Publish
        is_draft = (action == 'draft')

        if article:
            article.title = title
            article.content = content
            article.tags = tags
            article.is_draft = is_draft
            article.save()
        else:
            article = Articles.objects.create(
                title=title,
                content=content,
                tags=tags,
                author=user,
                is_draft=is_draft
            )

        # AJAX response
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({
                'success': True,
                'message': "Draft saved!" if is_draft else "Article published successfully!",
                'redirect': 'draft_article' if is_draft else 'article'
            })

        messages.success(request, "Draft saved!" if is_draft else "Article published successfully!")
        return redirect('draft_article' if is_draft else 'article')

    # SPA page render
    if request.headers.get("x-requested-with") == "XMLHttpRequest" and request.GET.get("format") == "html":
        return render(request, 'add_article.html', {'article': article})
    return render(request, 'add_article.html', {'article': article})


# -------------------- Draft Articles --------------------
@login_required(login_url='login')
def draft_article(request):
    drafts_qs = Articles.objects.filter(author=request.user, is_draft=True).order_by('-created_at')
    has_drafts = drafts_qs.exists()

    processed_drafts = [
        {
            'id': art.id,
            'title': art.title,
            'content': art.content,
            'tags': art.tags,
            'tag_list': [tag.strip() for tag in art.tags.split(',') if tag.strip()],
            'author_name': art.author.username,
            'created_at': art.created_at,
        }
        for art in drafts_qs
    ]

    context = {
        'articles': processed_drafts,
        'is_logged_in': True,
        'user_name': request.user.username,
        'is_draft_page': True,
        'has_drafts': has_drafts,
        'no_drafts': not has_drafts,
    }

    # SPA response
    if request.headers.get("x-requested-with") == "XMLHttpRequest" and request.GET.get("format") == "html":
        return render(request, 'draft_article.html', context)

    return render(request, 'draft_article.html', context)


# -------------------- Tags --------------------
def tags(request, tag):
    user = request.user if request.user.is_authenticated else None

    all_articles = Articles.objects.filter(is_draft=False).select_related('author')
    all_tags_flat = []
    matched_articles = []
    normalized_tag = tag.lower()

    for article in all_articles:
        tag_list = [t.strip() for t in article.tags.split(',') if t.strip()]
        all_tags_flat.extend(tag_list)
        if normalized_tag in [t.lower() for t in tag_list]:
            matched_articles.append({
                'id': article.id,
                'title': article.title,
                'content': article.content,
                'tags': article.tags,
                'tag_list': tag_list,
                'author_name': article.author.username,
                'created_at': article.created_at,
            })

    tag_counts = Counter(all_tags_flat)
    tag_counts_list = sorted(tag_counts.items())

    context = {
        'articles': matched_articles,
        'user_name': user.username if user else None,
        'is_logged_in': user is not None,
        'selected_tag': tag,
        'all_tags': sorted(set(all_tags_flat)),
        'tag_counts_list': tag_counts_list,
    }

    # SPA response
    if request.headers.get("x-requested-with") == "XMLHttpRequest" and request.GET.get("format") == "html":
        return render(request, 'article.html', context)

    return render(request, 'article.html', context)