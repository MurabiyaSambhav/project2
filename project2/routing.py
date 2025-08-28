from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import path
from article.consumers import MyConsumer  # your WebSocket consumer

application = ProtocolTypeRouter({
    "websocket": AuthMiddlewareStack(
        URLRouter([
            path("ws/some_path/", MyConsumer.as_asgi()),
        ])
    ),
})
