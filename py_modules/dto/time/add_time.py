from typing import Optional


class AddTimeDTO:
    __slots__ = ('started_at', 'ended_at', 'game_id', 'game_name')

    def __init__(self, **kwargs):
        self.started_at = kwargs.get("started_at", None)
        self.ended_at = kwargs.get("ended_at", None)
        self.game_id = kwargs.get("game_id", None)
        self.game_name = kwargs.get("game_name", None)

        self.validate_required_fields()

    def _validate_field(
        self, field_name: str, field_value: Optional[str], custom_message: str
    ):
        if field_value is None:
            raise ValueError(f'"{field_name}" {custom_message}')

    def validate_required_fields(self):
        fields = [
            ("started_at", self.started_at, '"started_at" must be a valid date'),
            ("ended_at", self.ended_at, '"ended_at" must be a valid date'),
            ("game_id", self.game_id, '"game_id" can not be null'),
            ("game_name", self.game_name, '"game_name" must be a valid value'),
        ]

        for field_name, field_value, message in fields:
            self._validate_field(field_name, field_value, message)

    def to_dict(self):
        return self.__dict__

    @classmethod
    def from_dict(cls, dict_obj):
        return cls(**dict_obj)
