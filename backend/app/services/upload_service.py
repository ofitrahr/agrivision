import json
import os
import uuid
import zipfile

from dotenv import load_dotenv
from flask import current_app

load_dotenv()

try:
    import boto3
    from botocore.client import Config
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False


ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf', 'webp', 'doc', 'docx'}
IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
MAX_UPLOAD_SIZE = int(os.getenv('MAX_UPLOAD_SIZE_MB', '10')) * 1024 * 1024

CONTENT_TYPES = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'webp': 'image/webp',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

PIL_FORMAT_EXTENSIONS = {'PNG': 'png', 'JPEG': 'jpg', 'WEBP': 'webp'}


def allowed_file(filename, allowed_extensions=None):
    allowed = allowed_extensions or ALLOWED_EXTENSIONS
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed


def _file_size(file):
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    return size


def _detect_image_extension(file):
    try:
        from PIL import Image
        with Image.open(file) as img:
            detected = img.format
            img.verify()
    except Exception:
        return None
    finally:
        file.seek(0)
    return PIL_FORMAT_EXTENSIONS.get(detected)


def _document_matches_extension(file, ext):
    head = file.read(8)
    file.seek(0)

    if ext == 'pdf':
        return head.startswith(b'%PDF-')

    if ext == 'doc':
        return head == b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1'

    if ext == 'docx':
        if not head.startswith(b'PK\x03\x04'):
            return False
        try:
            with zipfile.ZipFile(file) as zf:
                names = set(zf.namelist())
        except zipfile.BadZipFile:
            return False
        finally:
            file.seek(0)
        return '[Content_Types].xml' in names and 'word/document.xml' in names

    return False


def validate_upload(file, allowed_extensions=None):
    allowed = allowed_extensions or ALLOWED_EXTENSIONS
    if not allowed_file(file.filename, allowed):
        raise ValueError(f"Ekstensi file tidak diizinkan. Gunakan: {', '.join(sorted(allowed))}.")

    ext = file.filename.rsplit('.', 1)[1].lower()

    size = _file_size(file)
    if size == 0:
        raise ValueError("File kosong.")
    if size > MAX_UPLOAD_SIZE:
        raise ValueError(f"Ukuran file terlalu besar. Maksimum {MAX_UPLOAD_SIZE // (1024 * 1024)} MB.")

    if ext in IMAGE_EXTENSIONS:
        detected = _detect_image_extension(file)
        if detected is None or detected not in allowed:
            raise ValueError("Isi file bukan gambar yang valid atau format tidak didukung.")
        return detected

    if not _document_matches_extension(file, ext):
        raise ValueError("Isi file tidak sesuai dengan ekstensinya atau file rusak.")

    return ext


def get_minio_client():
    access_key = os.getenv('MINIO_ACCESS_KEY')
    secret_key = os.getenv('MINIO_SECRET_KEY')
    if not access_key or not secret_key:
        raise RuntimeError("MINIO_ACCESS_KEY / MINIO_SECRET_KEY belum diset")

    endpoint = os.getenv('MINIO_INTERNAL_ENDPOINT') or os.getenv('MINIO_ENDPOINT', 'http://localhost:9000')
    return boto3.client(
        's3',
        endpoint_url=endpoint,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        config=Config(
            signature_version='s3v4',
            connect_timeout=3,
            read_timeout=5,
            retries={'max_attempts': 1}
        ),
        region_name='us-east-1'
    )


def save_file_locally(file, subfolder="logos", allowed_extensions=None):
    if not file or not file.filename:
        return None

    ext = validate_upload(file, allowed_extensions)
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    object_name = f"{subfolder}/{unique_filename}"

    use_minio = os.getenv('USE_MINIO', 'false').lower() == 'true'

    if use_minio and BOTO3_AVAILABLE:
        try:
            file.seek(0)
            minio_client = get_minio_client()
            bucket_name = os.getenv('MINIO_BUCKET_NAME', 'agrivision-uploads')

            try:
                minio_client.head_bucket(Bucket=bucket_name)
            except Exception:
                minio_client.create_bucket(Bucket=bucket_name)
                try:
                    policy = {
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Principal": "*",
                                "Action": ["s3:GetObject"],
                                "Resource": [f"arn:aws:s3:::{bucket_name}/*"]
                            }
                        ]
                    }
                    minio_client.put_bucket_policy(Bucket=bucket_name, Policy=json.dumps(policy))
                except Exception as e:
                    current_app.logger.warning(f"Tidak dapat mengatur bucket policy: {str(e)}")

            content_type = CONTENT_TYPES[ext]

            minio_client.upload_fileobj(
                file,
                bucket_name,
                object_name,
                ExtraArgs={'ContentType': content_type}
            )

            public_endpoint = os.getenv('MINIO_ENDPOINT', 'http://localhost:9000')
            return f"{public_endpoint}/{bucket_name}/{object_name}"
        except Exception as e:
            current_app.logger.error(f"Gagal upload ke MinIO, beralih ke lokal: {str(e)}")
            file.seek(0)

    upload_path = os.path.join(current_app.root_path, 'static', 'uploads', subfolder)
    os.makedirs(upload_path, exist_ok=True)
    
    file_path = os.path.join(upload_path, unique_filename)
    file.save(file_path)

    return f"/static/uploads/{subfolder}/{unique_filename}"

