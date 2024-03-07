import { prisma } from './../libs/prisma';
import { FastifyInstance } from "fastify";
import { authenticate } from '../plugins/authenticate'
import { z } from 'zod';

export async function guessRoutes(fastify: FastifyInstance) {
  fastify.get('/guesses/count', async () => {
    const count = await prisma.guess.count()
    return { count }
  })

  fastify.post(
    '/pools/:poolId/games/:gamesId/guesses', 
    {onRequest: [authenticate]}, 
    async (request, reply) => {
      const createGuessParams = z.object({
        poolId: z.string(),
        gameId: z.string()
      })

      const createGuessBody = z.object({
        firstTeamPoints: z.number(),
        secondTeamPoints: z.number()
      })

      const {gameId, poolId} = createGuessParams.parse(request.params)
      const {firstTeamPoints, secondTeamPoints} = createGuessBody.parse(request.body)

      const participant = await prisma.participant.findUnique({
        where: {
          userId_poolId: {
            poolId,
            userId: request.user.sub
          }
        }
      })

      const guess = await prisma.guess.findUnique({
        where: {
          participantId_gameId: {
            participantId: participant.id,
            gameId: gameId
          }
        }
      })

      const game = await prisma.findUnique({
        where: {
          id: gameId
        }
      })

      if(!participant) {
        return reply.status(400).send({
          message: "you're not allowed to create a guess inside this pool."
        })
      }

      if(!guess) {
        return reply.status(400).send({
          message: "you already have a guess in this game"
        })
      }

      if(!game) {
        return reply.status(400).send({
          message: "you cannot send guesses after the game date"
        })
      }

      await prisma.guess.create({
        data: {
          gameId,
          participantId: participant.id,
          firstTeamPoints,
          secondTeamPoints
        }
      })

      return reply.status(201).send()
    }
  )
}