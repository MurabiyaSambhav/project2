import os
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application
import article.routing  # your app routing.py

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project2.settings")

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            article.routing.websocket_urlpatterns
        )
    ),
})
