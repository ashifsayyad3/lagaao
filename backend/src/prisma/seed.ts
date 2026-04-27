import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed roles
  const roles = ['super_admin', 'admin', 'manager', 'support', 'customer'];
  for (const name of roles) {
    await prisma.role.upsert({ where: { name }, create: { name }, update: {} });
  }
  console.log('✅ Roles seeded');

  // Seed super admin
  const superAdminRole = await prisma.role.findUnique({ where: { name: 'super_admin' } });
  const hash = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lagaao.com' },
    create: {
      email: 'admin@lagaao.com',
      passwordHash: hash,
      firstName: 'Super',
      lastName: 'Admin',
      status: 'ACTIVE',
      emailVerified: true,
    },
    update: {},
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: superAdminRole.id } },
    create: { userId: admin.id, roleId: superAdminRole.id },
    update: {},
  });
  console.log('✅ Admin user seeded: admin@lagaao.com / Admin@123');

  // Seed categories
  const categories = [
    { name: 'Money Plants', slug: 'money-plants', icon: '💚', description: 'Bring prosperity and good luck with our stunning money plant collection' },
    { name: 'Bonsai', slug: 'bonsai', icon: '🌳', description: 'Miniature trees crafted with perfection for zen spaces' },
    { name: 'Indoor Plants', slug: 'indoor-plants', icon: '🪴', description: 'Transform your living spaces with beautiful indoor plants' },
    { name: 'Lucky Bamboo', slug: 'lucky-bamboo', icon: '🎋', description: 'Invite fortune and happiness with our lucky bamboo' },
    { name: 'Gifting Plants', slug: 'gifting-plants', icon: '🎁', description: 'Perfect plant gifts for every occasion' },
    { name: 'Premium Planters', slug: 'premium-planters', icon: '🏺', description: 'Elegant planters and pots for your green companions' },
  ];

  for (let i = 0; i < categories.length; i++) {
    await prisma.category.upsert({
      where: { slug: categories[i].slug },
      create: { ...categories[i], sortOrder: i },
      update: {},
    });
  }
  console.log('✅ Categories seeded');

  // Seed sample products
  const moneyPlantCat = await prisma.category.findUnique({ where: { slug: 'money-plants' } });
  const sampleProducts = [
    {
      categoryId: moneyPlantCat.id,
      name: 'Golden Pothos Money Plant',
      slug: 'golden-pothos-money-plant',
      sku: 'MP-001',
      price: 299,
      comparePrice: 499,
      status: 'ACTIVE' as any,
      isFeatured: true,
      shortDesc: 'The classic money plant that brings luck and prosperity',
      description: 'The Golden Pothos is the most popular money plant in India. Known for its air-purifying properties and easy care, it makes the perfect indoor plant.',
      careInstructions: 'Water twice a week. Indirect sunlight. Well-draining soil.',
      sunlightReq: 'Indirect sunlight',
      wateringFreq: 'Twice a week',
      tags: 'money plant, pothos, lucky, indoor',
      metaTitle: 'Golden Pothos Money Plant - Buy Online | LAGAAO',
      metaDesc: 'Buy Golden Pothos Money Plant online. Air purifying, easy care indoor plant.',
    },
  ];

  for (const product of sampleProducts) {
    const existing = await prisma.product.findUnique({ where: { slug: product.slug } });
    if (!existing) {
      const created = await prisma.product.create({ data: product });
      await prisma.inventory.create({ data: { productId: created.id, quantity: 50, reorderLevel: 10 } });
    }
  }
  console.log('✅ Sample products seeded');

  console.log('🎉 Seeding complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
