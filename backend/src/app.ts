import express from 'express';
import cors from 'cors';
import { config } from './config';
import apiRouter from './routes/api';
import authService from './services/authService';

const app = express();

// Set up CORS
app.use(cors());

// Configure JSON and URL-encoded body parsing with appropriate limits for handling larger datasets
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'ShapeTeam core service is healthy.' });
});

// Mount main API routes
app.use('/api', apiRouter);

// Fallback for page not found
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Resource not found.' });
});

// Start the server
authService.ensureDemoData().then(() => app.listen(config.port, () => {
  console.log(`==================================================`);
  console.log(`🟢 ShapeTeam Core Backend started on port ${config.port}`);
  console.log(`🔗 API Gateway: http://localhost:${config.port}`);
  console.log(`🔗 ML microservice target: ${config.mlServiceUrl}`);
  console.log(`==================================================`);
})).catch((error) => {
  console.error('Unable to initialize ShapeTeam:', error);
  process.exitCode = 1;
});

export default app;
