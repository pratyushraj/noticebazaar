# Blog Post Guide

## How to Add a New Blog Post

### Step 1: Create Your Blog Post Data

Open `src/data/blogPosts.ts` and add a new entry to the `blogPosts` array.

### Step 2: Fill in Required Fields

```typescript
{
  slug: 'your-blog-post-slug', // URL-friendly, lowercase, hyphens
  title: 'Your Blog Post Title', // 55-60 characters max
  metaDescription: 'Your meta description here...', // 150-160 characters
  category: 'Legal' | 'Finance' | 'Business' | 'Tips',
  date: '2026-01-23', // ISO format: YYYY-MM-DD
  readTime: '5 min read',
  image: '/blog-images/your-image.jpg', // Optional
  summary: 'Short summary for listing page',
  keywords: ['keyword1', 'keyword2', 'keyword3'],
  content: {
    introduction: 'First paragraph that hooks the reader...',
    sections: [
      {
        heading: 'Section Heading (H2)',
        content: 'Section content...',
        subsections: [ // Optional
          {
            heading: 'Subsection Heading (H3)',
            content: 'Subsection content...',
          },
        ],
      },
    ],
    conclusion: 'Optional conclusion paragraph',
  },
  faqs: [
    {
      question: 'Your FAQ question?',
      answer: 'Your FAQ answer.',
    },
  ],
  internalLinks: {
    contractTool: true, // Link to contract analyzer
    homepage: true, // Link to homepage
    collabLink: false, // Link to collab link feature
  },
  author: {
    name: 'CreatorArmour',
    type: 'Organization',
  },
}
```

### Step 3: SEO Best Practices

#### Title (55-60 characters)
- ✅ Good: "What to Do When a Brand Doesn't Pay: Guide"
- ❌ Bad: "What to Do When a Brand Doesn't Pay: A Comprehensive Step-by-Step Guide for Content Creators"

#### Meta Description (150-160 characters)
- ✅ Good: "Step-by-step guide for creators facing non-payment from brands. Learn how to send reminders, escalate professionally, and recover unpaid fees in India."
- ❌ Bad: "Guide about payments" (too short) or a very long description (over 160 chars)

#### Heading Hierarchy
- Use H1 for the main title (automatically added)
- Use H2 for main sections
- Use H3 for subsections (optional)
- Maintain logical order

#### Keywords
- Include 3-5 relevant keywords
- Think about what creators would search for
- Include location-specific terms (e.g., "India") when relevant

### Step 4: Content Guidelines

#### Tone
- Human, conversational tone
- Not legal jargon
- Step-by-step guidance
- India-specific context

#### Structure
1. **Introduction**: Hook the reader, explain the problem
2. **Sections**: Break down into logical steps or topics
3. **Conclusion**: Optional summary or call-to-action
4. **FAQs**: 3-5 relevant questions
5. **Internal Links**: Link to relevant CreatorArmour features
6. **Disclaimer**: Automatically added

#### Internal Links
- **contractTool**: Link to `/contract-analyzer` (free contract analysis)
- **homepage**: Link to `/` (CreatorArmour homepage)
- **collabLink**: Link to collab link feature (if relevant)

### Step 5: FAQ Section

Add 3-5 FAQs that:
- Answer common questions about the topic
- Use natural language
- Provide actionable answers
- Are relevant to creators in India

### Step 6: Safety & Disclaimers

A disclaimer is automatically added to every blog post. It includes:
- Informational purposes only
- Not legal/financial advice
- No guarantees
- Consult professionals

**Important**: Never make claims like "guaranteed recovery" or absolute promises.

### Step 7: Test Your Post

1. Start your dev server
2. Navigate to `/blog`
3. Find your post in the listing
4. Click through to `/blog/your-slug`
5. Verify:
   - Title and meta description appear correctly
   - Headings are properly structured
   - FAQs display correctly
   - Internal links work
   - Disclaimer appears at bottom

### Example: Complete Blog Post

```typescript
{
  slug: 'gst-registration-for-creators',
  title: 'GST Registration for Creators: Complete Guide',
  metaDescription: 'Learn when creators need GST registration, how to register, and compliance requirements. Step-by-step guide for Indian content creators.',
  category: 'Finance',
  date: '2026-01-25',
  readTime: '8 min read',
  image: '/blog-images/gst-guide.jpg',
  summary: 'Complete guide to GST registration for content creators in India. Learn when registration is required and how to comply.',
  keywords: ['GST registration', 'creator taxes', 'GST for influencers', 'India', 'tax compliance'],
  content: {
    introduction: 'As a content creator in India, understanding GST registration is crucial. This guide explains when you need to register, how to do it, and what compliance looks like.',
    sections: [
      {
        heading: 'When Do Creators Need GST Registration?',
        content: 'You need GST registration if your annual revenue exceeds ₹20 lakhs (₹10 lakhs for special category states). This includes all income from brand deals, sponsorships, affiliate marketing, and other creator activities.',
        subsections: [
          {
            heading: 'Special Category States',
            content: 'If you\'re based in Arunachal Pradesh, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura, or Uttarakhand, the threshold is ₹10 lakhs.',
          },
        ],
      },
      {
        heading: 'How to Register for GST',
        content: 'GST registration can be done online through the GST portal. You\'ll need your PAN, Aadhaar, bank account details, and business address. The process typically takes 3-7 working days.',
      },
    ],
    conclusion: 'GST registration is straightforward once you understand the requirements. CreatorArmour can help you track your revenue and determine when registration is needed.',
  },
  faqs: [
    {
      question: 'Do I need GST if I earn less than ₹20 lakhs?',
      answer: 'No, GST registration is only mandatory if your annual revenue exceeds ₹20 lakhs (₹10 lakhs for special category states). However, you can voluntarily register if you want to claim input tax credit.',
    },
    {
      question: 'How do I calculate my annual revenue for GST?',
      answer: 'Add up all income from brand deals, sponsorships, affiliate marketing, platform revenue, and any other creator-related income. CreatorArmour helps you track this automatically.',
    },
  ],
  internalLinks: {
    contractTool: true,
    homepage: true,
  },
  author: {
    name: 'CreatorArmour',
    type: 'Organization',
  },
}
```

### SEO Checklist

Before publishing, verify:
- [ ] Title is 55-60 characters
- [ ] Meta description is 150-160 characters
- [ ] Proper H1, H2, H3 hierarchy
- [ ] At least 3 FAQs included
- [ ] Internal links configured
- [ ] Keywords are relevant
- [ ] Content is India-specific where relevant
- [ ] No absolute claims or guarantees
- [ ] Human, conversational tone

### Need Help?

- Check existing blog posts in `src/data/blogPosts.ts` for examples
- Review the SEO components in `src/components/seo/`
- Test your post locally before deploying

