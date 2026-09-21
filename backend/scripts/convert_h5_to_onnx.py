import os
import tensorflow as tf
import tf2onnx

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
MODELS_DIR = os.path.join(BACKEND_DIR, "app", "ml_models", "soc")

os.environ["CUDA_VISIBLE_DEVICES"] = ""

SOURCE_H5 = os.path.join(MODELS_DIR, "best_model_ann.h5")
TARGET_ONNX = os.path.join(MODELS_DIR, "best_model_ann.onnx")

os.makedirs(MODELS_DIR, exist_ok=True)

print(f"Memuat model Keras .h5 dari: {SOURCE_H5}")
model = tf.keras.models.load_model(SOURCE_H5, compile=False)

input_spec = [tf.TensorSpec([None, 26], tf.float32, name='input_features')]

@tf.function(input_signature=input_spec)
def serve(x):
    return model(x)

print(f"Mengonversi ke format ONNX: {TARGET_ONNX}")
tf2onnx.convert.from_function(serve, input_signature=input_spec, output_path=TARGET_ONNX)

print(f"Berhasil! File tersimpan di: {TARGET_ONNX}")