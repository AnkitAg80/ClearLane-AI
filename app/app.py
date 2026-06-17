import streamlit as st
import pandas as pd
import os
import pydeck as pdk
from src import config
from src.app_utils import load_data_safe, get_h3_layer

st.set_page_config(page_title="Gridlock - Congestion Prioritizer", layout="wide")

@st.cache_data
def load_app_data(processed_dir):
    """Cached loading of CII and deployment plan data."""
    cii = load_data_safe(os.path.join(processed_dir, "cell_cii.parquet"))
    plan = load_data_safe(os.path.join(processed_dir, "deployment_plan.parquet"))
    return cii, plan

def main():
    st.title("🚦 Gridlock: Congestion-Impact Enforcement")
    st.markdown("Quantifying violation impact to prioritize officer deployment.")
    
    cfg = config.load()
    processed_dir = cfg["data"]["processed_dir"]
    
    # Sidebar filters
    st.sidebar.header("Deployment Parameters")
    budget = st.sidebar.slider("Officer Budget", 0, 200, cfg["optimize"]["officer_budget"])
    
    # Data loading
    cii_df, plan_df = load_app_data(processed_dir)
    
    if cii_df is None or plan_df is None:
        st.error("Processed data artifacts not found. Please run: python -m src.pipeline --phase3")
        return

    # Tabs
    tab1, tab2, tab3 = st.tabs(["Impact Map", "Enforcement Plan", "ROI & Validation"])
    
    with tab1:
        st.subheader("Congestion Hotspots (CII)")
        
        # Color toggle
        color_mode = st.radio("Metric", ["CII (Impact)", "Raw Count"], horizontal=True)
        color_col = "cii" if color_mode == "CII (Impact)" else "weighted_impact"
        
        # Render map
        layer = get_h3_layer(cii_df, color_col)
        
        bbox = cfg["geo"]["bbox"]
        lat_center = (bbox["north"] + bbox["south"]) / 2
        lon_center = (bbox["east"] + bbox["west"]) / 2
        
        view_state = pdk.ViewState(latitude=lat_center, longitude=lon_center, zoom=11, bearing=0, pitch=45)
        
        st.pydeck_chart(pdk.Deck(
            layers=[layer],
            initial_view_state=view_state,
            tooltip={"text": f"Cell: {{h3}}\n{color_mode}: {{{color_col}}}"}
        ))
        
    with tab2:
        st.subheader("Officer Deployment Strategy")
        
        top_n = st.slider("Show Top N Hotspots", 10, 100, 50)
        
        # Filter and display
        active_plan = plan_df[plan_df["officers_assigned"] > 0].sort_values("expected_relief", ascending=False).head(top_n)
        
        st.dataframe(active_plan[["h3", "officers_assigned", "expected_relief", "pred_cii"]], use_container_width=True)
        
        # CSV Export
        csv = active_plan.to_csv(index=False).encode('utf-8')
        st.download_button(
            label="Download Deployment Plan (CSV)",
            data=csv,
            file_name='gridlock_deployment_plan.csv',
            mime='text/csv',
        )
        
    with tab3:
        st.subheader("System Performance")
        st.metric("Total Expected Relief", f"{plan_df['expected_relief'].sum():.1f} PCU-hours")

if __name__ == "__main__":
    main()
