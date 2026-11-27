#!/usr/bin/env python3
"""Capture the public MI-GAN comparison from pinned inputs.

Dependencies: numpy==1.26.4, Pillow==11.3.0, onnxruntime==1.19.2,
opencv-python-headless==4.11.0.86, and Python 3.9+.
The cache directory is for local downloads and should stay outside the site.
"""

import argparse
from datetime import date
import hashlib
import json
import math
from pathlib import Path
import platform
import shutil
import time
from urllib.request import Request, urlopen

import cv2
import numpy as np
import onnxruntime as ort
from PIL import Image, ImageDraw, ImageFilter, ImageOps


MODEL_REVISION = "406830d0fa60666da0071c342ad2fbc8f30c5c64"
MODEL_FILE = "migan_pipeline_v2.onnx"
MODEL_SHA256 = "6f1f3530a1a2324b19752018ce756088b07973cda8d7d890034ace5c8a48c40b"
MODEL_SOURCE = "https://huggingface.co/andraniksargsyan/migan"
PHOTOS = {
    "hallway": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/6/61/Interior_views_of_Filoli_-_IMG_9261.JPG",
        "source": "https://commons.wikimedia.org/wiki/File:Interior_views_of_Filoli_-_IMG_9261.JPG",
        "author": "Daderot",
        "sha256": "fc9ea6fd0c1dd8b2bbe232b6f0ee74b8b2c32d9644dc9daea2402ec5bfe96880",
        "position": (309, 232),
        "height": 190,
        "jacket": "#bc6b39",
    },
    "forest": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Sunlit_path_in_the_forest_maritime_forest_habitat.jpg",
        "source": "https://commons.wikimedia.org/wiki/File:Sunlit_path_in_the_forest_maritime_forest_habitat.jpg",
        "author": "U.S. Fish and Wildlife Service",
        "sha256": "3a867589b5e24b9a35e432c8b599b62bbc71efb7b5f8335ec21c9f32d025f590",
        "position": (405, 211),
        "height": 188,
        "jacket": "#4c7591",
    },
}
SIZE = (768, 512)
THREADS = 4
WARMUPS = 5
RUNS = 30


def pinned_download(cache, name, url, checksum):
    path = cache / name
    if not path.exists():
        staged = path.with_suffix(path.suffix + ".partial")
        request = Request(url, headers={"User-Agent": "QuantquerVision/2.3 (https://quantquer.com)"})
        with urlopen(request, timeout=60) as response, staged.open("wb") as output:
            shutil.copyfileobj(response, output)
        if hashlib.sha256(staged.read_bytes()).hexdigest() != checksum:
            raise ValueError(f"Unexpected source checksum: {name}")
        staged.replace(path)
    if hashlib.sha256(path.read_bytes()).hexdigest() != checksum:
        raise ValueError(f"Restore the pinned copy before running: {name}")
    return path


def test_figure(height, jacket):
    """Known-alpha artwork, drawn here instead of borrowing a person's image."""
    figure = Image.new("RGBA", (112, 240))
    draw = ImageDraw.Draw(figure)
    draw.ellipse((11, 220, 106, 237), fill=(19, 17, 10, 75))
    draw.polygon([(39, 112), (76, 109), (79, 141), (72, 176), (85, 220),
                  (72, 224), (54, 183), (48, 154), (47, 184), (32, 220),
                  (18, 219), (30, 174), (30, 142)], fill="#283039")
    draw.line([(62, 134), (62, 175), (78, 217)], fill="#404957", width=4)
    draw.polygon([(18, 215), (32, 217), (33, 225), (11, 228), (7, 226)], fill="#20232b")
    draw.polygon([(71, 219), (84, 216), (97, 223), (96, 227), (73, 227)], fill="#22242b")
    draw.rounded_rectangle((44, 26, 68, 53), radius=7, fill="#ba8a68")
    draw.ellipse((42, 8, 69, 39), fill="#39302e")
    draw.polygon([(45, 30), (66, 33), (64, 40), (53, 43), (46, 38)], fill="#ac7c59")
    draw.polygon([(39, 46), (69, 45), (82, 54), (88, 84), (95, 115), (83, 119),
                  (74, 98), (76, 127), (37, 130), (37, 91), (30, 118), (19, 115),
                  (22, 87), (30, 57)], fill=jacket)
    draw.polygon([(39, 47), (49, 58), (49, 127), (37, 130), (37, 88),
                  (27, 114), (19, 115), (22, 87), (30, 57)], fill=(59, 33, 31, 115))
    draw.line([(56, 58), (58, 124)], fill="#33343c", width=2)
    draw.line([(65, 93), (72, 99)], fill="#33343c", width=2)
    draw.ellipse((20, 113, 29, 128), fill="#b18061")
    draw.ellipse((85, 115, 95, 130), fill="#b18061")
    return figure.resize((round(112 * height / 240), height), Image.Resampling.LANCZOS)


