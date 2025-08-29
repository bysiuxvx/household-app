const app = require('../dist/app').default;

module.exports = async (req: any, res: any) => {
  return app(req, res);
};
