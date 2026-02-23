import dotenv from 'dotenv';
import path from 'path';

// Load root .env before importing prisma (which reads DATABASE_URL)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import words from './words.json';

async function main() {
  const { prisma } = await import('../src/index');
  console.log('🌱 Seeding words...');

  try {
    // Clear existing words
    await prisma.word.deleteMany();

    // Insert words from category -> words[] structure
    const data: { word: string; category: string }[] = [];
    for (const [category, wordList] of Object.entries(words)) {
      for (const word of wordList as string[]) {
        data.push({ word, category });
      }
    }

    const result = await prisma.word.createMany({ data });
    console.log(`✅ Seeded ${result.count} words`);

    // Show category summary
    const categories = await prisma.word.groupBy({
      by: ['category'],
      _count: { id: true },
    });
    console.log('\n📊 Categories:');
    categories.forEach(c => {
      console.log(`   ${c.category}: ${c._count.id} words`);
    });
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  });
