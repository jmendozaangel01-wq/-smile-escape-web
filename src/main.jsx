import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Note: StrictMode is intentionally omitted. Its dev-only double-mount would
// re-initialize GSAP/ScrollTrigger/Lenis twice and fight the pinned canvas.
createRoot(document.getElementById('root')).render(<App />);
