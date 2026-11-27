"""Serve the static site at loopback with GitHub Pages-style 404 handling."""
import argparse
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class Preview(SimpleHTTPRequestHandler):
    def send_error(self, code, message=None, explain=None):
        fallback = Path(self.directory) / "404.html"
        if code != HTTPStatus.NOT_FOUND or not fallback.is_file():
            return super().send_error(code, message, explain)
        content = fallback.read_bytes()
        self.send_response(code)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(content)


class PreviewServer(ThreadingHTTPServer):
    request_queue_size = 128


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8766)
    parser.add_argument("--directory", default=str(Path(__file__).resolve().parents[1]))
    options = parser.parse_args()
    with PreviewServer(("127.0.0.1", options.port), lambda *args: Preview(*args, directory=options.directory)) as server:
        server.serve_forever()
