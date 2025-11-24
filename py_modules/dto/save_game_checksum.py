from typing import Optional


class AddGameChecksumDTO:
    __slots__ = (
        "game_id",
        "checksum",
        "algorithm",
        "chunk_size",
        "created_at",
        "updated_at",
    )

    def __init__(self, **kwargs):
        self.game_id = kwargs.get("game_id", None)
        self.checksum = kwargs.get("checksum", None)
        self.algorithm = kwargs.get("algorithm", None)
        self.chunk_size = kwargs.get("chunk_size", None)
        self.created_at = kwargs.get("created_at", None)
        self.updated_at = kwargs.get("updated_at", None)

        self.validate_required_fields()

    def _validate_field(
        self, field_name: str, field_value: Optional[str], custom_message: str
    ):
        if field_value is None:
            raise ValueError(f'"{field_name}" {custom_message}')

    def validate_required_fields(self):
        fields = [
            ("game_id", self.game_id, '"game_id" can not be null'),
            ("checksum", self.checksum, '"checksum" can not be null'),
            (
                "algorithm",
                self.algorithm,
                "\"algorithm\" must be: 'SHA224', 'SHA256', 'SHA384', 'SHA512', 'SHA3_224', 'SHA3_256', 'SHA3_384', 'SHA3_512'",
            ),
            ("chunk_size", self.chunk_size, '"chunk_size" must be a valid integer'),
        ]

        for field_name, field_value, message in fields:
            self._validate_field(field_name, field_value, message)

    def to_dict(self):
        return self.__dict__

    @classmethod
    def from_dict(cls, dict_obj):
        return cls(**dict_obj)
