import express from 'express';

const app = express();
const PORT = process.env.PORT || 4000;

app.get('/', (_, res) => {
  res.send('Backend running 🚀');
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
