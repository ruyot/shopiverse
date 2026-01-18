# Shopiverse

![alt text](image.png)

**A 3D Virtual Store Experience Platform — Google Street View Meets E-Commerce**

Transform any physical retail store into an immersive, navigable 3D shopping experience. Customers can explore your store virtually, browse products, and checkout seamlessly — all from their browser.

---

## Vision

Shopiverse bridges the gap between physical retail and online shopping by creating an immersive virtual store experience. Think **Google Street View**, but for shopping — where customers can:

- **Walk through** a virtual representation of your store
- **Look around** at products, displays, and shelves
- **Click on items** to view details and add to cart
- **Checkout** without leaving the experience

This platform empowers **small and medium-sized businesses** to establish a compelling digital presence with rich customer analytics, leveling the playing field against major e-commerce players.

---

## How It Works

### The Core Concept

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SHOPIVERSE FLOW                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Capture             Process              Deploy                   │
│   ───────────         ──────────           ────────                 │
│   Take photos    →    ML-SHARP generates → Host 3D experience       │
│   at pivot points     3D Gaussians         in browser               │
│                                                                     │
│   Navigate            Shop                 Analyze                  │
│   ───────────         ──────               ───────────              │
│   Move freely in  →   Select products  →   Track engagement         │
│   synthesized 3D      & checkout           & behavior               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### ML-SHARP: The Magic Behind the 3D

