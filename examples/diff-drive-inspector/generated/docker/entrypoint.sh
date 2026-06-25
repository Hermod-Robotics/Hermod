#!/bin/bash
# Hermod Simulation Entrypoint
set -e
source /opt/ros/humble/setup.bash
source /workspace/ros2_ws/install/setup.bash 2>/dev/null || true
exec "$@"
