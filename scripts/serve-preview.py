from __future__ import annotations

import argparse
import mimetypes
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


mimetypes.add_type("image/webp", ".webp")
mimetypes.add_type("image/avif", ".avif")
mimetypes.add_type("image/svg+xml", ".svg")


class PortfolioPreviewHandler(SimpleHTTPRequestHandler):
    def send_error(
        self,
        code: int,
        message: str | None = None,
        explain: str | None = None,
    ) -> None:
        if code != 404:
            super().send_error(code, message, explain)
            return

        error_file = Path(self.directory) / "404.html"
        try:
            content = error_file.read_bytes()
        except OSError:
            super().send_error(code, message, explain)
            return

        self.send_response(404, "Not Found")
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(content)

    def list_directory(self, path: str):
        self.send_error(404)
        return None


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Serve the portfolio locally with its custom 404 page.",
    )
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8787)
    parser.add_argument(
        "--directory",
        default=str(Path(__file__).resolve().parent.parent),
    )
    args = parser.parse_args()

    root = Path(args.directory).resolve()
    handler = lambda *handler_args, **handler_kwargs: PortfolioPreviewHandler(
        *handler_args,
        directory=str(root),
        **handler_kwargs,
    )

    server = ThreadingHTTPServer((args.host, args.port), handler)
    print(f"Serving {root} at http://{args.host}:{args.port}/")
    server.serve_forever()


if __name__ == "__main__":
    main()
