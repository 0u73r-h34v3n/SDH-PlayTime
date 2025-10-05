import unittest
from py_modules.utils.camel_case import to_camel_case, convert_keys_to_camel_case


class TestPlugin(unittest.IsolatedAsyncioTestCase):
    def test_to_camel_case(self):
        """Test snake_case to camelCase conversion."""
        self.assertEqual(to_camel_case("hello_world"), "helloWorld")
        self.assertEqual(to_camel_case("a_b_c_123"), "aBC123")
        self.assertEqual(to_camel_case("_leading_underscore"), "leadingUnderscore")
        self.assertEqual(to_camel_case("__two_leading"), "twoLeading")
        self.assertEqual(to_camel_case("alreadyCamel"), "alreadyCamel")

    def test_to_camel_case_edge_cases(self):
        """Test edge cases for to_camel_case."""
        self.assertEqual(to_camel_case(""), "")
        self.assertEqual(to_camel_case("A"), "a")  # <-- Note: lowercase 'a'
        self.assertEqual(to_camel_case("a"), "a")
        self.assertEqual(to_camel_case("1_2_3"), "123")
        self.assertEqual(to_camel_case("_"), "")
        self.assertEqual(to_camel_case("___"), "")

    def test_convert_keys_to_camel_case(self):
        """Test recursive dictionary key conversion to camelCase."""
        snake_data = {
            "user_id": 1,
            "user_profile": {
                "first_name": "John",
                "last_name": "Doe",
                "login_history": [
                    {"login_timestamp": "ts1", "device_info": "d1"},
                    {"login_timestamp": "ts2", "device_info": "d2"},
                ],
            },
        }
        camel_data = {
            "userId": 1,
            "userProfile": {
                "firstName": "John",
                "lastName": "Doe",
                "loginHistory": [
                    {"loginTimestamp": "ts1", "deviceInfo": "d1"},
                    {"loginTimestamp": "ts2", "deviceInfo": "d2"},
                ],
            },
        }
        self.assertEqual(convert_keys_to_camel_case(snake_data), camel_data)
        self.assertEqual(convert_keys_to_camel_case(123), 123)
        self.assertEqual(convert_keys_to_camel_case(None), None)
        self.assertEqual(convert_keys_to_camel_case("string"), "string")
