import json
import pandas as pd

NULL_TOKENS = ["NULL", "null", "None", "NaN", ""]


def _parse_violation_types(value):
    """Parse the JSON-array string in violation_type; return [] on any failure."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return []
    try:
        parsed = json.loads(value)
    except (json.JSONDecodeError, TypeError):
        return []
    if not isinstance(parsed, list):
        return []
    return [str(v).strip().upper() for v in parsed]


def load_violations(path):
    """Load the violation CSV and return a cleaned DataFrame.

    - 'NULL'-like tokens -> NA
    - latitude/longitude -> numeric, created_datetime -> tz-aware datetime
    - violation_type JSON -> list column `violation_list`
    - vehicle_type normalized upper; rows missing geo/time dropped; ids deduped
    """
    df = pd.read_csv(path, dtype=str, keep_default_na=False, low_memory=False)
    df = df.replace(NULL_TOKENS, pd.NA)

    df["latitude"] = pd.to_numeric(df["latitude"], errors="coerce")
    df["longitude"] = pd.to_numeric(df["longitude"], errors="coerce")
    df["created_datetime"] = pd.to_datetime(df["created_datetime"], errors="coerce", utc=True)
    df["violation_list"] = df["violation_type"].apply(_parse_violation_types)
    df["vehicle_type"] = df["vehicle_type"].str.strip().str.upper()

    df = df.dropna(subset=["latitude", "longitude", "created_datetime"])
    df = df.drop_duplicates(subset=["id"]).reset_index(drop=True)
    return df
