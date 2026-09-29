import { registerRootComponent } from 'expo';
import App from './app/index';

// Single-flow app: no router, so the build runs from any URL (device, web, hosted demo).
registerRootComponent(App);
