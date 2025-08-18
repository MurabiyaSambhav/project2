from django.contrib import admin
from django.urls import path, include  
from rest_framework.routers import DefaultRouter  
from article.views import ArticleViewSet, article, register, login, logout, save_article, draft_article, tags

router = DefaultRouter()
router.register(r'articles', ArticleViewSet)

urlpatterns = [
    path('', article, name='home'),
    path('register/', register, name='register'),
    path('login/', login, name='login'),
    path('logout/', logout, name='logout'),
    path('article/', article, name='article'),
    path('article_form/', save_article, name='add_article'),
    path('article_form/<int:article_id>/', save_article, name='edit_article'),
    path('draft_article/', draft_article, name='draft_article'),
    path('tags/<str:tag>/', tags, name='tags'),
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),  
]
