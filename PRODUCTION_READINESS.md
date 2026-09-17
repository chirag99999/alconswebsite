# ALCONS Production Readiness

## Deploy target

The active deploy target is the static site in the repository root, served by Firebase Hosting from `public: "."`.

The `alcons-astro` folder is a separate nested project and is excluded from Firebase Hosting deploys.

## Pre-deploy checks

1. Confirm Firebase CLI is signed in:
   `firebase login`
2. Confirm the target project:
   `firebase use alcons-3e8ee`
3. Run a local smoke test:
   `python -m http.server 4173`
4. Deploy Firestore rules and hosting:
   `firebase deploy --only firestore:rules,hosting`
5. Enable Firebase Storage in the Firebase console before deploying storage rules:
   `firebase deploy --only storage`

## Admin access

Admin read/write access is restricted to Firebase Auth users with a custom claim:

```json
{ "admin": true }
```

Set the claim from a trusted admin environment with the Firebase Admin SDK before relying on `/admin.html` in production.

## Storage

Firebase Storage is referenced by the admin helper, but the project must have Storage initialized before `storage.rules` can deploy.

## Lead Capture

Lead submissions are written to the Firestore collection `leads`. The form also supports an optional email relay through:

```js
window.ALCONS_FORM_ENDPOINT = "https://api.web3forms.com/submit";
window.ALCONS_FORM_KEY = "your-access-key";
```

Do not place private server-side secrets in client HTML or JavaScript.
