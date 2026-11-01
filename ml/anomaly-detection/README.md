# Anomaly detection

The robust median/MAD detector in `backend/core-api/app/intelligence.py` flags elevated latency, error fraction and CPU against recent history and absolute floors. Load-driven labels compare current traffic with the baseline. A degradation coinciding with traffic growth may be labelled load-driven; investigation must consider both causes.

Use synthetic incident injection for a regression check. Real data, quieter failures, changing baselines and missing observations require separate validation.
