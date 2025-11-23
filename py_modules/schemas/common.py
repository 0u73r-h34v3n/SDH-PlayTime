from dataclasses import dataclass
from typing import Literal
import sys

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


@dataclass(slots=True)
class Game:
    id: str
    name: str
    
    def __post_init__(self):
        object.__setattr__(self, 'id', sys.intern(self.id))
        object.__setattr__(self, 'name', sys.intern(self.name))
