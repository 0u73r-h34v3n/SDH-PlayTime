from typing import Optional


class AddTimeDTO:
    def __init__(self, **kwargs):
        self.started_at: int = kwargs.get("started_at")
        self.ended_at: int = kwargs.get("ended_at")
        self.game_id: str = kwargs.get("game_id")
        self.game_name: str = kwargs.get("game_name")
        self.user_id: Optional[str] = kwargs.get("user_id")

        self.validate_fields_rules()

    def validate_fields_rules(self):
        """Validate business logic constraints."""
        if not isinstance(self.started_at, int):
            raise ValueError('"started_at" must be a valid Unix timestamp (int)')

        if not isinstance(self.ended_at, int):
            raise ValueError('"ended_at" must be a valid Unix timestamp (int)')

        if self.started_at < 0:
            raise ValueError('"started_at" must be a non-negative timestamp')

        if self.ended_at < 0:
            raise ValueError('"ended_at" must be a non-negative timestamp')

        if self.ended_at <= self.started_at:
            raise ValueError('"ended_at" must be after "started_at"')

        if not isinstance(self.game_id, str) or not self.game_id.strip():
            raise ValueError('"game_id" must be a non-empty string')

        if not isinstance(self.game_name, str) or not self.game_name.strip():
            raise ValueError('"game_name" must be a non-empty string')

    def to_dict(self):
        return self.__dict__

    @classmethod
    def from_dict(cls, dict_obj):
        return cls(**dict_obj)
