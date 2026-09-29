EPS = 1e-6


def compute_ndvi(b8, b4, eps=EPS):
    return (b8 - b4) / (b8 + b4 + eps)


def compute_ndre(b8a, b5, eps=EPS):
    return (b8a - b5) / (b8a + b5 + eps)


def compute_ndwi(b3, b8, eps=EPS):
    return (b3 - b8) / (b3 + b8 + eps)
