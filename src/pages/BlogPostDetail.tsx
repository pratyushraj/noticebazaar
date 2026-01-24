import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, FileText, ExternalLink, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getBlogPostBySlug } from '@/data/blogPosts';
import { SEOHead } from '@/components/seo/SEOHead';
import { ArticleSchema, FAQSchema, BreadcrumbSchema } from '@/components/seo/SchemaMarkup';
import NotFound from './NotFound';

const BlogPostDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPostBySlug(slug) : undefined;

  // If post not found, show 404
  if (!post) {
    return <NotFound />;
  }

  const baseUrl = 'https://creatorarmour.com';
  const canonicalUrl = `${baseUrl}/blog/${post.slug}`;
  const postImage = post.image || 'https://creatorarmour.com/og-preview.png';

  // Breadcrumb items
  const breadcrumbItems = [
    { name: 'Home', url: baseUrl },
    { name: 'Blog', url: `${baseUrl}/blog` },
    { name: post.title, url: canonicalUrl },
  ];

  return (
    <>
      {/* SEO Meta Tags */}
      <SEOHead
        title={post.title}
        description={post.metaDescription}
        keywords={post.keywords}
        image={postImage}
        type="article"
        publishedTime={new Date(post.date).toISOString()}
        author={post.author?.name}
        canonicalUrl={canonicalUrl}
      />

      {/* Schema Markup */}
      <ArticleSchema
        title={post.title}
        description={post.metaDescription}
        image={postImage}
        datePublished={new Date(post.date).toISOString()}
        author={post.author}
      />
      <FAQSchema faqs={post.faqs} />
      <BreadcrumbSchema items={breadcrumbItems} />

    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
      <div className="container mx-auto px-6 py-12">
          {/* Breadcrumb Navigation */}
          <nav className="mb-8 text-sm text-purple-300" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link to="/blog" className="hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>/</li>
              <li className="text-white font-medium" aria-current="page">
                {post.title}
              </li>
            </ol>
          </nav>

        <Button 
          asChild 
          className="mb-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg shadow-purple-500/30"
        >
          <Link to="/blog">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Blog
          </Link>
        </Button>
        
        <article className="max-w-4xl mx-auto bg-white/10 backdrop-blur-md p-8 rounded-xl shadow-lg border border-white/20">
            {/* Article Header */}
          <header className="mb-6 border-b border-white/20 pb-4">
            <span className="inline-block text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full mb-2">
              {post.category}
            </span>
            <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-purple-200 via-pink-200 to-purple-100 text-transparent bg-clip-text">
              {post.title}
            </h1>
              <div className="flex items-center gap-4 text-sm text-purple-200">
                <time dateTime={post.date}>
                  Published on: {new Date(post.date).toLocaleDateString('en-IN', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </time>
                <span>•</span>
                <span>{post.readTime}</span>
              </div>
          </header>
          
          {/* Featured Image */}
            {post.image && (
          <div className="w-full h-64 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl overflow-hidden mb-6 relative">
              <img
                  src={post.image}
                alt={post.title}
                className="w-full h-full object-cover relative z-10"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            <div 
              className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center transition-opacity duration-300 z-0"
                  style={{ opacity: 0 }}
            >
              <FileText className="w-16 h-16 text-white/50" />
            </div>
          </div>
            )}
          
            {/* Article Content */}
          <div className="prose prose-invert max-w-none space-y-8 text-purple-100">
              {/* Introduction */}
              <p className="text-lg text-purple-200 leading-relaxed">
                {post.content.introduction}
              </p>

              {/* Sections */}
              {post.content.sections.map((section, sectionIndex) => (
                <section key={sectionIndex}>
                  <h2 className="text-2xl font-bold text-white mb-4 mt-8">
                    {section.heading}
                  </h2>
                  <p className="text-purple-100 leading-relaxed mb-4">
                    {section.content}
                  </p>

                  {/* Subsections (H3) */}
                  {section.subsections?.map((subsection, subsectionIndex) => (
                    <div key={subsectionIndex} className="mt-4">
                      <h3 className="text-xl font-semibold text-white mb-3">
                        {subsection.heading}
                      </h3>
                      {subsection.isCodeBlock ? (
                        <div className="bg-purple-900/30 p-4 rounded-lg border border-purple-500/30">
                          <p className="text-sm text-purple-200">
                            <strong className="text-white">Sample email:</strong> "{subsection.content}"
                          </p>
                        </div>
                      ) : (
                        <p className="text-purple-100 leading-relaxed">
                          {subsection.content}
                        </p>
                      )}
                    </div>
                  ))}
                </section>
              ))}

              {/* Conclusion */}
              {post.content.conclusion && (
                <div className="mt-8 p-6 bg-purple-900/30 rounded-lg border border-purple-500/30">
                  <p className="text-lg text-purple-200 leading-relaxed">
                    {post.content.conclusion}
                  </p>
                </div>
              )}

              {/* Internal Links Section */}
              {post.internalLinks && (
                <div className="mt-8 space-y-4">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Related Resources
                  </h2>
                  
                  {post.internalLinks.contractTool && (
                    <Link to="/contract-analyzer" className="block no-underline">
                      <Card className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur-md p-4 border-l-4 border-purple-400 hover:from-purple-600/40 hover:to-pink-600/40 cursor-pointer transition-all duration-200 hover:scale-[1.02]">
                        <CardContent className="p-0 flex flex-col space-y-3">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 text-purple-200 mr-3 flex-shrink-0" />
                            <p className="text-sm text-white font-semibold">
                              Free Contract Analyzer
                            </p>
                            <ExternalLink className="h-4 w-4 text-purple-200 ml-2" />
                          </div>
                          <p className="text-sm text-purple-200">
                            Upload your contract and get instant feedback on risky clauses, payment terms, and legal protections.
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  )}

                  {post.internalLinks.homepage && (
                    <Link to="/" className="block no-underline">
                      <Card className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur-md p-4 border-l-4 border-purple-400 hover:from-purple-600/40 hover:to-pink-600/40 cursor-pointer transition-all duration-200 hover:scale-[1.02]">
                        <CardContent className="p-0 flex flex-col space-y-3">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 text-purple-200 mr-3 flex-shrink-0" />
                            <p className="text-sm text-white font-semibold">
                              Explore CreatorArmour
                            </p>
                            <ExternalLink className="h-4 w-4 text-purple-200 ml-2" />
                          </div>
                          <p className="text-sm text-purple-200">
                            Protect your brand deals with contract generation, payment tracking, and legal support. Start free.
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  )}

                  {post.internalLinks.collabLink && (
                    <Link to="/signup" className="block no-underline">
                      <Card className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur-md p-4 border-l-4 border-purple-400 hover:from-purple-600/40 hover:to-pink-600/40 cursor-pointer transition-all duration-200 hover:scale-[1.02]">
                        <CardContent className="p-0 flex flex-col space-y-3">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 text-purple-200 mr-3 flex-shrink-0" />
                            <p className="text-sm text-white font-semibold">
                              Create Your Collab Link
                            </p>
                            <ExternalLink className="h-4 w-4 text-purple-200 ml-2" />
                          </div>
                          <p className="text-sm text-purple-200">
                            Share a professional collaboration link in your bio and let brands submit requests directly.
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  )}
                </div>
              )}

              {/* FAQ Section */}
              {post.faqs.length > 0 && (
                <div className="mt-12 pt-8 border-t border-white/20">
                  <h2 className="text-2xl font-bold text-white mb-6">
                    Frequently Asked Questions
                  </h2>
                  <div className="space-y-6">
                    {post.faqs.map((faq, index) => (
                      <div key={index} className="bg-purple-900/30 p-5 rounded-lg border border-purple-500/30">
                        <h3 className="text-lg font-semibold text-white mb-2">
                          {faq.question}
                        </h3>
                        <p className="text-purple-200 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Collab Link CTA - Funnel */}
              <div className="mt-12 pt-8 border-t border-white/20">
                <Card className="bg-gradient-to-r from-purple-600/40 to-pink-600/40 backdrop-blur-md border-purple-400/50">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-white mb-2">
                          Want brands to approach you professionally?
                        </h2>
                        <p className="text-purple-200 text-lg">
                          Get your free collab link. Share it in your bio and let brands submit collaboration requests directly—no DMs, no confusion.
                        </p>
                      </div>
                      <Button
                        asChild
                        className="bg-white text-purple-600 hover:bg-purple-50 font-semibold px-6 py-6 text-lg whitespace-nowrap"
                      >
                        <Link to="/signup">
                          Get Your Collab Link <ArrowRight className="h-5 w-5 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Disclaimer */}
              <div className="mt-12 pt-8 border-t border-white/20">
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-lg font-semibold text-yellow-200 mb-2">
                        Legal Disclaimer
                      </h3>
                      <p className="text-sm text-yellow-100 leading-relaxed">
                        This article is for informational purposes only and does not constitute legal, financial, or professional advice. 
                        While we strive to provide accurate information, laws and regulations may vary by jurisdiction and change over time. 
                        Individual circumstances may differ, and results are not guaranteed. Always consult with a qualified legal or financial 
                        professional for advice specific to your situation. CreatorArmour does not guarantee payment recovery or specific outcomes. 
                        Past results do not guarantee future performance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
          </div>
        </article>
      </div>
    </div>
    </>
  );
};

export default BlogPostDetail;
