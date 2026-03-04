const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixComments() {
  const comments = await prisma.comment.findMany();
  for (const c of comments) {
    if (c.day > 7) {
      const fixedDay = ((c.day - 1) % 7) + 1;
      await prisma.comment.update({
        where: { id: c.id },
        data: { day: fixedDay }
      });
      console.log(`Fixed comment ${c.id}: Day ${c.day} -> ${fixedDay}`);
    }
  }
  
  const notes = await prisma.reflectionResponse.findMany();
  for (const n of notes) {
    if (n.day > 7) {
      const fixedDay = ((n.day - 1) % 7) + 1;
      await prisma.reflectionResponse.update({
        where: { id: n.id },
        data: { day: fixedDay }
      });
      console.log(`Fixed note ${n.id}: Day ${n.day} -> ${fixedDay}`);
    }
  }
}

fixComments()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  });
