from django.contrib import admin
from django.urls import path
from article import views  

urlpatterns = [
    path('', views.article, name='home'),
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),
    path('article/', views.article, name='article'),
    path('article_form/', views.save_article, name='add_article'),  
    path('article_form/<int:article_id>/', views.save_article, name='edit_article'),  
    path('draft_article/', views.draft_article, name='draft_article'),
    path('tags/<str:tag>/', views.tags, name='tags'),
    path('admin/', admin.site.urls),
]
