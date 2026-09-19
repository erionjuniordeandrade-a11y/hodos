"""Serve an exported Hodos site with its public extensionless page routes."""
import argparse
import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit


class HodosHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        self._range_end = None
        range_header = self.headers.get("Range")
        if not range_header:
            return super().send_head()
        path = self.translate_path(self.path)
        if not os.path.isfile(path):
            return super().send_head()
        size = os.path.getsize(path)
        unit, separator, value = range_header.partition("=")
        if unit != "bytes" or not separator or "," in value:
            return self._range_error(size)
        start_text, separator, end_text = value.partition("-")
        try:
            if not separator:
                return self._range_error(size)
            if start_text:
                start = int(start_text)
                end = int(end_text) if end_text else size - 1
            else:
                suffix = int(end_text)
                if suffix <= 0:
                    return self._range_error(size)
                start = max(size - suffix, 0)
                end = size - 1
        except ValueError:
            return self._range_error(size)
        if start < 0 or start >= size or end < start:
            return self._range_error(size)
        end = min(end, size - 1)
        file = open(path, "rb")
        file.seek(start)
        self._range_end = end
        self.send_response(206)
        self.send_header("Content-type", self.guess_type(path))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Last-Modified", self.date_time_string(os.path.getmtime(path)))
        self.end_headers()
        return file

    def _range_error(self, size):
        self.send_response(416, "Requested Range Not Satisfiable")
        self.send_header("Content-Range", f"bytes */{size}")
        self.send_header("Content-Length", "0")
        self.end_headers()
        return None

    def copyfile(self, source, outputfile):
        if self._range_end is None:
            return super().copyfile(source, outputfile)
        remaining = self._range_end - source.tell() + 1
        while remaining > 0:
            block = source.read(min(64 * 1024, remaining))
            if not block:
                break
            outputfile.write(block)
            remaining -= len(block)

    def translate_path(self, path):
        parts = urlsplit(path)
        # Mirror Cloudflare Pages: an extensionless route serves its sibling .html file, and that
        # file wins over a same-named asset directory (/atlas, /lessons, /lessons/<id>).
        route = parts.path.rstrip("/")
        if route and "." not in route.rsplit("/", 1)[-1]:
            candidate = super().translate_path(route + ".html")
            if os.path.isfile(candidate):
                return candidate
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
