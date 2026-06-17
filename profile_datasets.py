"""Quick profiler for the two hackathon datasets. Concise output only."""
import json
import pandas as pd

VIOL = r"dataset\jan to may police violation_anonymized791b166.csv"
# EVENT = r"C:\Users\ankit\Downloads\Astram event data_anonymized - Astram event data_anonymizedb40ac87.csv"

def line(): print("-" * 60)

# ---------------- VIOLATION (Theme 1) ----------------
print("=" * 60); print("THEME 1  — PARKING VIOLATIONS"); print("=" * 60)
v = pd.read_csv(VIOL, low_memory=False)
print("rows:", len(v), "| cols:", v.shape[1])
print("lat/long null %:", round(v.latitude.isna().mean()*100, 2), "/", round(v.longitude.isna().mean()*100, 2))
v["dt"] = pd.to_datetime(v.created_datetime, errors="coerce", utc=True)
print("date range:", v.dt.min(), "->", v.dt.max())
print("distinct police_station:", v.police_station.nunique(), "| junction_name:", v.junction_name.nunique())
print("vehicle_type top5:", dict(v.vehicle_type.value_counts().head(5)))
print("validation_status:", dict(v.validation_status.value_counts(dropna=False).head(5)))
# explode violation_type JSON arrays
def parse(s):
    try: return json.loads(s)
    except Exception: return []
vt = v.violation_type.dropna().map(parse).explode()
print("distinct violation types:", vt.nunique())
print("top violation types:")
for k, n in vt.value_counts().head(12).items():
    print(f"   {n:>7}  {k}")
line()

# # ---------------- EVENT (Theme 2) ----------------
# print("=" * 60); print("THEME 2  — EVENTS / INCIDENTS"); print("=" * 60)
# e = pd.read_csv(EVENT, low_memory=False)
# print("rows:", len(e), "| cols:", e.shape[1])
# print("lat/long null %:", round(e.latitude.isna().mean()*100, 2), "/", round(e.longitude.isna().mean()*100, 2))
# print("event_type:", dict(e.event_type.value_counts(dropna=False)))
# print("event_cause top10:", dict(e.event_cause.value_counts(dropna=False).head(10)))
# print("requires_road_closure:", dict(e.requires_road_closure.value_counts(dropna=False)))
# print("priority:", dict(e.priority.value_counts(dropna=False)))
# es = pd.to_datetime(e.start_datetime, errors="coerce", utc=True)
# print("date range:", es.min(), "->", es.max())
# # duration where resolved/closed present
# end = pd.to_datetime(e.resolved_datetime.fillna(e.closed_datetime), errors="coerce", utc=True)
# dur = (end - es).dt.total_seconds() / 60.0
# dur = dur[(dur > 0) & (dur < 60*24*7)]
# print("events with usable duration:", dur.notna().sum(),
#       "| median min:", round(dur.median(), 1) if dur.notna().sum() else "n/a")
# print("distinct zone:", e.zone.nunique(), "| corridor:", e.corridor.nunique())
