"""Central constants for audio rates, batching, and Triton model names.
These are fixed here (not read from environment variables).
"""

# Audio sample rates
AUDIO_STANDARD_RATE_ASR: int = 16000
AUDIO_STANDARD_RATE_TTS: int = 22050

# Translation batching
TRANSLATION_MAX_BATCH_SIZE: int = 90

# Triton model names
TRITON_MODEL_NAME_NMT: str = "nmt"
TRITON_MODEL_NAME_TTS: str = "tts"
TRITON_MODEL_NAME_VAD: str = "vad"
TRITON_MODEL_NAME_TRANSLITERATION: str = "transliteration"


