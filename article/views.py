# import json
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from article.models import Cuser, Articles, Comment, Like
from django.core.paginator import Paginator
from collections import Counter
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.http import JsonResponse
from django.db.models import Q, Count, Prefetch
from django.template.loader import render_to_string
# -------------------- Imports for API Views --------------------
from rest_framework.response import Response
from .models import Articles , Cuser, Comment, Like
from article.serializers import ArticleSerializer,CommentSerializer
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, permission_classes, api_view
from rest_framework.permissions import IsAuthenticated, AllowAny

# -------------------- API Views --------------------
class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Articles.objects.all().order_by('-created_at')
    serializer_class = ArticleSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'content']

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        article = get_object_or_404(Articles, pk=pk)
        user = request.user
        like_obj = article.like_entries.filter(user=user).first()
        if like_obj:
            like_obj.delete()
            liked = False
        else:
            Like.objects.create(article=article, user=user)
            liked = True
        return Response({'liked': liked, 'likes': article.likes_count()})

    @action(detail=True, methods=['get', 'post'], permission_classes=[AllowAny])
    def comments(self, request, pk=None):
        article = get_object_or_404(Articles, pk=pk)
        if request.method == 'GET':
            serializer = CommentSerializer(article.comments.all(), many=True)
            return Response(serializer.data)
        else:  # POST
            if not request.user.is_authenticated:
                return Response({'error': 'Login required'}, status=status.HTTP_401_UNAUTHORIZED)
            content = request.data.get('content')
            if not content:
                return Response({'error': 'Comment content required'}, status=status.HTTP_400_BAD_REQUEST)
            comment = Comment.objects.create(article=article, user=request.user, content=content)
            serializer = CommentSerializer(comment)
            return Response(serializer.data)

# -------------------- Auth API Views --------------------
@api_view(['POST'])
@permission_classes([AllowAny])
def login_api(request):
    email = request.data.get('email')
    password = request.data.get('password')
    user_obj = Cuser.objects.filter(email=email).first()
    if user_obj:
        user = authenticate(request, username=user_obj.username, password=password)
        if user:
            auth_login(request, user)
            return Response({'success': True, 'username': user.username, 'email': user.email})
    return Response({'success': False, 'message': 'Invalid email or password'})

@api_view(['POST'])
@permission_classes([AllowAny])
def register_api(request):
    name = request.data.get('name')
    email = request.data.get('email')
    password = request.data.get('password')
    phone = request.data.get('phone')
    if Cuser.objects.filter(email=email).exists():
        return Response({'success': False, 'message': 'Email already registered'})
    if Cuser.objects.filter(username=name).exists():
        return Response({'success': False, 'message': 'Username already taken'})
    user = Cuser(username=name, email=email, phone=phone)
    user.set_password(password)
    user.save()
    return Response({'success': True, 'username': user.username, 'email': user.email})

@api_view(['POST'])
def logout_api(request):
    auth_logout(request)
    return Response({'success': True})

@api_view(['GET'])
def current_user(request):
    if request.user.is_authenticated:
        return Response({'user': {'username': request.user.username, 'email': request.user.email}})
    return Response({'user': None})


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
    # If user is already logged in
    if request.user.is_authenticated:
        msg = "You are already logged in."
        if request.headers.get("x-requested-with") == "XMLHttpRequest":
            return JsonResponse({"success": False, "message": msg, "redirect": "article"})
        messages.info(request, msg)
        return redirect('article')

    # If POST request (login attempt)
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')

        user = None
        user_obj = Cuser.objects.filter(email=email).first()  #  Prevent MultipleObjectsReturned

        if user_obj:
            # Authenticate using username from user_obj
            user = authenticate(request, username=user_obj.username, password=password)

        if user:
            # Successful login
            auth_login(request, user)
            msg = "Login successful!"
            if request.headers.get("x-requested-with") == "XMLHttpRequest":
                return JsonResponse({"success": True, "message": msg, "redirect": "article"})
            messages.success(request, msg)
            return redirect('article')
        else:
            # Invalid credentials
            msg = "Invalid email or password."
            if request.headers.get("x-requested-with") == "XMLHttpRequest":
                return JsonResponse({"success": False, "message": msg})
            messages.error(request, msg)
            return redirect('login')

    # Render for SPA (AJAX HTML)
    if request.headers.get("x-requested-with") == "XMLHttpRequest" and request.GET.get("format") == "html":
        return render(request, 'login.html')

    # Normal render
    return render(request, 'login.html')

