const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const allComments = await prisma.comment.findMany();
  console.log("All comments in DB:", allComments.length);
  if (allComments.length > 0) {
    console.log("First comment:", allComments[0]);
  }
}

test()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  });
