# Threaded static server for dist + scan page. Python 3.6+
import json
import socket
import socketserver
import sys
import webbrowser
from http.server import SimpleHTTPRequestHandler
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DIST = ROOT / 'dist'
PORT = 8765


def get_lan_url():
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.connect(('8.8.8.8', 80))
        ip = sock.getsockname()[0]
    except OSError:
        ip = '127.0.0.1'
    finally:
        sock.close()
    return 'http://{0}:{1}/'.format(ip, PORT)


def port_is_open():
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        return sock.connect_ex(('127.0.0.1', PORT)) == 0
    finally:
        sock.close()


class NailHandler(SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass

    def do_GET(self):
        path = self.path.split('?', 1)[0]
        if path == '/lan.json':
            body = json.dumps({'url': get_lan_url()}).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if path in ('/scan.html', '/qrcode.min.js'):
            fp = ROOT / path.lstrip('/')
            if fp.is_file():
                data = fp.read_bytes()
                ctype = 'text/html; charset=utf-8' if path.endswith('.html') else 'application/javascript'
                self.send_response(200)
                self.send_header('Content-Type', ctype)
                self.send_header('Content-Length', str(len(data)))
                self.end_headers()
                self.wfile.write(data)
                return
        rel = path.lstrip('/') or 'index.html'
        fp = (DIST / rel).resolve()
        if not str(fp).startswith(str(DIST.resolve())):
            self.send_error(403)
            return
        if fp.is_dir():
            fp = fp / 'index.html'
        if not fp.is_file():
            self.send_error(404)
            return
        data = fp.read_bytes()
        ext = fp.suffix.lower()
        ctype_map = {
            '.html': 'text/html; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.js': 'application/javascript; charset=utf-8',
            '.json': 'application/json; charset=utf-8',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.mp4': 'video/mp4',
            '.mov': 'video/quicktime',
            '.webm': 'video/webm',
        }
        ctype = ctype_map.get(ext, 'application/octet-stream')
        self.send_response(200)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)


class ThreadingServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True


def main():
    if not DIST.is_dir():
        print('Missing dist folder:', DIST)
        input('Press Enter to exit...')
        return 1
    if port_is_open():
        print('Server already running on port', PORT)
        webbrowser.open('http://127.0.0.1:{0}/scan.html'.format(PORT))
        input('Press Enter to close (server keeps running)...')
        return 0
    with ThreadingServer(('0.0.0.0', PORT), NailHandler) as httpd:
        print('')
        print('Huahua Nail - server running (keep this window open)')
        print('PC:   http://127.0.0.1:{0}/'.format(PORT))
        print('QR:   http://127.0.0.1:{0}/scan.html'.format(PORT))
        print('Phone:', get_lan_url(), '(same WiFi, not guest WiFi)')
        print('')
        webbrowser.open('http://127.0.0.1:{0}/scan.html'.format(PORT))
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
    return 0


if __name__ == '__main__':
    sys.exit(main() or 0)
