// Import the built Express app from the compiled server file
const app = require('../dist/server').default;

// Export the Vercel serverless function
module.exports = async (req: any, res: any) => {
  return app(req, res);
};
