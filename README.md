# 📱 PhoneTracer — Track Phone Number Location

A stunning, full-stack web application that tracks phone number locations using Python. Enter any international phone number to instantly discover its **location**, **carrier**, **timezone**, **number type**, and see the approximate area on an **interactive map**.

![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📍 **Location Detection** | Identify the geographic region of any phone number |
| 📡 **Carrier Lookup** | Find the telecom carrier / service provider |
| 🕐 **Timezone Info** | Get timezone(s) associated with the number |
| ✅ **Validation** | Check if a number is valid and properly formatted |
| 🔢 **Number Formatting** | International, National, and E.164 formats |
| 🗺️ **Interactive Map** | View location on a dark-themed OpenStreetMap |

---

## 🛠️ Tech Stack

- **Backend:** Python (Vercel Serverless Functions)
- **Frontend:** HTML5, CSS3 (Vanilla), JavaScript (ES6+)
- **Phone Parsing:** [`phonenumbers`](https://pypi.org/project/phonenumbers/) library by Google
- **Map:** [Leaflet.js](https://leafletjs.com/) + [CartoDB Dark Tiles](https://carto.com/basemaps/)
- **Geocoding:** [Nominatim (OpenStreetMap)](https://nominatim.openstreetmap.org/)
- **Deployment:** [Vercel](https://vercel.com/)

---

## 📂 Project Structure

```
phone-tracker/
├── api/
│   └── track.py            # Python serverless function (phone number analysis)
├── public/
│   ├── index.html           # Main HTML page
│   ├── style.css            # Premium dark-theme CSS
│   └── script.js            # Frontend logic (API calls, map, animations)
├── requirements.txt         # Python dependencies
├── vercel.json              # Vercel deployment configuration
└── README.md                # This file
```

---

## 🚀 Deploy to Vercel (Step-by-Step)

### Prerequisites

- A free [Vercel account](https://vercel.com/signup)
- A free [GitHub account](https://github.com/signup)
- [Git](https://git-scm.com/downloads) installed on your computer
- [Node.js](https://nodejs.org/) installed (for Vercel CLI, optional)

---

### Step 1: Create a GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Name your repository (e.g., `phone-tracker`)
3. Set it to **Public** or **Private**
4. Click **Create repository**

---

### Step 2: Push Your Code to GitHub

Open your terminal in the project folder and run:

```bash
# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - PhoneTracer app"

# Add your GitHub repo as remote (replace with YOUR repo URL)
git remote add origin https://github.com/YOUR_USERNAME/phone-tracker.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

### Step 3: Deploy on Vercel

#### Option A: Deploy via Vercel Website (Easiest)

1. Go to [vercel.com](https://vercel.com/) and sign in with GitHub
2. Click **"Add New..."** → **"Project"**
3. Select your `phone-tracker` repository
4. Vercel will auto-detect the settings from `vercel.json`
5. Click **"Deploy"**
6. ✅ Your app will be live in ~60 seconds!

#### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Deploy (run this in the project folder)
vercel

# Follow the prompts:
#   - Set up and deploy? → Yes
#   - Which scope? → Select your account
#   - Link to existing project? → No
#   - Project name? → phone-tracker
#   - Directory? → ./
#   - Want to modify settings? → No

# Deploy to production
vercel --prod
```

---

### Step 4: Test Your App

1. Open the Vercel URL provided after deployment
2. Enter a phone number with country code, e.g.:
   - `+919876543210` (India)
   - `+14155552671` (USA)
   - `+447911123456` (UK)
   - `+61412345678` (Australia)
3. Click **"Track"** and see the results + map!

---

## 🖥️ Run Locally (Optional)

If you want to test locally before deploying:

### Method 1: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Run the dev server
vercel dev

# Open http://localhost:3000
```

### Method 2: Using Python (API only)

```bash
# Install dependencies
pip install phonenumbers

# Test the API manually with Python
python -c "
import phonenumbers
from phonenumbers import geocoder, carrier, timezone

number = phonenumbers.parse('+919876543210')
print('Location:', geocoder.description_for_number(number, 'en'))
print('Carrier:', carrier.name_for_number(number, 'en'))
print('Timezone:', timezone.time_zones_for_number(number))
print('Valid:', phonenumbers.is_valid_number(number))
"
```

---

## 📸 Screenshots

After deployment, your app will look like this:

- **🏠 Hero Section** — Stunning dark-themed landing with animated phone mockup  
- **🔍 Tracker** — Glassmorphic input card with real-time validation  
- **📊 Results** — Rich data cards showing all phone number details  
- **🗺️ Map** — Dark-themed interactive Leaflet map with animated marker  
- **⚡ Features** — Hover-animated feature cards with icon highlights  

---

## 🔧 How It Works

```
User enters phone number
        ↓
Frontend sends POST to /api/track
        ↓
Python serverless function parses the number
using Google's 'phonenumbers' library
        ↓
Returns: location, carrier, timezone,
validity, type, and formatted versions
        ↓
Frontend renders results + geocodes location
using Nominatim → displays on Leaflet map
```

---

## 📋 API Reference

### `POST /api/track`

**Request Body:**
```json
{
  "phone_number": "+919876543210"
}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "phone_number": "+919876543210",
    "is_valid": true,
    "is_possible": true,
    "location": "India",
    "carrier": "Airtel",
    "timezones": ["Asia/Calcutta"],
    "country_code": "IN",
    "number_type": "Mobile",
    "formatted": {
      "international": "+91 98765 43210",
      "national": "098765 43210",
      "e164": "+919876543210"
    }
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid phone number format."
}
```

---

## ⚠️ Important Notes

- This app uses the `phonenumbers` library, which provides **approximate region-level** location data.
- It does **NOT** track real-time GPS location of a phone.
- The location shown on the map is the **registered region** of the phone number, not the current physical location of the device.
- All processing is done server-side via Python. No API keys are required.

---

## 📄 License

This project is open source under the [MIT License](https://opensource.org/licenses/MIT).

---

## 🙏 Credits

- [phonenumbers](https://github.com/daviddrysdale/python-phonenumbers) — Python port of Google's libphonenumber
- [Leaflet.js](https://leafletjs.com/) — Interactive map library
- [CartoDB](https://carto.com/) — Dark map tiles
- [Nominatim](https://nominatim.openstreetmap.org/) — OpenStreetMap geocoding
- [Vercel](https://vercel.com/) — Serverless deployment platform

---

<p align="center">
  Built with Python & ❤️ — Deployed on Vercel
</p>
