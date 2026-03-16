# Mobile Sensor Practice

A two-page web app that streams accelerometer data from a mobile phone to a desktop dashboard in real time using **Firebase Realtime Database**.

| Page | Opened on | Purpose |
|------|-----------|---------|
| `controller.html` | Mobile phone | Reads the accelerometer and sends data to Firebase |
| `main.html` | Desktop / laptop | Sends start/stop signals, displays live data and chart |

---

## Third-Party Libraries

| Library | Version | CDN | Why it's used |
|---------|---------|-----|---------------|
| **Firebase JS SDK (compat)** | 10.12.0 | `gstatic.com/firebasejs/…` | Provides the Realtime Database that both pages use to communicate. The *compat* build exposes the classic `firebase.database()` API so it works directly in `<script>` tags without a bundler. |
| **Chart.js** | 4.4.3 | `cdn.jsdelivr.net/npm/chart.js` | Draws the live acceleration-vs-time line graph on the main page. Chosen for its zero-dependency UMD bundle, simple API, and good performance with streaming data. |

No build tools, bundlers, or `npm install` are required — everything is loaded from CDNs.

---

## Setup

### 1. Create a Firebase project

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project (or use an existing one).
2. In **Build → Realtime Database**, click **Create Database**.
   - Choose any region.
   - For testing, select **Start in test mode** (allows open read/write for 30 days). For production, configure proper security rules.
3. In **Project Settings → General → Your apps**, click the **Web** (`</>`) icon to register a web app.
4. Copy the config object that Firebase shows you.

### 2. Paste your Firebase config

Open **both** `controller.html` and `main.html` and replace the placeholder `firebaseConfig` object with your real values:

```js
const firebaseConfig = {
    apiKey:            "YOUR_REAL_API_KEY",
    authDomain:        "your-project.firebaseapp.com",
    databaseURL:       "https://your-project-default-rtdb.firebaseio.com",
    projectId:         "your-project",
    storageBucket:     "your-project.appspot.com",
    messagingSenderId: "123456789012",
    appId:             "1:123456789012:web:abc123def456"
};
```

### 3. Serve the pages over HTTPS

The Accelerometer API (`DeviceMotionEvent`) requires a **secure context** (HTTPS) on most mobile browsers. Options:

- **GitHub Pages** — push the repo and enable Pages in Settings.
- **Firebase Hosting** — run `firebase init hosting` then `firebase deploy`.
- **Local dev** — use a tool like [serve](https://www.npmjs.com/package/serve) or VS Code's Live Server extension and access via `https://` (you may need a self-signed cert or use `ngrok`/`localhost.run` to tunnel).

### 4. Use the app

1. Open `main.html` on your desktop browser.
2. Open `controller.html` on your mobile phone browser (same Firebase project).
3. On the phone, tap **Enable Sensors** (grants accelerometer permission on iOS).
4. On the desktop, click **Start** — the phone begins streaming data.
5. Watch the live numbers and chart update on the desktop.
6. Click **Stop** to end the session.

---

## How It Works

```
controller.html                  Firebase RTDB                  main.html
─────────────                    ────────────                   ─────────
                                 /session/signal ◄──── writes "start"/"stop"
listens for signal ◄──────────── /session/signal
                                 
reads DeviceMotionEvent
throttles to 10 Hz
writes sensor data ──────────► /session/sensorData
                                 /session/sensorData ──────► listens, displays,
                                                              updates chart
```

### Data sent per sample

```json
{
  "acceleration":                 { "x": 0.12, "y": -0.34, "z": 9.78 },
  "accelerationIncludingGravity": { "x": 0.15, "y": -0.30, "z": 0.02 },
  "timestamp": 1710600000000
}
```

### Throttle rate

The controller sends data at **10 Hz** (one sample every 100 ms). This balances smooth visuals on the dashboard with reasonable Firebase write usage. You can adjust `SEND_INTERVAL_MS` in `controller.html`.

---

## Firebase Database Rules (Test Mode)

For quick testing the default test-mode rules work:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

For production, lock it down to authenticated users or specific paths.

---

## Browser Compatibility Notes

- **iOS Safari 13+**: Requires `DeviceMotionEvent.requestPermission()` triggered by a user gesture — handled by the "Enable Sensors" button.
- **Android Chrome**: Motion events are available without a permission prompt on most devices.
- **Desktop browsers**: Will connect to Firebase and display data, but won't generate meaningful accelerometer readings unless the device has a sensor.
