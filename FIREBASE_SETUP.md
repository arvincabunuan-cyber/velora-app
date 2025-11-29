# Firebase Setup Instructions

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter your project name (e.g., "velora-delivery")
4. Follow the setup wizard

## 2. Enable Firestore Database

1. In your Firebase project, click on "Firestore Database" in the left menu
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select your preferred location
5. Click "Enable"

## 3. Get Firebase Credentials

1. In Firebase Console, click the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Go to the "Service accounts" tab
4. Click "Generate new private key"
5. Save the JSON file securely (DO NOT commit this to git!)

## 4. Configure Backend Environment

1. Open the downloaded JSON file
2. Copy the values to your `.env` file:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
```

**Important Notes:**
- The private key should include the `\n` characters for newlines
- Keep the quotes around the private key
- Never share or commit these credentials

## 5. Firestore Security Rules (Development)

For development, you can use these rules (in Firebase Console → Firestore → Rules):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ Warning:** These rules allow anyone to read/write. Change for production!

## 6. Production Security Rules (Example)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Products collection
    match /products/{productId} {
      allow read: if true;
      allow create, update, delete: if request.auth != null;
    }
    
    // Orders collection
    match /orders/{orderId} {
      allow read, write: if request.auth != null;
    }
    
    // Deliveries collection
    match /deliveries/{deliveryId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 7. Test Your Connection

Once configured, start your backend:
```bash
cd backend
npm run dev
```

You should see: "Firebase Firestore connected successfully"
