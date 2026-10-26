# Optional analytics consent

Google Analytics and Microsoft Clarity are enabled only after the visitor accepts optional analytics. The visitor can reopen **Cookie preferences** at any time to change that choice. Clarity is additionally restricted to `www.qasralmabrook.com`; Google Analytics follows the existing measurement ID configuration.

## Manual Microsoft Clarity setup

For Clarity project `z3oo92tnyo`, an owner must open **Settings** → **Setup** in the Clarity dashboard and turn off cookie setting by default so the project waits for the site's consent signal. Verify the resulting consent state in the project's developer tools after the setting is changed. This repository change does not access or modify the Clarity dashboard.

The site sends Clarity Consent API v2 state after an explicit choice: advertising storage remains denied, and analytics storage is granted only on acceptance. Rejecting or revoking acceptance sends denied state and the documented cookie-erasure command. This preference interface is not, by itself, a guarantee of legal compliance.

There is currently no privacy or cookie-information page in the site to link from the interface.
