"""Slugify utility for project output directory names."""
import re
import unicodedata


def slugify(text: str) -> str:
    """Convert text to a clean directory-safe slug.

    Strip diacritics, lowercase, replace non-alphanumeric with _, collapse multiples.

    Examples:
        "Chiến dịch giải cứu F-15E" → "chien_dich_giai_cuu_f_15e"
        "A Day in My Life (Realistic)" → "a_day_in_my_life_realistic"
        "Pippip's Fish Market" → "pippips_fish_market"
    """
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "_", text)
    text = re.sub(r"_+", "_", text).strip("_")
    return text
