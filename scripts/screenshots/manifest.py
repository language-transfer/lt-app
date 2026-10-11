"""Record capture provenance and actual PNG dimensions without imaging dependencies."""
import datetime
import json
import hashlib
from pathlib import Path
import struct
import subprocess
import sys

platform, size, device, artifact, destination, mode = sys.argv[1:]
shots = {}
if mode == 'capture':
    for path in sorted(Path(destination).glob('*.png')):
        with path.open('rb') as image:
            header = image.read(24)
        if header[:8] != b'\x89PNG\r\n\x1a\n':
            sys.exit(f'Invalid PNG: {path}')
        width, height = struct.unpack('>II', header[16:24])
        shots[path.name] = {'width': width, 'height': height}
try:
    revision = subprocess.check_output(['git', 'rev-parse', 'HEAD'], stderr=subprocess.DEVNULL, text=True).strip()
    dirty = bool(subprocess.check_output(['git', 'status', '--porcelain'], text=True).strip())
except subprocess.CalledProcessError:
    revision, dirty = 'unknown', True
artifact_path = Path(artifact)
digest = hashlib.sha256()
files = sorted(path for path in artifact_path.rglob('*') if path.is_file()) if artifact_path.is_dir() else [artifact_path]
for path in files:
    if artifact_path.is_dir():
        digest.update(str(path.relative_to(artifact_path)).encode())
        digest.update(b'\0')
    with path.open('rb') as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b''):
            digest.update(chunk)
if platform == 'android':
    model = subprocess.check_output(['adb', '-s', device, 'shell', 'getprop', 'ro.product.model'], text=True).strip()
    os_version = subprocess.check_output(['adb', '-s', device, 'shell', 'getprop', 'ro.build.version.release'], text=True).strip()
else:
    inventory = json.loads(subprocess.check_output(['xcrun', 'simctl', 'list', 'devices', '--json']))
    runtime, selected = next((runtime, item) for runtime, items in inventory['devices'].items() for item in items if item['udid'] == device)
    model, os_version = selected['name'], runtime
manifest = {
    'platform': platform, 'size': size, 'device': device,
    'capturedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'sourceRevision': revision, 'workingTreeDirty': dirty,
    'artifact': artifact_path.name, 'artifactSha256': digest.hexdigest(),
    'deviceName': model, 'osVersion': os_version, 'mode': mode, 'screenshots': shots,
}
# Preparing a simulator must not overwrite provenance of previous captures.
if mode == 'capture':
    (Path(destination) / 'capture.json').write_text(json.dumps(manifest, indent=2) + '\n')
