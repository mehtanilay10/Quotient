import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export type AuthUser = {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

export async function getOrCreateUser(user: AuthUser) {
  if (!user.email) {
    return user.id ? prisma.user.findUnique({ where: { id: user.id } }) : null;
  }

  const id = user.id ?? user.email;

  return prisma.user.upsert({
    where: { email: user.email },
    update: {
      ...(user.name !== undefined ? { name: user.name } : {}),
      ...(user.image !== undefined ? { image: user.image } : {}),
    },
    create: {
      id,
      email: user.email,
      name: user.name,
      image: user.image,
    },
  });
}
