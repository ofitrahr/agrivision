import json
import os

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
MODELS_DIR = os.path.join(BACKEND_DIR, "app", "ml_models", "soc")

SOURCE_H5 = os.path.join(MODELS_DIR, "best_model_ann.h5")
TARGET_ONNX = os.path.join(MODELS_DIR, "best_model_ann.onnx")
FEATURES_JSON = os.path.join(MODELS_DIR, "features.json")

N_FEATURES = 27

os.environ["CUDA_VISIBLE_DEVICES"] = ""
os.makedirs(MODELS_DIR, exist_ok=True)


def convert_with_tf2onnx():
    import tensorflow as tf
    import tf2onnx

    model = tf.keras.models.load_model(SOURCE_H5, compile=False)
    input_spec = [tf.TensorSpec([None, N_FEATURES], tf.float32, name='input_features')]

    @tf.function(input_signature=input_spec)
    def serve(x):
        return model(x)

    tf2onnx.convert.from_function(serve, input_signature=input_spec, output_path=TARGET_ONNX)


def convert_from_weights():
    """Bangun graf ONNX langsung dari bobot .h5 (MLP Dense murni, tanpa TensorFlow)."""
    import h5py
    import numpy as np
    import onnx
    from onnx import TensorProto, helper, numpy_helper

    with h5py.File(SOURCE_H5, 'r') as f:
        cfg = json.loads(f.attrs['model_config'])
        layers = [l for l in cfg['config']['layers'] if l['class_name'] == 'Dense']

        weights = {}
        def walk(group, prefix=''):
            for key in group:
                item = group[key]
                if isinstance(item, h5py.Dataset):
                    weights[prefix + key] = np.array(item)
                else:
                    walk(item, prefix + key + '/')
        walk(f['model_weights'] if 'model_weights' in f else f)

    def fetch(layer_name, kind):
        for path, arr in weights.items():
            if path.endswith(f'{layer_name}/{kind}'):
                return arr
        raise KeyError(f'{layer_name}/{kind} tidak ditemukan di {SOURCE_H5}')

    nodes, initializers = [], []
    current = 'input_features'

    for idx, layer in enumerate(layers):
        name = layer['config']['name']
        kernel = fetch(name, 'kernel').astype(np.float32)
        bias = fetch(name, 'bias').astype(np.float32)

        if idx == 0 and kernel.shape[0] != N_FEATURES:
            raise ValueError(f'Model mengharapkan {kernel.shape[0]} fitur, N_FEATURES={N_FEATURES}')

        initializers += [
            numpy_helper.from_array(kernel, f'{name}_W'),
            numpy_helper.from_array(bias, f'{name}_B'),
        ]
        out = f'{name}_out'
        nodes.append(helper.make_node('Gemm', [current, f'{name}_W', f'{name}_B'], [out], name=name))
        current = out

        if layer['config'].get('activation') == 'relu':
            relu_out = f'{name}_relu'
            nodes.append(helper.make_node('Relu', [out], [relu_out], name=f'{name}_relu'))
            current = relu_out

    graph = helper.make_graph(
        nodes, 'soc_ann',
        [helper.make_tensor_value_info('input_features', TensorProto.FLOAT, [None, N_FEATURES])],
        [helper.make_tensor_value_info(current, TensorProto.FLOAT, [None, 1])],
        initializers,
    )
    model = helper.make_model(graph, opset_imports=[helper.make_opsetid('', 13)])
    model.ir_version = 9
    onnx.checker.check_model(model)
    onnx.save(model, TARGET_ONNX)


if __name__ == '__main__':
    if os.path.exists(FEATURES_JSON):
        with open(FEATURES_JSON) as f:
            n = len(json.load(f))
        if n != N_FEATURES:
            raise SystemExit(f'features.json berisi {n} fitur, N_FEATURES={N_FEATURES}')

    print(f"Memuat model Keras .h5 dari: {SOURCE_H5}")
    try:
        convert_with_tf2onnx()
        print("Dikonversi lewat tf2onnx.")
    except ImportError:
        convert_from_weights()
        print("TensorFlow tidak tersedia - graf ONNX dibangun langsung dari bobot .h5.")

    print(f"Berhasil! File tersimpan di: {TARGET_ONNX}")
