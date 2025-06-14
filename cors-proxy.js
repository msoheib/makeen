const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'apikey', 'Prefer', 'X-Client-Info']
}));

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Proxy middleware for Supabase
const supabaseProxy = createProxyMiddleware({
  target: 'https://fbabpaorcvatejkrelrf.supabase.co',
  changeOrigin: true,
  pathRewrite: {
    '^/supabase': '', // remove /supabase prefix
  },
  onProxyReq: (proxyReq, req, res) => {
    // Add required headers
    proxyReq.setHeader('apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiYWJwYW9yY3ZhdGVqa3JlbHJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyNjYzMzMsImV4cCI6MjA2Mzg0MjMzM30.L_DLnMQUw7cepGKjtrbkFZ_E6Rsz4pecAtnUrbc0F5w');
    proxyReq.setHeader('Authorization', `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiYWJwYW9yY3ZhdGVqa3JlbHJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyNjYzMzMsImV4cCI6MjA2Mzg0MjMzM30.L_DLnMQUw7cepGKjtrbkFZ_E6Rsz4pecAtnUrbc0F5w`);
    console.log(`Proxying: ${req.method} ${req.url} -> https://fbabpaorcvatejkrelrf.supabase.co${req.url.replace('/supabase', '')}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // Add CORS headers to response
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, apikey, Prefer, X-Client-Info';
    console.log(`Response: ${proxyRes.statusCode} for ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err.message);
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
});

// Use the proxy for all /supabase routes
app.use('/supabase', supabaseProxy);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'CORS proxy is running', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Supabase CORS Proxy Server',
    endpoints: {
      health: '/health',
      proxy: '/supabase/*'
    },
    target: 'https://fbabpaorcvatejkrelrf.supabase.co'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 CORS Proxy server running on http://localhost:${PORT}`);
  console.log(`📡 Proxying Supabase requests to avoid CORS issues`);
  console.log(`🔧 Use http://localhost:${PORT}/supabase instead of https://fbabpaorcvatejkrelrf.supabase.co`);
  console.log(`✅ Ready to handle auth and API requests`);
}); 