def fixture(photo, filename):
    background = ImageOps.fit(ImageOps.exif_transpose(Image.open(filename)).convert("RGB"),
                              SIZE, method=Image.Resampling.LANCZOS)
    figure = test_figure(photo["height"], photo["jacket"])
    input_image = background.copy()
    input_image.paste(figure, photo["position"], figure.getchannel("A"))
    alpha = Image.new("L", SIZE)
    alpha.paste(figure.getchannel("A"), photo["position"])
    hole = np.asarray(alpha.filter(ImageFilter.MaxFilter(13))) > 0
    if not np.all(np.asarray(input_image)[~hole] == np.asarray(background)[~hole]):
        raise ValueError("Test figure extends beyond the mask")
    # Keep the reference available and visualize the exact mask footprint.
    highlight = Image.composite(Image.new("RGB", SIZE, "#ff8b4d"), input_image,
                                Image.fromarray(hole.astype(np.uint8) * 138))
    return background, input_image, hole, highlight


def benchmark(run):
    for _ in range(WARMUPS):
        run()
    durations = []
    for _ in range(RUNS):
        start = time.perf_counter_ns()
        output = run()
        durations.append((time.perf_counter_ns() - start) / 1_000_000)
    return output, {
        "medianMs": round(float(np.median(durations)), 3),
        "p95Ms": round(float(np.percentile(durations, 95)), 3),
        "samplesMs": [round(value, 3) for value in durations],
    }


def masked_quality(reference, result, hole):
    errors = reference[hole].astype(float) - result[hole]
    mse = float(np.mean(errors ** 2))
    return {"psnrDb": round(10 * math.log10(255 ** 2 / mse), 2) if mse else None}


def restore_migan(session, feeds, original, hole):
    raw = session.run(["result"], feeds)[0][0].transpose(1, 2, 0)
    # The upstream crop and resize can touch some pixels at the mask edge.
    # Keep the exact fixture border by compositing only pixels inside the mask.
    return np.where(hole[:, :, None], raw, original)


def hardware():
    cpu_info = Path("/proc/cpuinfo")
    if cpu_info.exists():
        for line in cpu_info.read_text().splitlines():
            if line.startswith("model name"):
                return line.split(":", 1)[1].strip()
    return platform.processor() or platform.machine()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cache", type=Path, required=True, help="local cache directory outside the site")
    parser.add_argument("--output", type=Path, required=True, help="generated WebP and benchmark directory")
    args = parser.parse_args()
    args.cache.mkdir(parents=True, exist_ok=True)
    args.output.mkdir(parents=True, exist_ok=True)

    model = pinned_download(args.cache, MODEL_FILE, f"{MODEL_SOURCE}/resolve/{MODEL_REVISION}/{MODEL_FILE}", MODEL_SHA256)
    options = ort.SessionOptions()
    options.intra_op_num_threads = THREADS
    options.inter_op_num_threads = 1
    session = ort.InferenceSession(str(model), sess_options=options, providers=["CPUExecutionProvider"])
    cv2.setNumThreads(THREADS)

    results = {}
    for key, photo in PHOTOS.items():
        filename = pinned_download(args.cache, f"{key}.jpg", photo["url"], photo["sha256"])
        reference, source, hole, highlight = fixture(photo, filename)
        rgb = np.asarray(source)
        image = np.ascontiguousarray(rgb.transpose(2, 0, 1)[None])
        keep = (~hole)[None, None].astype(np.uint8) * 255
        inpaint = hole.astype(np.uint8) * 255
        feeds = {"image": image, "mask": keep}

        migan, migan_times = benchmark(lambda: restore_migan(session, feeds, rgb, hole))
        telea, telea_times = benchmark(lambda: cv2.inpaint(rgb, inpaint, 3, cv2.INPAINT_TELEA))
        for result in (migan, telea):
            if result.shape != rgb.shape or result.dtype != np.uint8:
                raise ValueError(f"Invalid output shape or type: {key}")
            if not np.array_equal(result[~hole], rgb[~hole]) or np.array_equal(result[hole], rgb[hole]):
                raise ValueError(f"Invalid masked reconstruction: {key}")

        images = {"input": source, "mask": highlight, "reference": reference,
                  "migan": Image.fromarray(migan), "telea": Image.fromarray(telea)}
        for stage, image_file in images.items():
            image_file.save(args.output / f"{key}-{stage}.webp", format="WEBP", quality=89, method=6)
        truth = np.asarray(reference)
        results[key] = {"author": photo["author"], "source": photo["source"], "license": "public domain",
                        "maskPixels": int(np.count_nonzero(hole)),
                        "migan": {**migan_times, **masked_quality(truth, migan, hole)},
                        "telea": {**telea_times, **masked_quality(truth, telea, hole)}}

    report = {"date": date.today().isoformat(), "device": hardware(), "provider": "CPUExecutionProvider",
              "onnxRuntime": ort.__version__, "openCV": cv2.__version__, "batchSize": 1,
              "threads": THREADS, "warmups": WARMUPS, "runs": RUNS, "inputSize": list(SIZE),
              "timingScope": "Prepared image and mask to restored RGB. MI-GAN includes ONNX preprocessing and postprocessing plus exact-mask compositing. Excludes loading, fixture construction and encoding.",
              "modelTensorSize": [512, 512], "model": {"name": "MI-GAN-512 Places2 Pipeline v2",
              "source": f"{MODEL_SOURCE}/blob/{MODEL_REVISION}/{MODEL_FILE}", "sha256": MODEL_SHA256,
              "sizeBytes": model.stat().st_size, "license": "MIT"}, "scenes": results}
    (args.output / "benchmark.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({scene: {method: {k: value for k, value in metrics[method].items() if k != "samplesMs"}
                              for method in ("migan", "telea")} for scene, metrics in results.items()}, indent=2))


if __name__ == "__main__":
    main()
