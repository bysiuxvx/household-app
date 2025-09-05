import app from './app'

const PORT: string = process.env.PORT || '3000'
const HOST: string = process.env.HOST || '0.0.0.0'

app.listen(parseInt(PORT, 10), HOST, () => {
  process.stdout.write(`Server is running at http://${HOST}:${PORT}\n`)
})
