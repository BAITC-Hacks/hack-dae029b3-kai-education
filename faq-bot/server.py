"""Локальный сайт FAQ: py -3 faq-bot/server.py."""
import argparse
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

from bot import answer, load_faq

WEB = Path(__file__).with_name("web")
FILES = {"/": ("index.html", "text/html"), "/styles.css": ("styles.css", "text/css"),
         "/app.js": ("app.js", "text/javascript")}


class Handler(BaseHTTPRequestHandler):
    def respond(self, status, content, mime):
        self.send_response(status)
        self.send_header("Content-Type", mime + "; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(content)

    def do_GET(self):
        url = urlsplit(self.path)
        if url.path == "/api/answer":
            question = parse_qs(url.query).get("q", [""])[0].strip()
            if not question or len(question) > 500:
                self.respond(400, b'{"error":"invalid question"}', "application/json")
                return
            try:
                result = {"answer": answer(question, load_faq())}
                self.respond(200, json.dumps(result, ensure_ascii=False).encode(), "application/json")
            except (OSError, ValueError):
                self.respond(500, b'{"error":"FAQ unavailable"}', "application/json")
        elif url.path in FILES:
            filename, mime = FILES[url.path]
            self.respond(200, (WEB / filename).read_bytes(), mime)
        elif url.path == "/favicon.ico":
            self.respond(204, b"", "image/x-icon")
        else:
            self.respond(404, b"Not found", "text/plain")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Локальный сайт Kai Education")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--open", action="store_true", help="Открыть сайт в браузере")
    args = parser.parse_args()
    server = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    print(f"Kai Education: http://127.0.0.1:{args.port} (Ctrl+C для остановки)", flush=True)
    if args.open:
        import webbrowser
        webbrowser.open(f"http://127.0.0.1:{args.port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
