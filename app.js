const express = require('express') // requiere commonJS
const crypto = require('node:crypto')
const movies = require('./movies.json')
const { validateMovie, validatePartialMovie } = require('./schemas/movies')

const app = express()
app.use(express.json())
app.disable('x-powered-by') // desabilitar el header X-Powered-By: Express

// metodos normales: GET/HEAD/POST
// metodos complejos: PUT/PATCH/DELETE

// CORS PRE-Flight
// OPTIONS -> Peticion especial para los metodos complejos

const ACCEPTTED_ORIGINS = [
  'https://localhost:3000',
  'https://localhost:3001',
  'http://localhost:8080'

]

// Todos los recursos que sean MOVIES se identifica con /movies
app.get('/movies', (req, res) => {
  // en el * es posible indicar la ip/dominio donde se acepta que se usen los datos
  // res.header('Acccess-Control-Allow-Origin', '*')

  // alternativa
  const origin = req.header('origin')
  // el navegador no envia el origin cuando la peticion es del mismo origin
  // http://localhost:3000 -> http://localhost:3000 no se envia ORIGIN
  if (ACCEPTTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin)
  }

  const { genre } = req.query
  if (genre) {
    const filteredMovies = movies.filter(
      movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
    )
    return res.json(filteredMovies)
  }
  res.json(movies)
})

app.get('/movies/:id', (req, res) => { // path to regexp if wanted
  const { id } = req.params
  const movie = movies.find(movie => movie.id === id)
  if (movie) return res.json(movie)

  res.status(404).json({ message: 'Movie not found' })
})

app.post('/movies', (req, res) => {
  const result = validateMovie(req.body)

  if (result.error) {
    // 422 Unprocessable Entity, posible alternativa
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const newMovie = {
    id: crypto.randomUUID(), // uuid v4
    ...result.data
  }

  // Esto no sería REST, porque estamos guardando el estado de la aplicacion en memoria
  movies.push(newMovie)

  // 201, recurso creado
  res.status(201).json(newMovie) // puede ser utilizado para actualizar la cache del cliente
})

app.delete('/movies/:id', (req, res) => {
  const origin = req.header('origin')
  // el navegador no envia el origin cuando la peticion es del mismo origin
  // http://localhost:3000 -> http://localhost:3000 no se envia ORIGIN
  if (ACCEPTTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin)
  }

  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  movies.splice(movieIndex, 1)

  return res.json({ message: 'Movie deleted' })
})

app.patch('/movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body)
  if (result.error) {
    // 422 Unprocessable Entity, posible alternativa
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }
  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data
  }

  movies[movieIndex] = updateMovie

  return res.json(updateMovie)
})

app.options('/movies/:id', (req, res) => {
  const origin = req.header('origin')
  // el navegador no envia el origin cuando la peticion es del mismo origin
  // http://localhost:3000 -> http://localhost:3000 no se envia ORIGIN
  if (ACCEPTTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin)
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
  }
  res.sendStatus(200)
})

const PORT = process.env.PORT ?? 3000

app.listen(PORT, () => {
  console.log(`app listening on port http://localhost:${PORT}`)
})
