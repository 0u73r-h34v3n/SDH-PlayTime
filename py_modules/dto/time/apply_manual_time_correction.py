from py_modules.schemas.common import Game
from py_modules.schemas.request import ApplyManualTimeCorrectionList


class ApplyManualTimeCorrectionDTO:
    def __init__(self, **kwargs):
        raw_entries = kwargs.get("entries", [])
        self.entries: list[ApplyManualTimeCorrectionList] = []
        self._load_entries(raw_entries)
        self.validate_required_fields()

    def _load_entries(self, raw_entries):
        for entry in raw_entries:
            game_data = entry["game"]
            game = Game(id=game_data["id"], name=game_data["name"])

            self.entries.append(
                ApplyManualTimeCorrectionList(game=game, time=entry["time"])
            )

    def validate_required_fields(self):
        if not isinstance(self.entries, list):
            raise ValueError('"entries" must be a list')

    def to_dict(self):
        return [
            {
                "game": {
                    "id": entry.game.id,
                    "name": entry.game.name,
                },
                "time": entry.time,
            }
            for entry in self.entries
        ]

    @classmethod
    def from_dict(cls, dict_obj):
        if not isinstance(dict_obj, list):
            raise ValueError("Input must be a list of game-time entries")
        return cls(entries=dict_obj)

    def __iter__(self):
        return iter(self.entries)
