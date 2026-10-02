import admin from 'firebase-admin';

// Initialize Firebase Admin SDK as a singleton
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || projectId
      });
    } catch (parseErr) {
      console.error('[FirebaseAdmin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', parseErr);
      admin.initializeApp({ projectId });
    }
  } else if (clientEmail && privateKey) {
    // Handle escaped newlines in environment variable
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId || '',
        clientEmail,
        privateKey
      }),
      projectId
    });
  } else {
    // Fallback for default cloud environment or project-scoped operations
    admin.initializeApp({
      projectId: projectId || undefined
    });
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export default admin;
