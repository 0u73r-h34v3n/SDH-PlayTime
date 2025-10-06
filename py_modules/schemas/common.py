from dataclasses import dataclass
from typing import Literal

ChecksumAlgorithm = Literal[
    "SHA224",
    "SHA256",
    "SHA384",
    "SHA512",
    "SHA3_224",
    "SHA3_256",
    "SHA3_384",
    "SHA3_512",
]


@dataclass
class Game:
    id: str
    name: str
