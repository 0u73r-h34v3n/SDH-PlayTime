from typing import Optional


class DailyStatisticsForPeriodDTO:
    __slots__ = ("start_date", "end_date", "game_id")

    def __init__(self, **kwargs):
        self.start_date = kwargs.get("start_date", None)
        self.end_date = kwargs.get("end_date", None)
        self.game_id = kwargs.get("game_id", None)

        self.validate_required_fields()

    def _validate_field(
        self, field_name: str, field_value: Optional[str], custom_message: str
    ):
        if field_value is None:
            raise ValueError(f'"{field_name}" {custom_message}')

    def validate_required_fields(self):
        fields = [
            ("start_date", self.start_date, '"start_date" must be a valid date'),
            ("end_date", self.end_date, '"end_date" must be a valid date'),
        ]

        for field_name, field_value, message in fields:
            self._validate_field(field_name, field_value, message)

    def to_dict(self):
        return self.__dict__

    @classmethod
    def from_dict(cls, dict_obj):
        return cls(**dict_obj)
