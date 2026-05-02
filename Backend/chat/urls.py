from django.urls import path
from . import views

urlpatterns = [
    # Room endpoints
    path('rooms/', views.ChatRoomList.as_view(), name='chat-room-list'),
    path('rooms/create/', views.CreateGroupView.as_view(), name='create-room'),
    path('rooms/<int:room_id>/', views.RoomDetailView.as_view(), name='room-detail'),
    path('rooms/<int:room_id>/join/', views.JoinRoomView.as_view(), name='join-room'),
    path('rooms/<int:room_id>/leave/', views.LeaveRoomView.as_view(), name='leave-room'),
    
    # Message endpoints
    path('rooms/<int:room_id>/messages/', views.GetMessagesView.as_view(), name='get-messages'),
    path('rooms/<int:room_id>/send/', views.SendMessageView.as_view(), name='send-message'),
    
    # Request endpoints
    path('requests/<int:request_id>/approve/', views.ApproveJoinRequestView.as_view(), name='approve-request'),
    
    # File upload
    path('upload/', views.FileUploadView.as_view(), name='file-upload'),
]