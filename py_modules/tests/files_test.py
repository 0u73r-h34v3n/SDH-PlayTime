import hashlib
import os
import unittest
from unittest.mock import patch

with patch.dict("os.environ", {"DECKY_PLUGIN_RUNTIME_DIR": "./python/tests/data"}):
    from py_modules.files import Files

CHUNK_SIZE = 16 * 1024 * 1024


class TestFiles(unittest.TestCase):
    files: Files = Files()

    # Helper method to create a temporary file for testing
    def create_temp_file(self, content):
        file_path = "temp_file"
        with open(file_path, "wb") as f:
            f.write(content)
        return file_path

    def test_empty_file(self):
        """Test case for empty file"""
        file_path = self.create_temp_file(b"")
        result = self.files.get_file_sha256(file_path)
        self.assertEqual(result, hashlib.sha256().hexdigest())
        os.remove(file_path)

    def test_small_file_within_chunk_size(self):
        """Test case for file smaller than 2 * chunk_size"""
        file_path = self.create_temp_file(b"hello")
        result = self.files.get_file_sha256(file_path)
        self.assertEqual(result, hashlib.sha256(b"hello").hexdigest())
        os.remove(file_path)

    def test_file_exactly_chunk_size(self):
        """Test case for file exactly the size of CHUNK_SIZE"""
        file_path = self.create_temp_file(b"A" * CHUNK_SIZE)
        result = self.files.get_file_sha256(file_path)
        self.assertEqual(result, hashlib.sha256(b"A" * CHUNK_SIZE).hexdigest())
        os.remove(file_path)

    def test_file_larger_than_two_chunks(self):
        """Test case for file larger than 2 * CHUNK_SIZE"""
        content = b"A" * (CHUNK_SIZE * 3)
        file_path = self.create_temp_file(content)

        expected_sha256 = hashlib.sha256()
        expected_sha256.update(content[:CHUNK_SIZE])
        expected_sha256.update(content[-CHUNK_SIZE:])
        expected_result = expected_sha256.hexdigest()

        result = self.files.get_file_sha256(file_path)
        self.assertEqual(result, expected_result)
        os.remove(file_path)

    def test_file_exactly_two_chunks(self):
        """Test case for file exactly 2 * CHUNK_SIZE"""
        file_path = self.create_temp_file(b"A" * (CHUNK_SIZE * 2))

        expected_sha256 = hashlib.sha256()
        expected_sha256.update(b"A" * CHUNK_SIZE)
        expected_sha256.update(b"A" * CHUNK_SIZE)
        expected_result = expected_sha256.hexdigest()

        result = self.files.get_file_sha256(file_path)
        self.assertEqual(result, expected_result)
        os.remove(file_path)

    def test_single_byte_file(self):
        """Test case for file with a single byte"""
        file_path = self.create_temp_file(b"A")
        result = self.files.get_file_sha256(file_path)
        self.assertEqual(result, hashlib.sha256(b"A").hexdigest())
        os.remove(file_path)

    def test_large_file(self):
        """Test case for large file to ensure performance"""
        file_path = self.create_temp_file(b"A" * (CHUNK_SIZE * 20))

        # Check if the function runs without errors and returns a valid hash
        try:
            result = self.files.get_file_sha256(file_path)
            self.assertEqual(len(result), 64)  # Check if it's a valid SHA-256 hash
        except Exception as e:
            self.fail(f"Large file test failed: {e}")

        os.remove(file_path)

    def test_file_with_special_characters(self):
        """Test case for file with special characters"""
        file_path = self.create_temp_file(b"@!#$%^&*()_+[]{}|;:'\"<>,./?")
        result = self.files.get_file_sha256(file_path)
        expected_sha256 = hashlib.sha256(b"@!#$%^&*()_+[]{}|;:'\"<>,./?").hexdigest()
        self.assertEqual(result, expected_sha256)
        os.remove(file_path)

    def test_parametrized(self):
        """Test case for parametrized inputs"""
        test_cases = [
            (b"A" * 1024, hashlib.sha256(b"A" * 1024).hexdigest()),
            (b"hello world", hashlib.sha256(b"hello world").hexdigest()),
        ]

        for content, expected_sha256 in test_cases:
            file_path = self.create_temp_file(content)
            result = self.files.get_file_sha256(file_path)
            self.assertEqual(result, expected_sha256)
            os.remove(file_path)


if __name__ == "__main__":
    unittest.main()
