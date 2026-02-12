from http.server import BaseHTTPRequestHandler
import json
import phonenumbers
from phonenumbers import geocoder, carrier, timezone


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode("utf-8"))

            phone_number = data.get("phone_number", "").strip()

            if not phone_number:
                self._send_error(400, "Phone number is required.")
                return

            # Ensure the number starts with +
            if not phone_number.startswith("+"):
                phone_number = "+" + phone_number

            # Parse the phone number
            try:
                parsed_number = phonenumbers.parse(phone_number, None)
            except phonenumbers.NumberParseException as e:
                self._send_error(400, f"Invalid phone number format: {str(e)}")
                return

            # Validate the phone number
            is_valid = phonenumbers.is_valid_number(parsed_number)
            is_possible = phonenumbers.is_possible_number(parsed_number)

            # Get location description
            location = geocoder.description_for_number(parsed_number, "en")

            # Get carrier info
            carrier_name = carrier.name_for_number(parsed_number, "en")

            # Get timezone info
            time_zones = timezone.time_zones_for_number(parsed_number)
            time_zone_list = list(time_zones) if time_zones else []

            # Get country code and Flag
            country_code = phonenumbers.region_code_for_number(parsed_number)
            
            # Helper to get flag emoji from country code
            def get_flag(code):
                if not code or code == "Unknown": return "🌐"
                return "".join(chr(127397 + ord(c)) for c in code.upper())
            
            flag = get_flag(country_code)

            # Get number type
            number_type_map = {
                phonenumbers.PhoneNumberType.FIXED_LINE: "Fixed Line",
                phonenumbers.PhoneNumberType.MOBILE: "Mobile",
                phonenumbers.PhoneNumberType.FIXED_LINE_OR_MOBILE: "Fixed Line or Mobile",
                phonenumbers.PhoneNumberType.TOLL_FREE: "Toll Free",
                phonenumbers.PhoneNumberType.PREMIUM_RATE: "Premium Rate",
                phonenumbers.PhoneNumberType.SHARED_COST: "Shared Cost",
                phonenumbers.PhoneNumberType.VOIP: "VoIP",
                phonenumbers.PhoneNumberType.PERSONAL_NUMBER: "Personal Number",
                phonenumbers.PhoneNumberType.PAGER: "Pager",
                phonenumbers.PhoneNumberType.UAN: "UAN",
                phonenumbers.PhoneNumberType.VOICEMAIL: "Voicemail",
                phonenumbers.PhoneNumberType.UNKNOWN: "Unknown",
            }
            num_type = phonenumbers.number_type(parsed_number)
            number_type_str = number_type_map.get(num_type, "Unknown")

            # Format the number
            formatted_international = phonenumbers.format_number(
                parsed_number, phonenumbers.PhoneNumberFormat.INTERNATIONAL
            )
            formatted_national = phonenumbers.format_number(
                parsed_number, phonenumbers.PhoneNumberFormat.NATIONAL
            )
            formatted_e164 = phonenumbers.format_number(
                parsed_number, phonenumbers.PhoneNumberFormat.E164
            )

            result = {
                "success": True,
                "data": {
                    "phone_number": phone_number,
                    "is_valid": is_valid,
                    "is_possible": is_possible,
                    "location": location if location else "Unknown",
                    "carrier": carrier_name if carrier_name else "Unknown",
                    "carrier_note": "Info based on original series allocation. Ported numbers (MNP) may differ.",
                    "timezones": time_zone_list,
                    "country_code": country_code if country_code else "Unknown",
                    "flag": flag,
                    "number_type": number_type_str,
                    "formatted": {
                        "international": formatted_international,
                        "national": formatted_national,
                        "e164": formatted_e164,
                    },
                },
            }

            self._send_json(200, result)

        except json.JSONDecodeError:
            self._send_error(400, "Invalid JSON payload.")
        except Exception as e:
            self._send_error(500, f"Internal server error: {str(e)}")

    def _send_json(self, status_code, data):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def _send_error(self, status_code, message):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(
            json.dumps({"success": False, "error": message}).encode("utf-8")
        )
