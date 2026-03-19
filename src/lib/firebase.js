import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCVLDgx96k4PWSYZczNwzGM2oAJYCgglsw",
  authDomain: "motion-controller-team-335.firebaseapp.com",
  databaseURL: "https://motion-controller-team-335-default-rtdb.firebaseio.com",
  projectId: "motion-controller-team-335",
  storageBucket: "motion-controller-team-335.firebasestorage.app",
  messagingSenderId: "902498362954",
  appId: "1:902498362954:web:02178fc87f138309c1a8b3",
  measurementId: "G-QK9LP4E5EV",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export const signalRef = ref(db, "session/signal");
export const sensorDataRef = ref(db, "session/sensorData");

export { db, set, onValue };
