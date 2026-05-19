# Juniper Referral Submission Form

A static HTML form that submits referrals to the Juniper Experience API. Designed for testing and demonstration — simulates what an Epic user would send.

## Local Development

1. Edit `config.js` with your API details:
   ```js
   window.JUNIPER_CONFIG = {
       apiBaseUrl: 'https://your-app.us-e1.cloudhub.io/api',
       clientId: 'your-client-id',
       clientSecret: 'your-client-secret'
   };
   ```
2. Start a local server:
   ```bash
   npm start
   ```
3. Open [http://localhost:8080](http://localhost:8080)

Alternatively, just open `index.html` directly in your browser — `config.js` loads via a `<script>` tag, so no HTTP server is required.

## Deploying to GitHub Pages

1. Create a new GitHub repository and push this project
2. Edit `config.js` with your API credentials
3. Go to **Settings → Pages** → set **Source** to **Deploy from a branch** → select `main` and `/ (root)`
4. The form will be live at `https://<your-username>.github.io/<repo-name>/`

## CORS Requirement

The Experience API must have the **CORS policy** enabled in Anypoint API Manager:

1. Go to **API Manager** → your Experience API instance
2. Click **Policies** → **Add Policy**
3. Select **CORS** and configure:
   - **Allowed Origins**: `*` (or `https://<your-username>.github.io`)
   - **Allowed Methods**: `POST, OPTIONS`
   - **Allowed Headers**: `client_id, client_secret, content-type`
4. Apply the policy

Without CORS enabled, the browser will block the request and the form will show a CORS error.

## Form Fields

The form matches the `ReferralIntake` RAML type exactly:

| Field | Required | Notes |
|---|---|---|
| Patient First Name | Yes | |
| Patient Last Name | Yes | |
| Date of Birth | Yes | `date-only` (yyyy-MM-dd) |
| Patient Email | Yes | |
| Patient Phone | No | |
| MRN | Yes | |
| Referral Sender | Yes | |
| Diagnosis Name | Yes | |
| ICD-10 Code | Yes | |
| Referring Provider | Yes | |
| Payer Name | Yes | |
| Member ID | Yes | |
| Reason for Referral | No | |

Only plain HTML, CSS, and JS — no frameworks or build steps required.