"""Verification scaffolding: run scripts/serve-hodos.py with a deeper listen backlog.

The stock server keeps http.server's backlog of 5. The atlas fires dozens of parallel
requests (GLB parcels, ranged tracts.bin), and the overflow shows up as ECONNRESET and
"Failed to fetch" in the browser. The site is fine; the preview server drops connections.
Usage: python3 serve.py --port N --directory dist/hodos
"""
import importlib.util, sys
sys.dont_write_bytecode = True
from functools import partial
from http.server import ThreadingHTTPServer
from pathlib import Path

spec = importlib.util.spec_from_file_location("serve_hodos", Path(__file__).resolve().parents[3] / "scripts/serve-hodos.py")
mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
ThreadingHTTPServer.request_queue_size = 256
ThreadingHTTPServer.daemon_threads = True
port = int(sys.argv[sys.argv.index("--port") + 1])
directory = Path(sys.argv[sys.argv.index("--directory") + 1]).resolve()
with ThreadingHTTPServer(("127.0.0.1", port), partial(mod.HodosHandler, directory=str(directory))) as s:
    print(f"ready {port}", flush=True)
    s.serve_forever()
