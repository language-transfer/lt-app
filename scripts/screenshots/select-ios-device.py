"""Pick dedicated screenshot simulators without touching a developer's devices."""
import json
import os
import subprocess
import sys

inventory_path, size = sys.argv[1:]
with open(inventory_path) as inventory_file:
    inventory = json.load(inventory_file)
devices = [device for group in inventory['devices'].values() for device in group]
override = os.environ.get(f'LT_IOS_{size.upper()}')
if override:
    matches = [device for device in devices if override in (device['name'], device['udid'])]
    if len(matches) != 1:
        sys.exit(f'Expected one available simulator matching {override!r}; use a UDID.')
    print(matches[0]['udid'])
    sys.exit()
# Select the newest installed iOS runtime, and create our own device in it.
runtimes = json.loads(subprocess.check_output(['xcrun', 'simctl', 'list', 'runtimes', '--json']))['runtimes']
runtimes = [runtime for runtime in runtimes if runtime.get('isAvailable') and '.iOS-' in runtime['identifier']]
if not runtimes:
    sys.exit('No iOS runtime installed. Install one in Xcode Settings > Components.')
runtime = max(runtimes, key=lambda item: tuple(map(int, item['version'].split('.'))))
types = json.loads(subprocess.check_output(['xcrun', 'simctl', 'list', 'devicetypes', '--json']))['devicetypes']
# Prefer the largest Pro phone and iPad for store captures.
needle = 'Pro Max' if size == 'phone' else 'iPad Pro 13-inch'
candidates = [item for item in types if needle in item['name']]
if not candidates and size == 'tablet':
    candidates = [item for item in types if 'iPad Pro (12.9-inch)' in item['name']]
if not candidates:
    sys.exit(f'No suitable {size} device type. Set LT_IOS_{size.upper()}.')
# Xcode lists current device generations before older ones.
device_type = candidates[0]
name = f'LT Screenshots {size} {runtime["version"]}'
existing = [item for item in inventory['devices'].get(runtime['identifier'], []) if item['name'] == name]
if existing:
    print(existing[0]['udid'])
else:
    print(subprocess.check_output(['xcrun', 'simctl', 'create', name, device_type['identifier'], runtime['identifier']], text=True).strip())
