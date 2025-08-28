from django.urls import path, include
from rest_framework.routers import DefaultRouter
from article.views import (
    ArticleViewSet,
    article, draft_article, save_article,
    login, logout, register, tags,
    add_comment, like_article,
    register_api, login_api, logout_api, current_user
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# ------------------- DRF Router -------------------
router = DefaultRouter()
router.register(r'articles', ArticleViewSet, basename='article')

# ------------------- URL Patterns -------------------
urlpatterns = [
    # --------- Frontend pages (SSR fallback) ---------
    path('', article, name='home'),
    path('article/', article, name='article'),
    path('draft_article/', draft_article, name='draft_article'),
    path('article_form/', save_article, name='add_article'),
    path('article_form/<int:article_id>/', save_article, name='edit_article'),
    path('login/', login, name='login'),
    path('logout/', logout, name='logout'),
    path('register/', register, name='register'),
    path('tags/<str:tag>/', tags, name='tags'),

    # --------- Legacy endpoints (optional, can be removed later) ---------
    path('article/<int:article_id>/comment/', add_comment, name='add_comment'),
    path('article/<int:article_id>/like/', like_article, name='like_article'),

    # ------------------- DRF API -------------------
    path('api/', include(router.urls)),  # /api/articles/, /api/articles/<id>/ etc.
    path('api/search/', ArticleViewSet.as_view({'get': 'search_articles'}), name='article-search'),

    # ------------------- Auth API -------------------
    path('api/register/', register_api, name='register_api'),
    path('api/login/', login_api, name='login_api'),
    path('api/logout/', logout_api, name='logout_api'),
    path('api/current_user/', current_user, name='current_user'),

    # ------------------- JWT Auth -------------------
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
