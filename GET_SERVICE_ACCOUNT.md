# Getting Firebase Service Account Key

To complete the backend Firebase setup, you need to get the **Service Account Private Key**:

## Steps:

1. **Go to Firebase Console**: https://console.firebase.google.com/

2. **Select your project**: `velora-1b9c2`

3. **Navigate to Project Settings**:
   - Click the ⚙️ (gear icon) next to "Project Overview"
   - Select "Project settings"

4. **Go to Service Accounts tab**:
   - Click on the "Service accounts" tab at the top

5. **Generate new private key**:
   - Click the button "Generate new private key"
   - Confirm by clicking "Generate key"
   - A JSON file will download automatically

6. **Update your backend `.env` file**:
   - Open the downloaded JSON file
   - Copy the values to `c:\velora-app\backend\.env`:

```env
FIREBASE_PROJECT_ID=velora-1b9c2
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@velora-1b9c2.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...(paste the entire private_key value here)...\n-----END PRIVATE KEY-----\n"
```

## Important Notes:

- The `FIREBASE_CLIENT_EMAIL` will look like: `firebase-adminsdk-xxxxx@velora-1b9c2.iam.gserviceaccount.com`
- The `FIREBASE_PRIVATE_KEY` must keep the `\n` characters (they represent newlines)
- Keep the double quotes around the private key
- **Never commit this file to Git!** (it's already in `.gitignore`)

## Enable Firestore Database:

1. In Firebase Console, click "Firestore Database" in the left menu
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select your region
5. Click "Enable"

## After Setup:

Once you've updated the `.env` file with the correct values, restart the backend server:

```bash
cd c:\velora-app\backend
npm run dev
```

You should see: "Firebase Firestore connected successfully"
