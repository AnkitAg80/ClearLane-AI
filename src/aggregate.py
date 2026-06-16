def explode_violations(df):
    """One row per (record × violation); empty violation lists drop out."""
    e = df.explode("violation_list").rename(columns={"violation_list": "violation"})
    return e.dropna(subset=["violation"]).reset_index(drop=True)


def cell_time_counts(df):
    """Violation counts per (h3, hour, dow)."""
    e = explode_violations(df)
    return e.groupby(["h3", "hour", "dow"]).size().reset_index(name="count")


def cell_totals(df):
    """Total violations per H3 cell."""
    e = explode_violations(df)
    return e.groupby("h3").size().reset_index(name="total")


def station_totals(df):
    """Total violations per police station."""
    e = explode_violations(df)
    return e.groupby("police_station").size().reset_index(name="violations")
