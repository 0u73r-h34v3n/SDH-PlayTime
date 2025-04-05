# https://www.geeksforgeeks.org/sha-in-python/
import hashlib
import os
import sys

data_dir = os.environ["DECKY_PLUGIN_RUNTIME_DIR"]

# 16MB
CHUNK_SIZE = 16 * 1024 * 1024


class Files:
    # NOTE(ynhhoJ): https://stackoverflow.com/a/44873382
    def get_file_sha256(self, file_path: str, chunk_size: int = CHUNK_SIZE) -> str:
        """
        Compute a SHA256 hash of the first and last `chunk` of a file.
        If the file is smaller than `chunk_size`, hash the entire file.

        Args:
            `file_path` (str): Path to the file.

        Returns:
            str: `sha256` hex digest of the file.
        """

        if sys.version_info < (3, 11):
            raise RuntimeError(
                "Minimum required version of Python is 3.11.0 which supports: hashlib.file_digest"
            )

        file_size = os.path.getsize(file_path)
        hasher = hashlib.sha256()

        with open(file_path, "rb") as f:
            if file_size <= chunk_size * 2:
                return hashlib.file_digest(f, "sha256").hexdigest()

            first_chunk = f.read(chunk_size)
            hasher.update(memoryview(first_chunk))

            f.seek(-chunk_size, os.SEEK_END)
            last_chunk = f.read(chunk_size)
            hasher.update(memoryview(last_chunk))

        return hasher.hexdigest()
