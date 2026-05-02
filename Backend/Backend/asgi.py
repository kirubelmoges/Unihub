"""
ASGI config for Backend project.
"""

import os
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from channels.auth import AuthMiddlewareStack
from channels.sessions import SessionMiddlewareStack  # IMPORTANT: Add this

# Initialize Django ASGI app FIRST
django_asgi_app = get_asgi_application()

# NOW import routing AFTER Django is fully initialized
from chat.routing import websocket_urlpatterns as chat_routing
from vidiochat.routing import websocket_urlpatterns as conference_routing

# Combine all WebSocket routes
combined_routing = chat_routing + conference_routing

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        SessionMiddlewareStack(  # Wrap AuthMiddlewareStack with SessionMiddlewareStack
            AuthMiddlewareStack(
                URLRouter(
                    combined_routing
                )
            )
        )
    ),
})