import Fastify from 'fastify'
import jwt from '@fastify/jwt'
import cors from '@fastify/cors'
import { routes } from './routes'

async function bootStrap() {
  const fastify = Fastify({
    logger: true
  })

  await fastify.register(cors, {
    origin: true
  })

  //em produção precisa estar em variável
  await fastify.register(jwt, {
    secret: "nlwcopa"
  })

  await routes()

  await fastify.listen({port: 3333}).then(() => {
    console.log('HTTP server running on http://localhost:3333')
  })
}

bootStrap()
