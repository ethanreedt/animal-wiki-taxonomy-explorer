from django.db import models


class LTreeField(models.TextField):
    """Custom field for PostgreSQL ltree type."""

    def db_type(self, connection):
        return "ltree"

    def from_db_value(self, value, expression, connection):
        return value

    def get_prep_value(self, value):
        return value
