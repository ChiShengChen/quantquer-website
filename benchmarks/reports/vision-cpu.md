# Generative vision CPU baseline

The public record compares MI-GAN-512 Places2 Pipeline v2 and OpenCV Telea with a three-pixel radius. Both methods use the same two 768 × 512 RGB fixtures with a known foreground mask and reference background. The model has a 512 × 512 internal tensor size. The benchmark runs the pinned published ONNX graph at its original precision. Input and composited output are 8-bit RGB.

| Item | Recorded setting |
| --- | --- |
| Hardware | Intel Core i9-12900KS desktop CPU |
| Execution provider | CPUExecutionProvider |
| Runtime | ONNX Runtime 1.19.2 and OpenCV 4.11.0 |
| Host OS version | Unrecorded |
| Batch and threads | Batch 1 and 4 worker threads |
| Warm-up and timed runs | 5 warm-up runs and 30 timed runs per method and scene |
| Model | MI-GAN-512 Places2 Pipeline v2, 28,079,181 bytes |
| Peak memory and power | Not yet measured |
| Target NPU and GPU | Not yet measured |

From the website checkout, install Python dependencies and run the script:

```sh
python -m pip install 'onnxruntime==1.19.2' 'opencv-python-headless==4.11.0.86' 'numpy<2' pillow
python scripts/reproduce-vision.py --cache /tmp/quantquer-models --output /tmp/quantquer-vision
```

The runner downloads the pinned public model and photographs and checks their SHA-256 digests. It writes an independent JSON report and representative output images. The interval starts from prepared image and mask and ends at restored RGB. MI-GAN timing includes model pre/postprocessing and exact-mask compositing. Download, model loading, input construction and image encoding are outside that interval. PSNR uses uncompressed masked pixels against the unobstructed photograph.

The hallway fixture favors MI-GAN on masked PSNR. The forest fixture favors Telea on the same metric. Automatic segmentation, video consistency, precision conversion, Diffusion, memory, power and acceleration each need their own validation. An NPU measurement would need the target device, firmware and runtime versions, model and precision variant, warm-up and sample counts, an operator placement or fallback report, and output quality checks.
