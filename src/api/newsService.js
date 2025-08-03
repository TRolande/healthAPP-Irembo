// News API Service for IremboCare+
// Provides health-related news for Rwanda

const { fetchWithRetry } = require('../utils/apiRetry');
const logger = require('../utils/logger');

class NewsService {
  constructor() {
    this.apiKey = process.env.NEWS_API_KEY;
    this.baseUrl = process.env.NEWS_API_URL || 'https://newsapi.org/v2';
  }

  // Get health news for Rwanda
  async getHealthNews(options = {}) {
    const {
      country = 'rw',
      category = 'health',
      pageSize = 10,
      language = 'en'
    } = options;

    if (!this.apiKey) {
      logger.warn('News API key not configured, using mock data');
      return this.getMockNewsData();
    }

    try {
      // Try country-specific news first
      let url = `${this.baseUrl}/top-headlines?country=${country}&category=${category}&pageSize=${pageSize}&apiKey=${this.apiKey}`;
      
      let response = await fetchWithRetry(url, {
        timeout: 10000
      }, {
        context: 'News API - Country Headlines',
        maxRetries: 2
      });

      let data = await response.json();

      // If no country-specific news, try general health news with Rwanda keywords
      if (!data.articles || data.articles.length === 0) {
        url = `${this.baseUrl}/everything?q=health AND (Rwanda OR Africa)&language=${language}&pageSize=${pageSize}&sortBy=publishedAt&apiKey=${this.apiKey}`;
        
        response = await fetchWithRetry(url, {
          timeout: 10000
        }, {
          context: 'News API - General Health',
          maxRetries: 2
        });

        data = await response.json();
      }

      if (data.status === 'error') {
        throw new Error(data.message || 'News API error');
      }

      logger.info(`Health news fetched`, {
        articlesCount: data.articles?.length || 0,
        country,
        category
      });

      return this.formatNewsData(data.articles || []);
    } catch (error) {
      logger.error('Failed to fetch health news', {
        error: error.message,
        country,
        category
      });
      
      // Return mock data as fallback
      return this.getMockNewsData();
    }
  }

  // Format news data
  formatNewsData(articles) {
    const formattedArticles = articles
      .filter(article => article.title && article.title !== '[Removed]')
      .map(article => ({
        id: this.generateArticleId(article),
        title: article.title,
        description: article.description || 'No description available',
        url: article.url,
        source: article.source?.name || 'Unknown Source',
        publishedAt: article.publishedAt,
        urlToImage: article.urlToImage,
        relevanceScore: this.calculateRelevanceScore(article),
        healthCategory: this.categorizeHealthNews(article)
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    return {
      success: true,
      data: formattedArticles,
      count: formattedArticles.length,
      timestamp: new Date().toISOString()
    };
  }

  // Generate unique article ID
  generateArticleId(article) {
    const title = article.title || '';
    const source = article.source?.name || '';
    return Buffer.from(`${title}-${source}`).toString('base64').substring(0, 16);
  }

  // Calculate relevance score for health news
  calculateRelevanceScore(article) {
    let score = 0;
    const text = `${article.title} ${article.description}`.toLowerCase();

    // Rwanda-specific keywords (higher priority)
    const rwandaKeywords = ['rwanda', 'kigali', 'rwandan', 'east africa'];
    rwandaKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 10;
    });

    // Health priority keywords
    const priorityHealthKeywords = [
      'malaria', 'covid', 'vaccination', 'epidemic', 'outbreak',
      'maternal health', 'child health', 'nutrition', 'hiv', 'aids'
    ];
    priorityHealthKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 8;
    });

