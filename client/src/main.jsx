import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import AuditDashboard from './components/AuditDashboard.jsx';
import './styles/globals.css';

createRoot(document.getElementById('root')).render(
  <MotionConfig reducedMotion="user">
    <AuditDashboard />
  </MotionConfig>,
);
