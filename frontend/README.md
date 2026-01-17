# Shopiverse Frontend

Modern React-based frontend for the Shopiverse 3D Gaussian Splat generator.

## Tech Stack

- **React** - UI framework
- **Vite** - Fast build tool and dev server
- **Three.js** - 3D rendering and visualization
- **CSS3** - Modern styling with gradients and animations

## Features

- 🎨 Modern, responsive UI with gradient design
- 📸 Drag & drop image upload
- 🔄 Real-time processing status
- 🎮 Interactive 3D viewer with orbit controls
- 💾 Download PLY files
- ⚡ Fast development with Vite HMR

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The production build will be in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ImageUpload.jsx      # Image upload component
│   │   ├── ImageUpload.css
│   │   ├── Viewer3D.jsx          # 3D viewer component
│   │   └── Viewer3D.css
│   ├── App.jsx                   # Main app component
│   ├── App.css                   # App styles
│   └── main.jsx                  # Entry point
├── public/                       # Static assets
├── index.html                    # HTML template
└── package.json                  # Dependencies
```

## API Integration

The frontend connects to the Modal backend API:
```
https://nicholasterek1--apple-sharp-sharpmodel-generate.modal.run
```

To change the API endpoint, update the `API_ENDPOINT` constant in `src/App.jsx`.

## Development

- Hot Module Replacement (HMR) is enabled for instant updates
- ESLint is configured for code quality
- CSS is modular and component-scoped

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

Requires WebGL support for 3D visualization.
