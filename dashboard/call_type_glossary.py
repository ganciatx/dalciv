"""
Brief plain-language descriptions for Dallas PD ``nature_of_call`` dispatch codes.

Used by the police map sidebar tooltips and popups. Keys match values from
Socrata dataset 9fxf-t2tr; unknown codes get a short generic fallback.
"""
from __future__ import annotations

# Full strings as returned by Dallas Open Data (primary lookup).
CALL_TYPE_DESCRIPTIONS: dict[str, str] = {
    "07 - Minor Accident": (
        "Traffic crash with minor damage or injuries; typically no major road closure."
    ),
    "09/01 - Theft": (
        "Theft or larceny report; officers take a report and may search for suspects."
    ),
    "16 - Injured Person": (
        "Someone hurt or ill; police respond to assist and may request medical aid."
    ),
    "16A - Injured Person w/Amb": (
        "Injured or ill person; ambulance already requested or expected on scene."
    ),
    "19 - Shooting": (
        "Gunfire or shooting reported; high-priority response to locate victims and suspects."
    ),
    "20 - Robbery": (
        "Robbery in progress or just occurred; force or threat used to take property."
    ),
    "22 - Animal Disturbance": (
        "Loose, injured, or aggressive animal; animal services may be involved."
    ),
    "24 - Abandoned Property": (
        "Suspected abandoned vehicle, building, or property needing a police check."
    ),
    "32 - Suspicious Person": (
        "Caller reports someone acting suspiciously; officers check the area and person."
    ),
    "37F - Freeway Blockage": (
        "Obstruction or incident blocking freeway lanes; traffic and safety priority."
    ),
    "40 - Other": (
        "Miscellaneous call not matching a specific code; general police response."
    ),
    "40/01 - Other": (
        "Miscellaneous call (alternate code); general police response."
    ),
    "41/40 - Other - In Progress": (
        "Miscellaneous in-progress incident; officers responding to active situation."
    ),
    "46 - CIT": (
        "Crisis Intervention Team call—mental health crisis; trained officers respond."
    ),
    "6G - Random Gun Fire": (
        "Shots heard or random gunfire reported; no confirmed victim yet."
    ),
    "6M - Loud Music Disturbance": (
        "Noise complaint, often loud music or party; officers mediate or enforce ordinance."
    ),
    "6X - Major Dist (Violence)": (
        "Serious disturbance involving violence or threat; multiple units may respond."
    ),
    "6XA - Major Dist  Ambulance": (
        "Violent disturbance with injuries; ambulance requested or on the way."
    ),
    "6XE - Disturbance Emergency": (
        "Urgent disturbance—escalating fight, threat, or crowd; priority response."
    ),
    "7X - Major Accident": (
        "Serious traffic crash—major injuries, entrapment, or significant road blockage."
    ),
    "DAEF-Dist Armed Encounter Foot": (
        "Distressed person with a weapon on foot; tactical/caution response."
    ),
    "DASF-Dist Active Shooter Foot": (
        "Possible active shooter on foot; highest-priority tactical response."
    ),
}

# Code-only fallback when the suffix text differs slightly from the catalog.
CODE_PREFIX_DESCRIPTIONS: dict[str, str] = {
    "07": CALL_TYPE_DESCRIPTIONS["07 - Minor Accident"],
    "09/01": CALL_TYPE_DESCRIPTIONS["09/01 - Theft"],
    "16": CALL_TYPE_DESCRIPTIONS["16 - Injured Person"],
    "16A": CALL_TYPE_DESCRIPTIONS["16A - Injured Person w/Amb"],
    "19": CALL_TYPE_DESCRIPTIONS["19 - Shooting"],
    "20": CALL_TYPE_DESCRIPTIONS["20 - Robbery"],
    "22": CALL_TYPE_DESCRIPTIONS["22 - Animal Disturbance"],
    "24": CALL_TYPE_DESCRIPTIONS["24 - Abandoned Property"],
    "32": CALL_TYPE_DESCRIPTIONS["32 - Suspicious Person"],
    "37F": CALL_TYPE_DESCRIPTIONS["37F - Freeway Blockage"],
    "40": CALL_TYPE_DESCRIPTIONS["40 - Other"],
    "40/01": CALL_TYPE_DESCRIPTIONS["40/01 - Other"],
    "41/40": CALL_TYPE_DESCRIPTIONS["41/40 - Other - In Progress"],
    "46": CALL_TYPE_DESCRIPTIONS["46 - CIT"],
    "6G": CALL_TYPE_DESCRIPTIONS["6G - Random Gun Fire"],
    "6M": CALL_TYPE_DESCRIPTIONS["6M - Loud Music Disturbance"],
    "6X": CALL_TYPE_DESCRIPTIONS["6X - Major Dist (Violence)"],
    "6XA": CALL_TYPE_DESCRIPTIONS["6XA - Major Dist  Ambulance"],
    "6XE": CALL_TYPE_DESCRIPTIONS["6XE - Disturbance Emergency"],
    "7X": CALL_TYPE_DESCRIPTIONS["7X - Major Accident"],
    "DAEF": (
        "Distressed armed encounter (foot); person with weapon, officers use caution."
    ),
    "DASF": (
        "Possible active shooter on foot; immediate tactical response."
    ),
}

_DEFAULT = (
    "Dallas PD dispatch code from the active-calls feed; "
    "officers respond per department protocol for this classification."
)


def _extract_code(nature: str) -> str:
    """Leading code token before `` - `` or hyphenated prefix (e.g. ``DAEF-...``)."""
    if " - " in nature:
        return nature.split(" - ", 1)[0].strip()
    if "-" in nature and not nature[0].isdigit():
        return nature.split("-", 1)[0].strip()
    return nature.strip()


def describe_call_type(nature: str) -> str:
    """Return a short tooltip description for a ``nature_of_call`` value."""
    text = (nature or "").strip()
    if not text:
        return "Call type not specified in the dispatch feed."

    if text in CALL_TYPE_DESCRIPTIONS:
        return CALL_TYPE_DESCRIPTIONS[text]

    lower = text.lower()
    for key, desc in CALL_TYPE_DESCRIPTIONS.items():
        if key.lower() == lower:
            return desc

    code = _extract_code(text)
    if code in CODE_PREFIX_DESCRIPTIONS:
        return CODE_PREFIX_DESCRIPTIONS[code]

    # Hyphenated codes without space (DAEF-Dist...)
    upper = code.upper()
    if upper in CODE_PREFIX_DESCRIPTIONS:
        return CODE_PREFIX_DESCRIPTIONS[upper]

    return _DEFAULT
