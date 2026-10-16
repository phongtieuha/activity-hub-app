# OneNS — Activity Hub App

A React Native (Expo) proof-of-concept mobile app for booking national service activities and taking attendance. It has two roles, **Participant** and **Manager**, and talks to the Activity Hub backend API.

## Demo

- **Demo link:** [Google Drive demo folder](https://drive.google.com/drive/folders/18ddajeCurJb5dyKmfMphpXnuZ0Xv2Vl8?usp=sharing)

## Features

### Authentication

- Pick a role on the landing screen: **Login as Participant** or **Login as Manager**
- Choose a seeded demo user from a picker, then verify with a 6-digit OTP
- Auth token stored in AsyncStorage and attached to every API request as a Bearer token
- Returning users with a valid session go straight to their role's home screen
- Log out from the Settings tab

### Participant

- **Home dashboard**
  - Personalised greeting
  - **Actions required**: activities that are starting soon or ongoing
  - **Scheduled**: upcoming activities, with today's activities highlighted
- **View activity**
  - Activity details: type, attire, date and time, remarks, slot availability (high/low)
  - Calendar and timeline view of slots
  - **Book** a slot, **change** to another slot, or **cancel** a booking (with confirmation)
  - **Generate QR** for the booked slot, which a manager scans to mark attendance
  - **Walk-in QR** to register for a slot without booking
  - Auto-refreshing QR codes; screen brightness is raised while a QR is shown and restored afterwards
- **Scan attendance**: scan a manager's QR code with the camera to check yourself in

### Manager

- **Home dashboard**: starting soon, ongoing and upcoming activities (Actions required and Scheduled)
- **View activity**
  - Activity details with a "now" card for live activities
  - Calendar and timeline view of slots
  - **Generate QR** for a slot so participants can scan to check in
  - Shortcuts to Update attendance, Documents and Manage activity
- **Scan attendance**
  - Scan participant QR codes to mark them present
  - Scan walk-in QR codes to register and check in walk-in participants
  - Live list of participants marked present or late
- **Update attendance**
  - Summary counts: total, present, absent, fall out, excused
  - Select participants and set their status (Present, Absent, Fall Out, Excused)
- **Documents**: list of documents attached to an activity
- **Manage activity**: placeholder screen

### App-wide

- Native tab bar (`NativeTabs`) and native back buttons, with separate route groups per role (`app/(participant)`, `app/(manager)`)
- Light and dark mode
- Global toast notifications for API success and errors
- Haptic feedback on API responses
- Spinners and loading buttons for in-flight mutations
- Error boundary and a not-found screen
- All dates and times shown in Singapore time (`Asia/Singapore`) via Luxon

## Tech stack

- [Expo](https://expo.dev) SDK 54, React Native 0.81, React 19
- [Expo Router](https://docs.expo.dev/router/introduction) (file-based routing)
- [gluestack-ui](https://gluestack.io) + [NativeWind](https://www.nativewind.dev) (Tailwind CSS)
- Reanimated, `expo-camera` (QR scanning), `expo-brightness`, `expo-haptics`
- Axios with a generated, typed API client (`__generated-client/http-client-integration.ts`)
- `jsqr` + `upng-js` for decoding QR codes returned as PNG images
- `react-native-calendars`, `lucide-react-native`, Luxon

## Project structure

```
app/
  index.tsx                 # Landing, login and OTP
  logout.tsx
  (participant)/            # Participant tabs, view-activity, scan-attendance
  (manager)/                # Manager tabs, view-activity, scan-attendance,
                            # update-attendance, documents, manage-activity
components/
  app/                      # Feature components (cards, calendar, timeline, QR scanner)
  ui/                       # gluestack-ui components
hooks/                      # Axios instance, notifications, QR decoding, date helpers
models/                     # Client-side types and mappings
constants/                  # Demo login users, colours, animations
__generated-client/         # Generated API client
```

## Getting started

1. Install dependencies

   ```bash
   npm install
   ```

2. Set the backend URL in `.env`

   ```bash
   EXPO_PUBLIC_API_URL=http://<your-host>:9100
   ```

3. Start the app

   ```bash
   npm start          # Expo dev server
   npm run ios        # iOS simulator
   npm run android    # Android emulator
   npm run ios-device # Run on a connected iOS device
   ```

QR scanning needs a camera, so test it on a physical device.

## Scripts

| Script                                    | Description                                    |
| ----------------------------------------- | ---------------------------------------------- |
| `npm start`                               | Start the Expo dev server (clears cache)       |
| `npm run ios` / `android` / `web`         | Start on a platform                            |
| `npm run ios-device`                      | Build and run on a connected iOS device        |
| `npm run production:ios-device`           | Release build on a connected iOS device        |
| `npm run build:dev` / `preview` / `production` | EAS iOS builds for each profile in `eas.json` |
| `npm run lint`                            | Run ESLint                                     |
| `npm run format` / `format:check`         | Format or check formatting with Prettier       |
| `npm run doctor`                          | Run Expo Doctor                                |
