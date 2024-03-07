import { prisma } from './../libs/prisma';
import { FastifyInstance } from "fastify";

export async function userRoutes(fastify: FastifyInstance) {
  fastify.get('/users/acount', async () => {
    const count = await prisma.user.count()

    return { count }
  })
}