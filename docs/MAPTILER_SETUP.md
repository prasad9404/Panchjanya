# MapLibre + MapTiler Streets v2 Setup

A complete reference for using **MapLibre GL JS** (web) and **@maplibre/maplibre-react-native** (mobile) with the **MapTiler Streets v2** base map in this project.

---

## 🔑 Getting a Free MapTiler API Key

1. Go to **[cloud.maptiler.com](https://cloud.maptiler.com)** and click **Sign up free**.
2. Confirm your e-mail — no credit card required.
3. In the dashboard, navigate to **API Keys** → **+ Create a key**.
4. Give it a name (e.g. `panchjanya-dev`) and click **Create**.
5. Copy the generated key (it looks like `abc123xyz...`).

> **Free tier:** 100,000 map tile requests / month. More than enough for development and small-scale production.

---

## 🗂️ File Structure

```
/web
  MapComponent.jsx   ← MapLibre GL JS React component
  map.css            ← Custom marker + popup styles
/mobile
  MapScreen.tsx      ← React Native component (@maplibre/maplibre-react-native)
.env                 ← API keys (never commit this to git)
.env.example         ← Template — safe to commit
```

---

## 🌐 Web Setup (MapLibre GL JS)

### 1 — Install (already done in this project)

```bash
npm install maplibre-gl
```

### 2 — Add your API key to `.env`

```dotenv
VITE_MAPTILER_KEY=your_actual_key_here
```

### 3 — Use the component

```tsx
import MapComponent from '@/web/MapComponent';

const locations = [
  { id: 1, name: 'Mumbai',  lat: 19.076,  lng: 72.8777, description: 'Financial capital of India' },
  { id: 2, name: 'Delhi',   lat: 28.6139, lng: 77.209,  description: 'Capital of India' },
];

export default function App() {
  return (
    <div style={{ width: '100%', height: '600px' }}>
      <MapComponent
        locations={locations}
        center={[78.96, 20.59]}  // [lng, lat]  — India center
        zoom={5}
      />
    </div>
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `locations` | `LocationItem[]` | `[]` | Array of pin objects |
| `center` | `[lng, lat]` | India center | Initial map center |
| `zoom` | `number` | `5` | Initial zoom level |

### LocationItem shape

```ts
{
  id:           number | string   // Unique identifier
  name:         string            // Shown in popup title (bold)
  lat:          number            // Latitude
  lng:          number            // Longitude
  description?: string            // Optional subtitle in popup
}
```

### Map style features (MapTiler Streets v2)

| Feature | Detail |
|---------|--------|
| Water | Soft muted blue |
| Country borders | Visible dark gray |
| State/province borders | Lighter dashed gray |
| Labels | English + local script (auto) |
| Terrain / hillshade | ❌ None |
| Marker | Flat circle, `#2D6A4F`, 2 px white border, drop-shadow |
| Popup | White card, rounded corners, bold location name |
| Controls | Navigation (zoom + compass) at bottom-right |

---

## 📱 Mobile Setup (React Native)

### 1 — Install dependencies

```bash
npm install @maplibre/maplibre-react-native react-native-config
```

### 2 — iOS (run pod install after npm install)

```bash
cd ios && pod install && cd ..
```

### 3 — Android `AndroidManifest.xml`

Add inside `<manifest>`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

### 4 — API key via react-native-config

Create (or update) your `.env` file in the **React Native project root**:

```dotenv
MAPTILER_KEY=your_actual_key_here
```

Access in code via:

```ts
import Config from 'react-native-config';
const apiKey = Config.MAPTILER_KEY;
```

> ⚠️ **Never hardcode API keys directly in source files.**

### 5 — iOS info.plist (react-native-config)

Follow the [react-native-config iOS instructions](https://github.com/luggit/react-native-config#ios) to link the build phase that makes the `.env` variables available.

### 6 — Use the screen

```tsx
import MapScreen from '@/mobile/MapScreen';

const locations = [
  { id: 1, name: 'Mumbai',  lat: 19.076,  lng: 72.8777, description: 'Financial capital' },
  { id: 2, name: 'Delhi',   lat: 28.6139, lng: 77.209,  description: 'Capital of India' },
];

export default function App() {
  return <MapScreen locations={locations} />;
}
```

---

## 🎨 Design Spec

| Element | Value |
|---------|-------|
| Marker color | `#2D6A4F` (brand green) |
| Marker border | `2px solid #ffffff` |
| Marker shadow | `0 2px 6px rgba(0,0,0,0.25)` |
| Active marker | Darker green `#1a5e3f` + pulse ring |
| Popup background | `#ffffff` |
| Popup border-radius | `12px` |
| Popup shadow | Multi-layer soft shadow |
| Popup name | `font-weight: 700`, `color: #1a1a1a` |
| Popup description | `font-size: 12px`, `color: #6b7280` |

---

## 🔐 Security Notes

- **`.env` is already in `.gitignore`** — your API key will not be committed.
- For production, restrict your MapTiler key to your domain in the **MapTiler dashboard → API Keys → Allowed origins**.
- The mobile key is managed by `react-native-config` and is **not** bundled in plain-text in the JS bundle.

---

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| Map tiles don't load | Check `VITE_MAPTILER_KEY` is set and the key is valid in the MapTiler dashboard |
| `maplibre-gl` CSS missing | Ensure `import 'maplibre-gl/dist/maplibre-gl.css'` is in your component |
| React Native: map is blank | Run `pod install` on iOS; check INTERNET permission on Android |
| React Native: Config undefined | Follow [react-native-config setup](https://github.com/luggit/react-native-config) |
| Markers not appearing | Ensure `locations` array items have valid `lat` and `lng` numbers |
