# Optional analytics consent

Microsoft Clarity is the site's sole analytics platform. Clarity project `z3oo92tnyo` is initialized only after explicit acceptance and only when the server-observed host is `www.qasralmabrook.com`. Localhost, Preview deployments, and other hosts do not load Clarity.

The English and Arabic consent controls persist a first-party choice. With no saved choice or a rejection, the site does not load Clarity. Acceptance sends Consent API V2 with `ad_Storage: "denied"` and `analytics_Storage: "granted"`. Revoking acceptance sends both storage states as denied and calls Clarity's documented `consent` API with `false` to erase existing Clarity cookies. Application events continue to be dispatched locally as `qam:analytics`; when consent is accepted, their event names are also sent to Clarity's supported custom-event API. Event parameters are not sent to Clarity.

## Required Clarity project configuration

An authorized project owner must verify project `z3oo92tnyo` in the Clarity dashboard. Under **Settings → Setup**, turn off cookie setting by default so Clarity waits for consent, and verify that Consent Mode is enabled/compatible with Consent API V2. The dashboard has not been changed or verified by this repository task.

Microsoft's documentation describes Consent API V2 and consent-mode setup:

- [Clarity Consent API V2](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-consent-api-v2)
- [Clarity Consent Mode](https://learn.microsoft.com/en-us/clarity/setup-and-installation/consent-mode)

Automated unit tests validate the consent states and host gate. The Playwright test intercepts the Clarity endpoint and checks the local consent interactions; it does not prove that the production dashboard settings or deployed production tracking work. The consent interface alone does not guarantee legal compliance.

There is currently no privacy or cookie-information page in the site to link from the interface.
