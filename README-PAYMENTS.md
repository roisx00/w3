# Payment Verification Security Guide

To ensure maximum security and prevent transaction hash reuse (double-spending), the backend needs to check your Firestore database. This requires a **Firebase Service Account Key**.

## 1. Generate a Service Account Key
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project: `w3hub-eff8f`.
3. Click the ⚙️ (Gear icon) -> **Project Settings**.
4. Go to the **Service accounts** tab.
5. Click **Generate new private key**.
6. Download the JSON file.

## 2. Add to Environment Variables
Once you have the JSON file, you need to convert it to a single line and add it to your environment.

### Local Development (.env.local)
1. Open the JSON file and copy the entire content.
2. In your `.env.local`, add the following line (replace the content with your JSON):
   ```
   FIREBASE_SERVICE_ACCOUNT_KEY='{"type": "service_account", ...}'
   ```
   *Note: Ensure it is wrapped in single quotes.*

### Vercel Deployment
1. Go to your Vercel Project Settings.
2. Go to **Environment Variables**.
3. Add a new variable:
   - **Key**: `FIREBASE_SERVICE_ACCOUNT_KEY`
   - **Value**: (Paste the entire JSON content)

## 3. Current Status (Fallback Mode)
The system currently has a **Resilience Fallback** active. If this key is missing:
- **Blockchain Verification works**: It will still check Alchemy/BaseScan to verify the money was sent.
- **Duplicate Check is skipped**: The system will not check if the hash has been used before.

**Recommendation**: Add the key as soon as possible to enable full production-grade security.
