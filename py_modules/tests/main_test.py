import unittest
import os
import shutil
import tempfile
from unittest.mock import MagicMock, patch
from py_modules.tests.helpers import remove_date_fields


class TestPlugin(unittest.IsolatedAsyncioTestCase):
    STORAGE_DB_FILENAME = "storage.db"

    @classmethod
    def setUpClass(cls):
        """Set up mock environment and dependencies before importing main.py."""
        cls.mock_decky_user_home = tempfile.mkdtemp()
        cls.mock_plugin_runtime_dir = tempfile.mkdtemp()
        cls.mock_plugin_dir = tempfile.mkdtemp()

        os.makedirs(os.path.join(cls.mock_plugin_dir, "py_modules"), exist_ok=True)

        mock_env = {
            "DECKY_USER_HOME": cls.mock_decky_user_home,
            "DECKY_PLUGIN_RUNTIME_DIR": cls.mock_plugin_runtime_dir,
            "DECKY_PLUGIN_DIR": cls.mock_plugin_dir,
        }

        cls.mock_decky = MagicMock()
        cls.mock_decky.logger = MagicMock()

        cls.mocked_modules = {
            "decky": cls.mock_decky,
        }

        cls.patcher_env = patch.dict("os.environ", mock_env, clear=True)
        cls.patcher_modules = patch.dict("sys.modules", cls.mocked_modules)
        cls.patcher_env.start()
        cls.patcher_modules.start()

        global main
        import main

        cls.main = main

        cls.addClassCleanup(cls.patcher_env.stop)
        cls.addClassCleanup(cls.patcher_modules.stop)
        cls.addClassCleanup(shutil.rmtree, cls.mock_decky_user_home)
        cls.addClassCleanup(shutil.rmtree, cls.mock_plugin_runtime_dir)
        cls.addClassCleanup(shutil.rmtree, cls.mock_plugin_dir)

    async def test_has_min_required_python_version(self):
        plugin = self.main.Plugin()
        with patch("sys.version_info", (3, 11, 0)):
            self.assertTrue(await plugin.has_min_required_python_version())
        with patch("sys.version_info", (3, 10, 9)):
            self.assertFalse(await plugin.has_min_required_python_version())

    async def test_get_decky_home(self):
        plugin = self.main.Plugin()
        result = await plugin.get_decky_home()
        self.assertEqual(result, self.mock_decky_user_home)

    async def test_apply_manual_time_correction(self):
        plugin = self.main.Plugin()
        await plugin._main()
        await plugin.apply_manual_time_correction(
            [
                {
                    "game": {
                        "id": "3536189763",
                        "name": "Grand Theft Auto: San Andreas",
                    },
                    "time": 28800,
                }
            ]
        )

        per_game_overall_statistics = await plugin.per_game_overall_statistics()
        self.assertEqual(
            remove_date_fields(per_game_overall_statistics),
            [
                {
                    "game": {
                        "id": "3536189763",
                        "name": "Grand Theft Auto: San Andreas",
                    },
                    "lastSession": {
                        "checksum": None,
                        "duration": 28800,
                        "migrated": "manually-changed",
                    },
                    "totalTime": 28800,
                    "sessions": [
                        {
                            "checksum": None,
                            "duration": 28800,
                            "migrated": "manually-changed",
                        }
                    ],
                }
            ],
        )

    async def test_unload_logs_message(self):
        plugin = self.main.Plugin()
        await plugin._unload()
        self.mock_decky.logger.info.assert_called_with("Goodnight, World!")

    async def test_uninstall_logs_message(self):
        plugin = self.main.Plugin()
        await plugin._uninstall()
        self.mock_decky.logger.info.assert_called_with("Goodbye, World!")


if __name__ == "__main__":
    unittest.main()
