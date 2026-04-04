import OpenAI from 'openai';

// AI-powered content and pricing recommendations
export class CreatorAIService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  }

  /**
   * Generate content ideas based on creator's niche and audience
   */
  async generateContentIdeas(creatorProfile: {
    niche: string;
    audienceAge: string;
    audienceInterests: string[];
    previousContent: string[];
    brandAlignment: string;
  }): Promise<{
    ideas: Array<{
      title: string;
      description: string;
      format: 'reel' | 'post' | 'story' | 'carousel';
      hashtags: string[];
      estimatedEngagement: number;
      monetizationPotential: 'high' | 'medium' | 'low';
    }>;
    reasoning: string;
  }> {
    const prompt = `Generate 5 creative content ideas for an Instagram creator with this profile:
    - Niche: ${creatorProfile.niche}
    - Audience age: ${creatorProfile.audienceAge}
    - Audience interests: ${creatorProfile.audienceInterests.join(', ')}
    - Previous content themes: ${creatorProfile.previousContent.join(', ')}
    - Brand alignment needed: ${creatorProfile.brandAlignment}

    For each idea, provide:
    - Title (catchy and engaging)
    - Description (2-3 sentences)
    - Format (reel, post, story, or carousel)
    - 5-7 relevant hashtags
    - Estimated engagement rate (as percentage)
    - Monetization potential (high/medium/low)

    Return as JSON with "ideas" array and "reasoning" string explaining the strategy.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Failed to generate content ideas');

    return JSON.parse(content);
  }

  /**
   * Optimize pricing based on market data and creator performance
   */
  async optimizePricing(creatorData: {
    followerCount: number;
    engagementRate: number;
    niche: string;
    experience: 'beginner' | 'intermediate' | 'expert';
    previousDeals: Array<{ amount: number; brand: string; category: string }>;
    marketRates: { [category: string]: { min: number; avg: number; max: number } };
  }): Promise<{
    recommendedRates: {
      reel: number;
      post: number;
      story: number;
      integration: number;
    };
    reasoning: string;
    confidence: number;
    marketComparison: string;
  }> {
    const prompt = `Analyze this creator's data and recommend optimal pricing:

    Creator Profile:
    - Followers: ${creatorData.followerCount.toLocaleString()}
    - Engagement Rate: ${(creatorData.engagementRate * 100).toFixed(1)}%
    - Niche: ${creatorData.niche}
    - Experience Level: ${creatorData.experience}

    Previous Deals: ${creatorData.previousDeals.map(d => `${d.brand} (${d.category}): ₹${d.amount}`).join(', ')}

    Market Rates by Category: ${Object.entries(creatorData.marketRates).map(([cat, rates]) =>
      `${cat}: ₹${rates.min}-₹${rates.max} (avg: ₹${rates.avg})`
    ).join(', ')}

    Provide:
    - Recommended rates for reel, post, story, integration
    - Detailed reasoning for the pricing strategy
    - Confidence level (0-100)
    - Market comparison analysis

    Return as JSON with "recommendedRates", "reasoning", "confidence", and "marketComparison".`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 800,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Failed to optimize pricing');

    return JSON.parse(content);
  }

  /**
   * Generate personalized brand collaboration pitches
   */
  async generatePitch(brandBrief: {
    brandName: string;
    product: string;
    targetAudience: string;
    campaignGoal: string;
    budget: number;
  }, creatorProfile: {
    name: string;
    niche: string;
    audience: string;
    previousWork: string[];
  }): Promise<{
    subject: string;
    emailBody: string;
    keyPoints: string[];
    callToAction: string;
    successProbability: number;
  }> {
    const prompt = `Create a compelling email pitch for a brand collaboration:

    Brand Details:
    - Name: ${brandBrief.brandName}
    - Product: ${brandBrief.product}
    - Target Audience: ${brandBrief.targetAudience}
    - Campaign Goal: ${brandBrief.campaignGoal}
    - Budget: ₹${brandBrief.budget}

    Creator Details:
    - Name: ${creatorProfile.name}
    - Niche: ${creatorProfile.niche}
    - Audience: ${creatorProfile.audience}
    - Previous Work: ${creatorProfile.previousWork.join(', ')}

    Create:
    - Subject line (attention-grabbing)
    - Email body (professional, personalized, persuasive)
    - 3-5 key selling points
    - Strong call-to-action
    - Success probability estimate (0-100%)

    Return as JSON with "subject", "emailBody", "keyPoints", "callToAction", "successProbability".`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      max_tokens: 1200,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Failed to generate pitch');

    return JSON.parse(content);
  }

  /**
   * Analyze content performance and provide insights
   */
  async analyzeContentPerformance(contentData: {
    posts: Array<{
      type: 'reel' | 'post' | 'story';
      engagement: number;
      reach: number;
      saves: number;
      shares: number;
      comments: number;
      caption: string;
      hashtags: string[];
    }>;
    audience: {
      age: string;
      interests: string[];
      location: string;
    };
  }): Promise<{
    insights: Array<{
      type: 'strength' | 'weakness' | 'opportunity';
      title: string;
      description: string;
      recommendation: string;
    }>;
    contentStrategy: string;
    trendingTopics: string[];
    optimalPostingTimes: string[];
  }> {
    const prompt = `Analyze this creator's content performance and provide actionable insights:

    Content Performance Data:
    ${contentData.posts.map(post => `
    ${post.type.toUpperCase()}:
    - Engagement: ${post.engagement}%
    - Reach: ${post.reach.toLocaleString()}
    - Saves: ${post.saves}, Shares: ${post.shares}, Comments: ${post.comments}
    - Caption: "${post.caption.substring(0, 100)}..."
    - Hashtags: ${post.hashtags.join(', ')}
    `).join('\n')}

    Audience Profile:
    - Age: ${contentData.audience.age}
    - Interests: ${contentData.audience.interests.join(', ')}
    - Location: ${contentData.audience.location}

    Provide:
    - 5-7 insights (strengths, weaknesses, opportunities)
    - Overall content strategy recommendation
    - 5 trending topics to explore
    - 3 optimal posting times

    Return as JSON with "insights", "contentStrategy", "trendingTopics", "optimalPostingTimes".`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Failed to analyze content performance');

    return JSON.parse(content);
  }

  /**
   * Generate contract summaries and risk assessments
   */
  async analyzeContract(contractData: {
    brandName: string;
    deliverables: string[];
    paymentTerms: string;
    timeline: string;
    usageRights: string;
    penalties: string;
    creator: {
      followerCount: number;
      engagementRate: number;
      previousDeals: number;
    };
  }): Promise<{
    summary: string;
    risks: Array<{
      level: 'high' | 'medium' | 'low';
      title: string;
      description: string;
      mitigation: string;
    }>;
    recommendations: string[];
    fairValue: number;
    negotiationPoints: string[];
  }> {
    const prompt = `Analyze this collaboration contract and provide comprehensive assessment:

    Contract Details:
    - Brand: ${contractData.brandName}
    - Deliverables: ${contractData.deliverables.join(', ')}
    - Payment: ${contractData.paymentTerms}
    - Timeline: ${contractData.timeline}
    - Usage Rights: ${contractData.usageRights}
    - Penalties: ${contractData.penalties}

    Creator Profile:
    - Followers: ${contractData.creator.followerCount.toLocaleString()}
    - Engagement: ${(contractData.creator.engagementRate * 100).toFixed(1)}%
    - Previous Deals: ${contractData.creator.previousDeals}

    Provide:
    - Contract summary (2-3 paragraphs)
    - Risk assessment (3-5 risks with mitigation)
    - Recommendations for creator
    - Fair market value estimate
    - Key negotiation points

    Return as JSON with "summary", "risks", "recommendations", "fairValue", "negotiationPoints".`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 1200,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Failed to analyze contract');

    return JSON.parse(content);
  }
}

// Content trend analysis and market insights
export class MarketIntelligenceService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  }

  /**
   * Get trending topics and content ideas for a niche
   */
  async getTrendingTopics(niche: string, platform: 'instagram' | 'tiktok' | 'youtube'): Promise<{
    trends: Array<{
      topic: string;
      popularity: 'high' | 'medium' | 'low';
      engagement: number;
      description: string;
      hashtags: string[];
    }>;
    contentIdeas: Array<{
      title: string;
      format: string;
      estimatedViews: string;
      difficulty: 'easy' | 'medium' | 'hard';
    }>;
    marketAnalysis: string;
  }> {
    const prompt = `Analyze current trends for ${niche} content on ${platform}:

    Provide:
    - 8 trending topics with popularity, engagement rates, descriptions, and hashtags
    - 5 content ideas with titles, formats, estimated performance, and difficulty levels
    - Market analysis summary

    Return as JSON with "trends", "contentIdeas", "marketAnalysis".`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Failed to get trending topics');

    return JSON.parse(content);
  }

  /**
   * Analyze competitor performance and strategies
   */
  async analyzeCompetitors(competitors: Array<{
    handle: string;
    followerCount: number;
    engagementRate: number;
    topContent: string[];
    brandsWorkedWith: string[];
  }>): Promise<{
    competitorAnalysis: Array<{
      competitor: string;
      strengths: string[];
      strategies: string[];
      opportunities: string[];
    }>;
    marketPosition: string;
    recommendedStrategy: string;
  }> {
    const prompt = `Analyze these competitors in the creator space:

    Competitors:
    ${competitors.map(comp => `
    ${comp.handle}:
    - Followers: ${comp.followerCount.toLocaleString()}
    - Engagement: ${(comp.engagementRate * 100).toFixed(1)}%
    - Top Content: ${comp.topContent.join(', ')}
    - Brands: ${comp.brandsWorkedWith.join(', ')}
    `).join('\n')}

    Provide:
    - Individual competitor analysis (strengths, strategies, opportunities)
    - Overall market position assessment
    - Recommended competitive strategy

    Return as JSON with "competitorAnalysis", "marketPosition", "recommendedStrategy".`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Failed to analyze competitors');

    return JSON.parse(content);
  }
}