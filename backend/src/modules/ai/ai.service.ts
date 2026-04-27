import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import OpenAI from 'openai';

@Injectable()
export class AIService {
  private openai: OpenAI;
  private readonly logger = new Logger(AIService.name);

  constructor(private config: ConfigService, private prisma: PrismaService) {
    this.openai = new OpenAI({ apiKey: config.get('OPENAI_API_KEY') });
  }

  async chat(userId: string, sessionId: string, message: string): Promise<string> {
    const conversation = await this.prisma.aIConversation.findFirst({
      where: { userId, sessionId },
    });

    const history = (conversation?.messages as any[]) || [];
    history.push({ role: 'user', content: message });

    const systemPrompt = `You are Veda, LAGAAO's plant care expert. Help customers with:
- Plant care advice (watering, sunlight, soil)
- Plant recommendations for their space
- Troubleshooting plant problems
- Product recommendations from our catalog
- Gift suggestions
Always be friendly, concise, and recommend plants we sell: Money Plants, Bonsai, Indoor Plants, Lucky Bamboo, Gifting Plants, Premium Planters.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }, ...history.slice(-10)],
      max_tokens: 500,
      temperature: 0.7,
    });

    const reply = response.choices[0].message.content;
    history.push({ role: 'assistant', content: reply });

    await this.prisma.aIConversation.upsert({
      where: { id: conversation?.id || 'new' },
      create: { userId, sessionId, messages: history },
      update: { messages: history },
    });

    return reply;
  }

  async getRecommendations(userId: string, limit = 6) {
    const recentViewed = await this.prisma.analyticsEvent.findMany({
      where: { userId, event: 'product_view' },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { properties: true },
    });

    const categoryIds = recentViewed
      .map((e) => (e.properties as any)?.categoryId)
      .filter(Boolean);

    const products = await this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
        ...(categoryIds.length > 0 ? { categoryId: { in: categoryIds } } : {}),
      },
      take: limit,
      orderBy: { avgRating: 'desc' },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        inventory: { select: { quantity: true } },
      },
    });

    return products;
  }

  async getSearchSuggestions(query: string): Promise<string[]> {
    if (query.length < 2) return [];

    const products = await this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        OR: [{ name: { contains: query } }, { tags: { contains: query } }],
      },
      take: 5,
      select: { name: true },
    });

    const categories = await this.prisma.category.findMany({
      where: { isActive: true, name: { contains: query } },
      take: 3,
      select: { name: true },
    });

    return [...products.map((p) => p.name), ...categories.map((c) => c.name)];
  }

  async generateProductDescription(productName: string, category: string, careInfo?: string): Promise<string> {
    const prompt = `Write a compelling, SEO-friendly product description for an online plant store for: "${productName}" in category "${category}". ${careInfo ? `Care info: ${careInfo}` : ''} Keep it under 150 words, highlight benefits and care tips.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
    });

    return response.choices[0].message.content;
  }
}
