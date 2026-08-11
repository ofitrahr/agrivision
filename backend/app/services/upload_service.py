import os
import uuid
import json
from werkzeug.utils import secure_filename
from flask import current_app


from dotenv import load_dotenv

load_dotenv()

try:
    import boto3
    from botocore.client import Config
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False


ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf', 'webp', 'doc', 'docx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_minio_client():
    if not BOTO3_AVAILABLE:
        return None

    endpoint = os.getenv('MINIO_ENDPOINT', 'http://localhost:9000')
    access_key = os.getenv('MINIO_ACCESS_KEY', 'admin_utama')
    secret_key = os.getenv('MINIO_SECRET_KEY', 'password_sangat_kuat_32karakter')
    
    return boto3.client(
        's3',
        endpoint_url=endpoint,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        config=Config(signature_version='s3v4'),
        region_name='us-east-1'
    )

def save_file_locally(file, subfolder="logos"):
    if not file or not file.filename:
        return None
        
    if not allowed_file(file.filename):
        raise ValueError("Ekstensi file tidak diizinkan.")

    original_filename = secure_filename(file.filename)
    ext = original_filename.rsplit('.', 1)[1].lower()
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    object_name = f"{subfolder}/{unique_filename}"

    use_minio = os.getenv('USE_MINIO', 'false').lower() == 'true'

    if use_minio and BOTO3_AVAILABLE:
        try:
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


            content_type = file.content_type or 'application/octet-stream'

            minio_client.upload_fileobj(
                file,
                bucket_name,
                object_name,
                ExtraArgs={'ContentType': content_type}
            )

            endpoint = os.getenv('MINIO_ENDPOINT', 'http://localhost:9000')
            return f"{endpoint}/{bucket_name}/{object_name}"
        except Exception as e:
            current_app.logger.error(f"Gagal upload ke MinIO, beralih ke lokal: {str(e)}")

    upload_path = os.path.join(current_app.root_path, 'static', 'uploads', subfolder)
    os.makedirs(upload_path, exist_ok=True)
    
    file_path = os.path.join(upload_path, unique_filename)
    file.save(file_path)

    return f"/static/uploads/{subfolder}/{unique_filename}"

