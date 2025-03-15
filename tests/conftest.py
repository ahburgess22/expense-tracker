import sys
import os
from pathlib import Path

# Add the parent directory to sys.path
parent_dir = Path(__file__).parent.parent
sys.path.insert(0, str(parent_dir))