def to_camel_case(snake_str):
    """Convert snake_case to camelCase. Preserve internal capitalization."""
    components = snake_str.split("_")
    components = [c for c in components if c]
    if not components:
        return ""
    first = components[0]
    result = first[:1].lower() + first[1:]
    for comp in components[1:]:
        if comp:
            result += comp[:1].upper() + comp[1:]
    return result


def convert_keys_to_camel_case(data):
    """
    Recursively converts all keys in a dictionary or a list of dictionaries
    from snake_case to camelCase.

    Args:
        data: A dict, list, or other py_modules object.

    Returns:
        A new object with all dictionary keys converted to camelCase.
        Non-dict and non-list items are returned as is.
    """
    if isinstance(data, dict):
        new_dict = {}
        for key, value in data.items():
            new_key = to_camel_case(key)
            new_dict[new_key] = convert_keys_to_camel_case(value)
        return new_dict

    elif isinstance(data, list):
        return [convert_keys_to_camel_case(item) for item in data]

    else:
        return data
