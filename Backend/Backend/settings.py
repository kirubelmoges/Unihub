"""
Django settings for backend project.
"""

from pathlib import Path
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-your-secret-key-here-change-in-production'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

OER_COMMONS_API_KEY = os.environ.get('OER_COMMONS_API_KEY', '')
OER_COMMONS_API_URL = 'https://api.oercommons.org/api/v1'

# MIT OCW API (No key needed, but has rate limits)
MIT_OCW_API_URL = 'https://ocw.mit.edu/api/courses'

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": "unihub",
        "USER": "root",
        "PASSWORD": "your password",
        "HOST": "127.0.0.1",
        "PORT": "3306",
        "OPTIONS": {
            "init_command": "SET sql_mode='STRICT_TRANS_TABLES', NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'",
            "charset": "utf8mb4",
        },
    }
}




ALLOWED_HOSTS = ['localhost', '127.0.0.1',]

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer'
    },
}

#CHANNELS_LAYERS = {
   # 'default': {
        #'BACKEND': 'channels_redis.core.RedisChannelLayer',
       # 'CONFIG': {
           # "hosts": [('127.0.0.1', 6379)],
       # },
 #   },
#}

INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'analytics',
    'announcement',
    'attendance',
    'digital_library',
    'marriage_mystery',
    'department',
    'exam_ai',
    'grades',
    'payment',
    'vidiochat',
    'chat',
    'books',
    'rest_framework',
    'corsheaders',
    'applications',
    'jobs',
    'videos',
    'tasks',
    'content',
    'users',
]

MIDDLEWARE = [


    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'Backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'Backend.wsgi.application'
ASGI_APPLICATION = 'Backend.asgi.application'


AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True


STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'static')




DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    ]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

SESSION_ENGINE = 'django.contrib.sessions.backends.db'
CSRF_COOKIE_NAME = 'csrftoken'
CSRF_HEADER_NAME = "HTTP_X_CSRFTOKEN"
SESSION_COOKIE_SECURE = False  # Set to True in production with HTTPS
SESSION_SAVE_EVERY_REQUEST = True
SESSION_COOKIE_AGE = 3600 
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_HTTPONLY = False
CSRF_USE_SESSIONS = False
CSRF_COOKIE_HTTPONLY = False  
CSRF_COOKIE_SECURE = False



CSRF_TRUSTED_ORIGINS = [
    'http://localhost:3000',
    "http://172.17.39.35:3000",
    
]


REST_FRAMEWORK = {
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser', 
        'rest_framework.parsers.FormParser',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
}


MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')


DATA_UPLOAD_MAX_MEMORY_SIZE = 3221225472  
FILE_UPLOAD_MAX_MEMORY_SIZE = 3221225472   


FILE_UPLOAD_PERMISSIONS = 0o644
FILE_UPLOAD_DIRECTORY_PERMISSIONS = 0o755


DATA_UPLOAD_MAX_NUMBER_FIELDS = 10000 


OPENAI_API_KEY = os.getenv('your-open-ai-key')


EXAM_AI_TEMP_DIR = os.path.join(MEDIA_ROOT, 'exam_ai_temp')
os.makedirs(EXAM_AI_TEMP_DIR, exist_ok=True)


EXAM_EXPIRY_HOURS = 24
MAX_EXAM_QUESTIONS = 50


TESSERACT_PATH = os.getenv('TESSERACT_PATH', r'C:\Program Files\Tesseract-OCR\tesseract.exe')


CELERY_BROKER_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE
