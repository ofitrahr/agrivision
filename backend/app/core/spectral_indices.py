EPS = 1e-6


def compute_ndvi(b8, b4, eps=EPS):
    """Normalized Difference Vegetation Index: (NIR - Red) / (NIR + Red)."""
    return (b8 - b4) / (b8 + b4 + eps)


def compute_ndre(b8a, b5, eps=EPS):
    """Normalized Difference Red Edge: (NIR sempit - Red Edge 1) / (NIR sempit + Red Edge 1)."""
    return (b8a - b5) / (b8a + b5 + eps)


def compute_ndwi(b3, b8, eps=EPS):
    """Normalized Difference Water Index: (Green - NIR) / (Green + NIR)."""
    return (b3 - b8) / (b3 + b8 + eps)