[Apple ML-SHARP](https://github.com/apple/ml-sharp) is a groundbreaking ML model that performs **monocular view synthesis** — generating photorealistic 3D views from a **single 2D image** in under one second.

**How it works:**
1. Feed a single photo into ML-SHARP
2. ML-SHARP outputs 3D Gaussian splats (.ply files)
3. These Gaussians render photorealistic novel views in real-time
4. Users can look around freely, not just at fixed angles

### Navigation System

The navigation mimics Google Street View's intuitive interface:

1. **Pivot Points** — Strategic locations throughout the store where photos are captured
2. **Navigation Arrows** — Clickable directional indicators to move between pivot points
3. **Product Hotspots** — Clickable regions near shelves/displays that reveal products
4. **Free Look** — Move the camera within the synthesized 3D volume

```
                    ┌─────────┐
                    │  Entry  │ ← Pivot Point 1
                    │  Arrow  │
                    └────┬────┘
                         │
               ┌─────────┼─────────┐
               │         │         │
          ┌────▼───┐ ┌───▼────┐ ┌──▼─────┐
          │ Aisle  │ │ Center │ │ Aisle  │
          │ Left   │ │ Floor  │ │ Right  │
          └────┬───┘ └───┬────┘ └───┬────┘
               │         │          │
          [Shelf]    [Display]   [Shelf]
          Hotspot    Hotspot     Hotspot
```

---

## Key Features

### For Customers

| Feature | Description |
|---------|-------------|
| **Immersive Exploration** | Navigate a realistic 3D representation of the store |
| **Intuitive Controls** | Click-to-move navigation, drag-to-look interaction |
| **Product Discovery** | Click on items to view details, pricing, and variants |
| **Seamless Checkout** | Direct path from virtual browsing to purchase |
| **Mobile Friendly** | Works on desktop, tablet, and mobile devices |

### For Business Owners

| Feature | Description |
|---------|-------------|
| **Digital Presence**  | Stand out with an immersive shopping experience |
| **Customer Analytics**| Track which products/areas get the most attention |
| **Engagement Metrics**| Measure dwell time, navigation paths, click patterns |
| **Low Barrier Entry** | No 3D modeling required — just photos |
| **Easy Updates**      | Replace product images/info without re-shooting |

---

## Technical Architecture

### Technology Stack

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                    │
├─────────────────────────────────────────────────────────────────────┤
│  Framework        │  Next.js / Vite + React                         │
│  3D Rendering     │  Three.js + 3D Gaussian Splat Renderer          │
│  Styling          │  CSS3 with modern animations                    │
│  State Management │  React Context / Zustand                        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    ML PROCESSING (Python/GPU)                       │
├─────────────────────────────────────────────────────────────────────┤
│  ML Model         │  Apple ML-SHARP (3D Gaussian synthesis)         │
│  Runtime          │  Python 3.13 + PyTorch + CUDA                   │
│  Output Format    │  3D Gaussian Splats (.ply files)                │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         BACKEND                                     │
├─────────────────────────────────────────────────────────────────────┤
│  Runtime          │  Node.js                                        │
│  API              │  REST / GraphQL                                 │
│  Database         │  PostgreSQL / MongoDB                           │
│  Analytics        │  Custom event tracking + dashboard              │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         SERVICES                                    │
├─────────────────────────────────────────────────────────────────────┤
│  Hosting          │  Vercel / AWS / GCP                             │
│  CDN              │  CloudFlare / AWS CloudFront                    │
│  Payments         │  Stripe / PayPal integration                    │
│  GPU Processing   │  AWS/GCP GPU instances for ML-SHARP             │
│  Storage          │  S3 / GCS for images + .ply 3D files            │
└─────────────────────────────────────────────────────────────────────┘
```

### ML-SHARP Processing Pipeline

Apple's ML-SHARP transforms single images into navigable 3D:

1. **Input** — Single 2D photograph from pivot point
2. **Inference** — ML-SHARP generates 3D Gaussian parameters (~1 second on GPU)
3. **Output** — .ply file containing 3D Gaussian splats
4. **Render** — WebGL/Three.js renders Gaussians for novel view synthesis

```bash
# Process store images with ML-SHARP
sharp predict -i /path/to/store-photos -o /path/to/gaussians

# Output: 3D Gaussian splats (.ply) for each input image
# These can be rendered from any nearby viewpoint in real-time
```

**Key benefits:**
- No 360° camera needed — just regular photos
- True 3D depth, not just projected images
- Photorealistic novel views
- Real-time rendering in browser

---

## System Design

### Data Models

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│      Store       │────▶│   PivotPoint     │────▶│     Product      │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ id               │     │ id               │     │ id               │
│ name             │     │ store_id         │     │ name             │
│ owner_id         │     │ panorama_url     │     │ description      │
│ description      │     │ position         │     │ price            │
│ theme            │     │ connections[]    │     │ variants[]       │
│ is_published     │     │ hotspots[]       │     │ images[]         │
└──────────────────┘     └──────────────────┘     │ checkout_url     │
                                                  └──────────────────┘
                                                  
┌──────────────────┐     ┌──────────────────┐
│     Hotspot      │     │   Analytics      │
├──────────────────┤     ├──────────────────┤
│ id               │     │ event_type       │
│ pivot_point_id   │     │ store_id         │
│ product_id       │     │ pivot_point_id   │
│ position (x,y,z) │     │ product_id       │
│ type (product/   │     │ timestamp        │
│       navigation)│     │ session_id       │
└──────────────────┘     │ duration         │
                         └──────────────────┘
```

### Navigation Graph

The store layout is represented as a graph where:
- **Nodes** = Pivot points (photo locations)
- **Edges** = Navigation arrows (connections)
- **Attributes** = Product hotspots attached to each node

```javascript
// Example: Store navigation graph
const storeGraph = {
  pivotPoints: [
    {
      id: "entrance",
      panorama: "/images/entrance.jpg",
      connections: [
        { to: "center-aisle", direction: "forward", arrowPosition: { yaw: 0, pitch: -10 } }
      ],
      hotspots: []
    },
    {
      id: "center-aisle",
      panorama: "/images/center-aisle.jpg",
      connections: [
        { to: "entrance", direction: "back", arrowPosition: { yaw: 180, pitch: -10 } },
        { to: "clothing-section", direction: "left", arrowPosition: { yaw: -90, pitch: -10 } },
        { to: "accessories", direction: "right", arrowPosition: { yaw: 90, pitch: -10 } }
      ],
      hotspots: [
        { productId: "shirt-001", position: { yaw: 45, pitch: 5 } }
      ]
    }
    // ... more pivot points
  ]
};
```

---

## Analytics & Business Intelligence

### Tracked Events

| Event | Data Captured | Business Value |
|-------|---------------|----------------|
| **Page View** | Session start, device info | Traffic analysis |
| **Navigation** | Path through store | Popular routes |
| **Dwell Time** | Time at each pivot point | Interest areas |
| **Product View** | Which items are clicked | Popular products |
| **Hotspot Hover** | Near-click interactions | Intent signals |
| **Checkout Click** | Conversion events | Sales attribution |
| **Exit Point** | Where users leave | UX improvements |

### Dashboard Metrics

```
┌────────────────────────────────────────────────────────────────────┐
│                    STORE ANALYTICS DASHBOARD                       │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Visitor Overview             Navigation Heatmap                   |
│  ┌───────────────────┐       ┌───────────────────┐                 │
│  │ Today: 1,234      │       │    [Entry]        │                 │
│  │ This Week: 8,521  │       │       ↓           │                 │
│  │ Avg. Duration: 4m │       │  [Hot] → [Warm]   │                 │
│  └───────────────────┘       └───────────────────┘                 │
│                                                                    │
│  Top Products Viewed          Conversion Funnel                    │
│  1. Blue Denim Jacket         Viewed Store: 1,234                  │
│  2. Summer Dress              Viewed Product: 456                  │
│  3. Canvas Sneakers           Started Checkout: 123                │
│  4. Leather Belt              Completed: 98                        │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Python 3.13+ (for ML-SHARP processing)
- CUDA-capable GPU (for ML-SHARP inference)
- Regular photos of your store at key pivot points

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/shopiverse.git
cd shopiverse

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start development server
npm run dev
```

### Creating Your Virtual Store

1. **Capture Photos** — Take photos at strategic pivot points in your store
2. **Upload Images** — Use the admin panel to upload panoramic images
3. **Define Layout** — Connect pivot points and set navigation arrows
4. **Add Products** — Create product hotspots on relevant images
5. **Publish** — Make your virtual store live!

---

## Project Structure

```
shopiverse/
├── public/                    # Static assets
│   └── images/               # Store panoramas & product images
├── src/
│   ├── components/           # React components
│   │   ├── viewer/          # Panorama viewer components
│   │   ├── navigation/      # Arrow & hotspot components
│   │   ├── products/        # Product modal & cards
│   │   └── ui/              # Common UI components
│   ├── hooks/               # Custom React hooks
│   ├── stores/              # State management
│   ├── services/            # API & analytics services
│   ├── utils/               # Helper functions
│   └── pages/               # Route pages
├── server/                   # Backend
│   ├── api/                 # API routes
│   └── analytics/           # Event tracking
├── ml-pipeline/              # ML-SHARP processing
│   ├── process_images.py    # Image → 3D Gaussian conversion
│   └── outputs/             # Generated .ply files
├── admin/                    # Store management dashboard
└── docs/                     # Additional documentation
```

---

## User Experience

### Navigation Controls

| Action | Desktop | Mobile |
|--------|---------|--------|
| Look around | Click + drag | Touch + drag |
| Move forward | Click navigation arrow | Tap navigation arrow |
| View product | Click product hotspot | Tap product hotspot |
| Zoom | Scroll wheel | Pinch gesture |
| Close modal | ESC key / click outside | Swipe down / tap outside |

### Visual Indicators

- **Navigation Arrows** — Animated chevrons indicating movement directions
- **Product Hotspots** — Pulsing markers on clickable items
- **Loading States** — Smooth transitions between pivot points
- **Minimap** — Optional overview of store layout

---

## Future Roadmap

### Phase 1: MVP 
- [ ] Basic panorama viewer with navigation
- [ ] Product hotspots and modals
- [ ] Checkout redirection
- [ ] Simple analytics tracking

### Phase 2: Enhanced Experience
- [ ] Smooth transitions between pivot points
- [ ] VR/AR support for immersive viewing
- [ ] Voice-guided tours
- [ ] Live inventory sync

### Phase 3: Business Tools
- [ ] Advanced analytics dashboard
- [ ] A/B testing for store layouts
- [ ] Multi-store management
- [ ] API for third-party integrations

### Phase 4: AI Features
- [ ] AI-powered product recommendations
- [ ] Virtual shopping assistant
- [ ] Automated hotspot detection
- [ ] Smart analytics insights

## Why Shopiverse?

> *"The future of retail isn't just online or offline — it's everywhere."*

Small businesses deserve the same immersive shopping experiences that major retailers offer. Shopiverse makes it possible with just a camera and a vision.

**Transform your store. Engage your customers. Grow your business.**

---
