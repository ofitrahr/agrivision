import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf', 'webp', 'doc', 'docx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_file_locally(file, subfolder="logos"):
    if not file or not file.filename:
        return None
        
    if not allowed_file(file.filename):
        raise ValueError("Ekstensi file tidak diizinkan.")

    original_filename = secure_filename(file.filename)
    ext = original_filename.rsplit('.', 1)[1].lower()
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    
    # Path di dalam folder static agar bisa diakses browser via /static/uploads/...
    upload_path = os.path.join(current_app.root_path, 'static', 'uploads', subfolder)
    os.makedirs(upload_path, exist_ok=True)
    
    file_path = os.path.join(upload_path, unique_filename)
    file.save(file_path)

    return f"/static/uploads/{subfolder}/{unique_filename}"
