import os
import pytest

FIXTURE_DIR = os.path.join(os.path.dirname(__file__), "fixtures")


@pytest.fixture
def sample_csv():
    return os.path.join(FIXTURE_DIR, "sample_violations.csv")
