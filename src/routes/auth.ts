import { FastifyInstance } from "fastify";
import {authenticate} from '../plugins/authenticate'
import { z } from "zod";
import axios from "axios";
import { prisma } from '../libs/prisma'

export async function authRoutes(fastify: FastifyInstance) {
  fastify.get('/me', {onRequest: [authenticate]}, async (request) => {
    await request.jwtVerify()

    return { user: request.user}
  })

  fastify.post('/users', async (request, reply) => {
    const createUserBody = z.object({
      access_token: z.string()
    })

    const { access_token } = createUserBody.parse(request.body)

    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    })

    const userData = await userResponse.data

    const userInfoSchema = z.object({
      id: z.string(),
      email: z.string().email(),
      name: z.string(),
      picture: z.string().url()
    })

    const userInfo = userInfoSchema.parse(userData)

    let user = await prisma.user.findUnique({
      where: {
        googleId: userInfo.id
      }
    })

    if(!user) {
      user = await prisma.user.create({
        data: {
          googleId: userInfo.id,
          name: userInfo.name,
          avatarUrl: userInfo.picture,
          email: userInfo.email
        }
      })
    }

    const token = fastify.jwt.sign({
      name: user.name,
      avatarUrl: user.avatarUrl
    },{
      sub: user.id,
      expiresIn: '7 days'
    })

    return token
  })
}