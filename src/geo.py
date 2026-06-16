import h3


def _in_bbox(lat, lng, bbox):
    return (bbox["south"] <= lat <= bbox["north"]) and (bbox["west"] <= lng <= bbox["east"])


def add_h3(df, resolution, bbox):
    """Filter to bbox, add `h3` cell id and `hour`/`dow` time features."""
    mask = [_in_bbox(lat, lng, bbox) for lat, lng in zip(df["latitude"], df["longitude"])]
    df = df.loc[mask].copy()
    df["h3"] = [h3.latlng_to_cell(lat, lng, resolution)
                for lat, lng in zip(df["latitude"], df["longitude"])]
    df["hour"] = df["created_datetime"].dt.hour
    df["dow"] = df["created_datetime"].dt.dayofweek
    return df.reset_index(drop=True)
