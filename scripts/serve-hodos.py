"""Serve an exported Hodos site with its public extensionless page routes."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit


class HodosHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        parts = urlsplit(path)
        if parts.path in ("/atlas", "/atlas-sources", "/case-conference", "/mips"):
            path = urlunsplit(parts._replace(path=parts.path + ".html"))
        return super().translate_path(path)

    def list_directory(self, path):
        self.send_error(404, "Directory listing is disabled")
        return None


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--directory", required=True)
    parser.add_argument("--port", type=int, default=51038)
    parser.add_argument("--bind", default="127.0.0.1")
    args = parser.parse_args()
    directory = Path(args.directory).resolve()
    if not (directory / "release.json").is_file():
        parser.error("Use a built Hodos export directory containing release.json")
    handler = partial(HodosHandler, directory=str(directory))
    with ThreadingHTTPServer((args.bind, args.port), handler) as server:
        print(f"Hodos preview: http://{args.bind}:{args.port}", flush=True)
        server.serve_forever()