    // General health keywords
    const generalHealthKeywords = [
      'health', 'medical', 'hospital', 'doctor', 'treatment',
      'disease', 'medicine', 'healthcare', 'clinic', 'patient'
    ];
    generalHealthKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 3;
    });

    // Recency bonus (newer articles get higher scores)
    const publishedDate = new Date(article.publishedAt);
    const daysSincePublished = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePublished <= 1) score += 5;
    else if (daysSincePublished <= 7) score += 3;
    else if (daysSincePublished <= 30) score += 1;

    return score;
  }

  // Categorize health news
  categorizeHealthNews(article) {
    const text = `${article.title} ${article.description}`.toLowerCase();

    if (text.includes('malaria') || text.includes('mosquito')) return 'Malaria & Vector Control';
    if (text.includes('covid') || text.includes('coronavirus')) return 'COVID-19';
    if (text.includes('vaccination') || text.includes('vaccine')) return 'Vaccination';
    if (text.includes('maternal') || text.includes('pregnancy')) return 'Maternal Health';
    if (text.includes('child') || text.includes('pediatric')) return 'Child Health';
    if (text.includes('nutrition') || text.includes('malnutrition')) return 'Nutrition';
    if (text.includes('mental health') || text.includes('depression')) return 'Mental Health';
    if (text.includes('hiv') || text.includes('aids')) return 'HIV/AIDS';
    if (text.includes('cancer') || text.includes('oncology')) return 'Cancer';
    if (text.includes('diabetes') || text.includes('hypertension')) return 'Non-Communicable Diseases';

    return 'General Health';
  }

  // Get health news by category
  async getHealthNewsByCategory(category, options = {}) {
    try {
      const newsData = await this.getHealthNews(options);
      
      if (!newsData.success) {
        return newsData;
      }

      const filteredArticles = newsData.data.filter(article => 
        article.healthCategory.toLowerCase().includes(category.toLowerCase()) ||
        article.title.toLowerCase().includes(category.toLowerCase()) ||
        article.description.toLowerCase().includes(category.toLowerCase())
      );

      return {
        success: true,
        data: filteredArticles,
        category,
        count: filteredArticles.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Failed to fetch health news for category: ${category}`, {
        error: error.message
      });

      throw new Error(`Unable to fetch health news for category: ${category}`);
    }
  }

  // Mock news data for fallback
  getMockNewsData() {
    const mockArticles = [
      {
        id: 'mock-001',
        title: 'Rwanda Launches New Malaria Prevention Campaign',
        description: 'The Ministry of Health announces a comprehensive malaria prevention program targeting high-risk areas across Rwanda.',
        url: 'https://example.com/malaria-campaign',
        source: 'Rwanda Health Ministry',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        urlToImage: null,
        relevanceScore: 25,
        healthCategory: 'Malaria & Vector Control'
      },
      {
        id: 'mock-002',
        title: 'COVID-19 Vaccination Drive Reaches Rural Communities',
        description: 'Mobile vaccination units are bringing COVID-19 vaccines to remote areas of Rwanda, improving accessibility for all citizens.',
        url: 'https://example.com/covid-vaccination',
        source: 'Rwanda Biomedical Centre',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        urlToImage: null,
        relevanceScore: 23,
        healthCategory: 'COVID-19'
      },
      {
        id: 'mock-003',
        title: 'Maternal Health Services Expanded in Eastern Province',
        description: 'New maternal health centers are being established to reduce maternal mortality rates and improve prenatal care.',
        url: 'https://example.com/maternal-health',
        source: 'Rwanda Health News',
        publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
        urlToImage: null,
        relevanceScore: 20,
        healthCategory: 'Maternal Health'
      },
      {
        id: 'mock-004',
        title: 'Digital Health Records System Improves Patient Care',
        description: 'Rwanda\'s new electronic health records system is streamlining patient care and improving health outcomes nationwide.',
        url: 'https://example.com/digital-health',
        source: 'Health Tech Rwanda',
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        urlToImage: null,
        relevanceScore: 18,
        healthCategory: 'General Health'
      },
      {
        id: 'mock-005',
        title: 'Nutrition Program Targets Child Malnutrition',
        description: 'A new government initiative aims to reduce child malnutrition rates through community-based nutrition programs.',
        url: 'https://example.com/nutrition-program',
        source: 'UNICEF Rwanda',
        publishedAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(), // 1.5 days ago
        urlToImage: null,
        relevanceScore: 22,
        healthCategory: 'Nutrition'
      }
    ];

    logger.info('Using mock health news data');

    return {
      success: true,
      data: mockArticles,
      count: mockArticles.length,
      timestamp: new Date().toISOString(),
      isMockData: true
    };
  }

  // Get trending health topics
  async getTrendingHealthTopics() {
    try {
      const newsData = await this.getHealthNews({ pageSize: 50 });
      
      if (!newsData.success) {
        return { success: false, error: 'Failed to fetch news data' };
      }

      // Count categories
      const categoryCount = {};
      newsData.data.forEach(article => {
        const category = article.healthCategory;
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });

      // Sort by frequency
      const trendingTopics = Object.entries(categoryCount)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        success: true,
        data: trendingTopics,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get trending health topics', {
        error: error.message
      });

      return {
        success: false,
        error: 'Unable to fetch trending health topics'
      };
    }
  }
}

module.exports = new NewsService();