# -------------------- Logout --------------------
def logout(request):
    auth_logout(request)

    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({"redirect": "/article/"})  # no message

    return redirect('/article/')  # normal request redirect

# -------------------- List Articles --------------------
def article(request):
    """List articles (server-side search + pagination)."""
    user = request.user if request.user.is_authenticated else None
    search_query = request.GET.get('search', '').strip()
    tag_filter = request.GET.get('tag', '').strip()

    # Base queryset (exclude drafts)
    qs = Articles.objects.filter(is_draft=False).select_related('author').order_by('-created_at')

    # Search by title/content
    if search_query:
        qs = qs.filter(Q(title__icontains=search_query) | Q(content__icontains=search_query))

    # Tag filter (optional)
    if tag_filter:
        qs = qs.filter(tags__icontains=tag_filter)

    # Prefetch comments and annotate likes
    qs = qs.prefetch_related(
        Prefetch('comments', queryset=Comment.objects.select_related('user').order_by('-id'))
    ).annotate(likes_count=Count('like_entries'))

    # Pagination
    paginator = Paginator(qs, 5)  # adjust page size as needed
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    for article in page_obj:
        if article.tags:
            article.tag_list = [t.strip() for t in article.tags.split(',') if t.strip()]
        else:
            article.tag_list = []
    
        if user:
            article.is_liked = article.like_entries.filter(user=user).exists()
        else:
            article.is_liked = False

    # Sidebar tag counts (simple approach)
    all_tags_flat = []
    for art in Articles.objects.filter(is_draft=False).values_list('tags', flat=True):
        if art:
            all_tags_flat.extend([t.strip() for t in art.split(',') if t.strip()])
    tag_counts_list = sorted(Counter(all_tags_flat).items())

    has_drafts = Articles.objects.filter(author=user, is_draft=True).exists() if user else False

    context = {
        'page_obj': page_obj,                 # Page of Article objects
        'search_query': search_query,
        'tag_counts_list': tag_counts_list,
        'user_name': user.username if user else None,
        'is_logged_in': bool(user),
        'has_drafts': has_drafts,
        'selected_tag': tag_filter,
    }
    return render(request, 'article.html', context)

# -------------------- Add Comment --------------------
@login_required
def add_comment(request, article_id):
    """Handle server-side comment submission (POST) and redirect back."""
    if request.method == "POST":
        content = request.POST.get('content', '').strip()
        if content:
            article = get_object_or_404(Articles, id=article_id)
            Comment.objects.create(article=article, user=request.user, content=content)
    return redirect(request.META.get('HTTP_REFERER', '/'))

# -------------------- Like Article --------------------
@login_required
def like_article(request, article_id):
    """Toggle like server-side via POST form and redirect back."""
    if request.method == "POST":
        article = get_object_or_404(Articles, id=article_id)
        user = request.user
        existing = article.like_entries.filter(user=user).first()
        if existing:
            existing.delete()
        else:
            article.like_entries.create(user=user)
    return redirect(request.META.get('HTTP_REFERER', '/'))

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
            redirect_url = '/draft_article/' if article and article.is_draft else '/article/'
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'success': True, 'redirect': redirect_url})
            return redirect(redirect_url)

        # Delete article
        if action == 'delete' and article:
            article.delete()
            redirect_url = '/article/'  # after delete, go to main article page
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({
                    "success": True,
                    "message": "Article deleted!",
                    "redirect": redirect_url,
                    "alert_type": "error"  # must be error
                })
            messages.success(request, "Article deleted!")
            return redirect(redirect_url)

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
        redirect_url = '/draft_article/' if is_draft else '/article/'
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({
                'success': True,
                'message': "Draft saved!" if is_draft else "Article published successfully!",
                'redirect': redirect_url
            })

        messages.success(request, "Draft saved!" if is_draft else "Article published successfully!")
        return redirect(redirect_url)

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

    # SPA response (fetch HTML only)
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