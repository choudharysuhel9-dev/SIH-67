"""
conftest.py
===========
Root pytest configuration for the ocean_data_layer test suite.

Ensures the project root is on sys.path so that both
``ocean_data_layer`` and ``tests`` can be imported cleanly
without installing the package.
"""
import sys
import os

# Insert project root at front of path
sys.path.insert(0, os.path.dirname(__file__))
