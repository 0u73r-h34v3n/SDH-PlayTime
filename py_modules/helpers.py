from datetime import date, datetime, timedelta

DATE_FORMAT = "%Y-%m-%d"
DATE_WITH_HOURS_FORMAT = "%Y-%m-%dT%H:%M:%S"


def parse_date(date_str: str) -> date:
    return datetime.strptime(date_str, DATE_FORMAT).date()


def parse_date_with_hours(date_str: str) -> date:
    date_without_microseconds = date_str.split(".", 1)[0]

    return datetime.strptime(date_without_microseconds, DATE_WITH_HOURS_FORMAT)


def format_date(dt: datetime) -> str:
    return dt.strftime(DATE_FORMAT)


def end_of_day(day_to_end: datetime) -> datetime:
    return datetime.fromtimestamp(
        datetime.combine(
            day_to_end + timedelta(days=1), datetime.min.time()
        ).timestamp()
        - 1
    )


def start_of_week(date: datetime):
    return date - timedelta(days=date.weekday())


def end_of_week(date: datetime):
    return start_of_week(date) + timedelta(days=6)
