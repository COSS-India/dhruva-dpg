import uuid


class UUIDField:
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, value):
        if isinstance(value, str):
            try:
                uuid.UUID(value)
                return value
            except ValueError:
                raise ValueError("Invalid UUID")
        elif isinstance(value, uuid.UUID):
            return str(value)
        else:
            raise ValueError("Invalid UUID")

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string", format="uuid")
