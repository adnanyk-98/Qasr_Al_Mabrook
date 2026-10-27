# About Us locale metadata

The current Preview's English and Arabic About Us routes render the safe fallback content (“About” / “حول” and the localized unavailable-content message). This indicates there is no published exact-locale About Us translation available for either route in the Preview data.

The routes therefore omit `hreflang` alternates rather than treating fallback text as an equivalent translation, and mark the page `noindex` when the requested exact-locale translation is absent. Once both English and Arabic About Us translations are published, the metadata helper emits reciprocal production-canonical alternates automatically.
