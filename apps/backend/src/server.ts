import app from './app'

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  process.stdout.write(`Server is running at http://localhost:${PORT}\n`)
})
