from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/conference/(?P<room_token>[a-zA-Z0-9]{8})/$', consumers.VideoConferenceConsumer.as_asgi()),
]