from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.contrib import admin
from article.views import ArticleHybridViewSet
from article.views import article, draft_article, save_article, login, logout, register,tags
# from article.views import UserHybridViewSet

route = DefaultRouter()
# register() connects a ViewSet to a URL prefix.
# It tells DRF: “Take this ViewSet and automatically create all the standard CRUD URLs for it.”
route.register(r'articles', ArticleHybridViewSet, basename='article')
# router.register(r'users', UserHybridViewSet, basename='user')

urlpatterns = [
    path('admin/', admin.site.urls),

    # Old frontend pages
    path('', article, name='home'),
    path('article/', article, name='article'),
    path('draft_article/', draft_article, name='draft_article'),
    path('article_form/', save_article, name='add_article'),
    path('article_form/<int:article_id>/', save_article, name='edit_article'),
    path('login/', login, name='login'),
    path('logout/', logout, name='logout'),
    path('register/', register, name='register'),
    path('tags/<str:tag>/', tags, name='tags'),

    # DRF API
    path('api/', include(route.urls)),
    
    # Custom search route
    path('api/search/', ArticleHybridViewSet.as_view({'get': 'search_articles'}), name='article-search')
]

