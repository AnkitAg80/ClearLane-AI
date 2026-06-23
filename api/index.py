import os
import sys

# Ensure the root directory is in the python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.app import app
