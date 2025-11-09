// Vercel Serverless Function - API Proxy
// This redirects API calls to your backend server

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // For now, return a message that backend needs to be set up
  res.status(503).json({
    error: 'Backend server not configured',
    message: 'Please deploy the backend server separately or configure VITE_API_URL environment variable',
    docs: 'Check ENVIRONMENT_SETUP.md for instructions'
  });
};
