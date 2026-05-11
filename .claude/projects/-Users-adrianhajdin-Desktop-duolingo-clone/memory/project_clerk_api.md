---
name: Clerk API version in use
description: @clerk/expo 3.x uses a new signal-based API — not the classic useSignUp/useSignIn with setActive/isLoaded
type: project
---

@clerk/expo 3.2.10 (installed) uses the new "Future" signal-based API:

- `useSignUp()` → `{ signUp: SignUpFutureResource, errors, fetchStatus }` — NO `setActive` or `isLoaded`
- `useSignIn()` → `{ signIn: SignInFutureResource, errors, fetchStatus }` — NO `setActive` or `isLoaded`
- `useSSO()` replaces deprecated `useOAuth()`

**Sign-up flow:**
```
signUp.password({ emailAddress, password }) → { error }
signUp.verifications.sendEmailCode() → { error }
signUp.verifications.verifyEmailCode({ code }) → { error }
signUp.finalize({ navigate: ({ decorateUrl }) => router.replace(decorateUrl("/") as Href) })
```

**Sign-in with email OTP (passwordless — matches existing UI with email-only field):**
```
signIn.emailCode.sendCode({ emailAddress }) → { error }
signIn.emailCode.verifyCode({ code }) → { error }
signIn.finalize({ navigate: ({ decorateUrl }) => router.replace(decorateUrl("/") as Href) })
```

**Social SSO:**
```
const { startSSOFlow } = useSSO();
const { createdSessionId, setActive } = await startSSOFlow({ strategy: "oauth_google", redirectUrl: Linking.createURL("/") });
if (createdSessionId && setActive) { await setActive({ session: createdSessionId }); router.replace("/"); }
```

**Error display:** Use `errors.fields.emailAddress?.message`, `errors.fields.code?.message`, `errors.global?.[0]?.message`
**Loading state:** Use `fetchStatus === "fetching"` instead of `isLoaded`

**Why:** @clerk/expo 3.x completely replaced the classic API (useSignUp returning SignUpResource with create/prepareEmailAddressVerification/attemptEmailAddressVerification/setActive). The new API uses reactive signals.

**How to apply:** Always use the Future resource API when writing auth code. Never use the classic `signUp.create()`, `signUp.prepareEmailAddressVerification()`, or `setActive` from useSignUp/useSignIn hooks.
