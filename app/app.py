import streamlit as st
import pandas as pd
import os
from src import config
from src.app_utils import load_data_safe

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
        st.write("Visualizing the intensity of parking-induced congestion.")
        # Placeholder for map
        
    with tab2:
        st.subheader("Officer Deployment Strategy")
        st.dataframe(plan_df[plan_df["officers_assigned"] > 0])
        
    with tab3:
        st.subheader("System Performance")
        st.metric("Total Expected Relief", f"{plan_df['expected_relief'].sum():.1f} PCU-hours")

if __name__ == "__main__":
    main()
