import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, deleteDoc, query, where, writeBatch } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCi3tGd4zsfU_LpVZssmwHrVYG4g2ADzBQ",
  authDomain: "researchapplication-3085c.firebaseapp.com",
  projectId: "researchapplication-3085c",
  storageBucket: "researchapplication-3085c.firebasestorage.app",
  messagingSenderId: "946478457724",
  appId: "1:946478457724:web:db2f0f90d87cc008adfaf9",
  measurementId: "G-JDEN15WPZ6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function runCleanup() {
  console.log("Starting cleanup for korojitha@gmail.com and all auditLogs...");

  // 1. Find user with email korojitha@gmail.com
  const usersQ = query(collection(db, "users"), where("email", "==", "korojitha@gmail.com"));
  const usersSnap = await getDocs(usersQ);
  
  const targetUids = new Set();
  usersSnap.forEach(d => {
    targetUids.add(d.id);
    console.log(`Found target user UID: ${d.id}`);
  });

  // If UID was not found by where query, let's also scan users collection
  const allUsersSnap = await getDocs(collection(db, "users"));
  allUsersSnap.forEach(d => {
    const data = d.data();
    if (data.email && data.email.toLowerCase() === "korojitha@gmail.com") {
      targetUids.add(d.id);
      console.log(`Scanned target user UID: ${d.id}`);
    }
  });

  console.log("Target UIDs found:", Array.from(targetUids));

  // 2. Delete Portfolios and their subcollections
  const portSnap = await getDocs(collection(db, "portfolios"));
  for (const docSnap of portSnap.docs) {
    const data = docSnap.data();
    const shouldDelete = targetUids.has(data.userId) || 
      (data.userEmail && data.userEmail.toLowerCase() === "korojitha@gmail.com") ||
      (data.userName && data.userName.toLowerCase().includes("korojitha"));
    
    if (shouldDelete) {
      console.log(`Deleting portfolio ${docSnap.id} for user ${data.userId}`);
      
      // Subcollections: versions & holdings
      try {
        const versionsSnap = await getDocs(collection(db, "portfolios", docSnap.id, "versions"));
        for (const vDoc of versionsSnap.docs) {
          await deleteDoc(vDoc.ref);
        }
        const holdingsSnap = await getDocs(collection(db, "portfolios", docSnap.id, "holdings"));
        for (const hDoc of holdingsSnap.docs) {
          await deleteDoc(hDoc.ref);
        }
      } catch (e) {
        console.warn("Subcollection cleanup notice:", e);
      }
      
      await deleteDoc(docSnap.ref);
    }
  }

  // 3. Delete Orders
  const ordersSnap = await getDocs(collection(db, "orders"));
  for (const docSnap of ordersSnap.docs) {
    const data = docSnap.data();
    if (targetUids.has(data.userId)) {
      console.log(`Deleting order ${docSnap.id}`);
      await deleteDoc(docSnap.ref);
    }
  }

  // 4. Delete Subscriptions
  const subsSnap = await getDocs(collection(db, "subscriptions"));
  for (const docSnap of subsSnap.docs) {
    const data = docSnap.data();
    if (targetUids.has(data.userId)) {
      console.log(`Deleting subscription ${docSnap.id}`);
      await deleteDoc(docSnap.ref);
    }
  }

  // 5. Delete Payments
  const paymentsSnap = await getDocs(collection(db, "payments"));
  for (const docSnap of paymentsSnap.docs) {
    const data = docSnap.data();
    if (targetUids.has(data.userId)) {
      console.log(`Deleting payment ${docSnap.id}`);
      await deleteDoc(docSnap.ref);
    }
  }

  // 6. Delete Entitlements
  const entSnap = await getDocs(collection(db, "entitlements"));
  for (const docSnap of entSnap.docs) {
    const data = docSnap.data();
    if (targetUids.has(data.userId) || docSnap.id.startsWith("korojitha")) {
      console.log(`Deleting entitlement ${docSnap.id}`);
      await deleteDoc(docSnap.ref);
    }
  }

  // 7. Delete all auditLogs
  const auditSnap = await getDocs(collection(db, "auditLogs"));
  console.log(`Found ${auditSnap.size} audit log records to delete.`);
  for (const docSnap of auditSnap.docs) {
    console.log(`Deleting auditLog ${docSnap.id}`);
    await deleteDoc(docSnap.ref);
  }

  console.log("Cleanup completed successfully!");
}

runCleanup().catch(err => {
  console.error("Cleanup error:", err);
  process.exit(1);
});
