"""Regression checks for isolation and explicit simulator selection."""
import contextlib
import io
import json
import os
from pathlib import Path
import runpy
import tempfile
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).with_name('select-ios-device.py')


class DeviceSelectionTests(unittest.TestCase):
    def run_selector(self, inventory, responses, override=None):
        with tempfile.TemporaryDirectory() as directory:
            inventory_path = Path(directory) / 'devices.json'
            inventory_path.write_text(json.dumps(inventory))
            env = {'LT_IOS_TABLET': override} if override else {}
            output = io.StringIO()
            with patch.dict(os.environ, env, clear=True), patch('sys.argv', [str(SCRIPT), str(inventory_path), 'tablet']), patch('subprocess.check_output', side_effect=responses) as command, contextlib.redirect_stdout(output):
                try:
                    runpy.run_path(str(SCRIPT), run_name='__main__')
                except SystemExit as error:
                    if error.code is not None:
                        raise
            return output.getvalue().strip(), command.call_args_list

    def test_creates_dedicated_device_in_newest_runtime(self):
        runtime = 'com.apple.CoreSimulator.SimRuntime.iOS-26-5'
        result, calls = self.run_selector({'devices': {runtime: []}}, [
            json.dumps({'runtimes': [
                {'identifier': runtime, 'version': '26.5', 'isAvailable': True},
                {'identifier': 'com.apple.CoreSimulator.SimRuntime.iOS-18-0', 'version': '18.0', 'isAvailable': True},
            ]}).encode(),
            json.dumps({'devicetypes': [{'name': 'iPad Pro 13-inch (M5)', 'identifier': 'ipad-m5'}]}).encode(),
            'created-udid\n',
        ])
        self.assertEqual(result, 'created-udid')
        self.assertEqual(calls[-1].args[0], ['xcrun', 'simctl', 'create', 'LT Screenshots tablet 26.5', 'ipad-m5', runtime])

    def test_override_requires_unique_match(self):
        with self.assertRaisesRegex(SystemExit, 'Expected one available simulator'):
            self.run_selector({'devices': {'runtime': [
                {'name': 'My iPad', 'udid': 'one'}, {'name': 'My iPad', 'udid': 'two'},
            ]}}, [], 'My iPad')

    def test_override_uses_exact_udid_without_creating_device(self):
        result, calls = self.run_selector({'devices': {'runtime': [
            {'name': 'My iPad', 'udid': 'one'},
        ]}}, [], 'one')
        self.assertEqual(result, 'one')
        self.assertEqual(calls, [])


if __name__ == '__main__':
    unittest.main()
