try:
    import sklearn
    import joblib
    print(f"Sklearn version: {sklearn.__version__}")
    print(f"Joblib version: {joblib.__version__}")
except ImportError as e:
    print(f"Error: {e}")
