# Small shared helpers

from datetime import datetime, timezone

def utc_now() :
    # datetime.utcnow() is deprecated in newer Python and scheduled for removal.
    # The replacement returns a timezone-aware value, but our DateTime columns are
    # naive, so drop the tzinfo back off to keep what gets stored identical.
    return datetime.now( timezone.utc ).replace( tzinfo=None )
