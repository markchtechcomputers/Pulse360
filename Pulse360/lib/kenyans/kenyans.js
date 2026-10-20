const axios = require("axios");
const cheerio = require("cheerio");

const kenyans = async () => {
  try {
    const res = await axios.get("https://www.kenyans.co.ke/", {
      timeout: 8000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });
    
    const $ = cheerio.load(res.data);
    const articles = [];
    
    // Get breaking news
    $('.breaking a').each((i, el) => {
      const link = $(el);
      const title = link.text().replace('Breaking News»', '').trim();
      const url = link.attr('href');
      
      if (title && url) {
        articles.push({
          title,
          url: url.startsWith('http') ? url : `https://www.kenyans.co.ke${url}`,
          category: 'Breaking News'
        });
      }
    });
    
    // Get latest news articles
    $('.news-article-list').each((i, el) => {
      const articleBlock = $(el);
      const titleElement = articleBlock.find('.news-title a');
      const title = titleElement.text().replace('​​', '').replace('Breaking News', '').trim();
      const url = titleElement.attr('href');
      
      // Get image
      const imageElement = articleBlock.find('img');
      let imageUrl = imageElement.attr('src');
      if (imageUrl && !imageUrl.startsWith('data:')) {
        imageUrl = imageUrl.startsWith('http') ? imageUrl : `https://www.kenyans.co.ke${imageUrl}`;
      } else {
        // Try to get from srcset or data-src if available
        imageUrl = imageElement.attr('data-src') || 
                   imageElement.attr('srcset')?.split(' ')[0] || 
                   null;
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = `https://www.kenyans.co.ke${imageUrl}`;
        }
      }
      
      const date = articleBlock.find('.news-date').text().trim();
      const author = articleBlock.find('.news-author').text().replace('by', '').trim();
      const teaser = articleBlock.find('.news-teaser').text().trim();
      
      if (title && url) {
        articles.push({
          title,
          url: url.startsWith('http') ? url : `https://www.kenyans.co.ke${url}`,
          imageUrl: imageUrl || null,
          date: date || null,
          author: author || null,
          teaser: teaser || null,
          category: 'Latest News'
        });
      }
    });
    
    // Get top stories
    $('.news-top-story-list').each((i, el) => {
      const topStory = $(el);
      const titleElement = topStory.find('.news-title a');
      const title = titleElement.text().replace('Breaking News', '').trim();
      const url = titleElement.attr('href');
      
      // Get image for top story
      const imageElement = topStory.find('img');
      let imageUrl = imageElement.attr('src');
      if (imageUrl && !imageUrl.startsWith('data:')) {
        imageUrl = imageUrl.startsWith('http') ? imageUrl : `https://www.kenyans.co.ke${imageUrl}`;
      } else {
        // Try to get from picture source
        const sourceElement = topStory.find('source').first();
        imageUrl = sourceElement.attr('srcset')?.split(' ')[0];
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = `https://www.kenyans.co.ke${imageUrl}`;
        }
      }
      
      const date = topStory.find('.news-date').text().trim();
      const author = topStory.find('.news-author').text().replace('by', '').trim();
      const teaser = topStory.find('.news-teaser').text().trim();
      
      if (title && url) {
        articles.push({
          title,
          url: url.startsWith('http') ? url : `https://www.kenyans.co.ke${url}`,
          imageUrl: imageUrl || null,
          date: date || null,
          author: author || null,
          teaser: teaser || null,
          category: 'Top Story'
        });
      }
    });
    
    // Get featured articles
    $('.featured-article').each((i, el) => {
      const featured = $(el);
      const titleElement = featured.find('.news-title a');
      const title = titleElement.text().trim();
      const url = titleElement.attr('href');
      
      const imageElement = featured.find('img');
      let imageUrl = imageElement.attr('src');
      if (imageUrl && !imageUrl.startsWith('data:')) {
        imageUrl = imageUrl.startsWith('http') ? imageUrl : `https://www.kenyans.co.ke${imageUrl}`;
      }
      
      const author = featured.find('.news-author').text().replace('by', '').trim();
      const teaser = featured.find('.news-teaser').text().trim();
      
      if (title && url) {
        articles.push({
          title,
          url: url.startsWith('http') ? url : `https://www.kenyans.co.ke${url}`,
          imageUrl: imageUrl || null,
          author: author || null,
          teaser: teaser || null,
          category: 'Featured'
        });
      }
    });
    
    // Get popular news
    $('.news-popular-list').each((i, el) => {
      const popular = $(el);
      const linkElement = popular.find('a');
      const title = linkElement.find('.news-title').text().trim() || linkElement.text().trim();
      const url = linkElement.attr('href');
      const counter = popular.find('.news-counter').text().trim();
      
      if (title && url && !articles.some(a => a.url === (url.startsWith('http') ? url : `https://www.kenyans.co.ke${url}`))) {
        articles.push({
          title,
          url: url.startsWith('http') ? url : `https://www.kenyans.co.ke${url}`,
          rank: counter || null,
          category: 'Popular'
        });
      }
    });
    
    // Get news tracker updates
    $('.update-row').each((i, el) => {
      const update = $(el);
      const time = update.find('.updates-time').first().text().trim();
      const body = update.find('.updates-body').last().text().trim();
      const link = update.find('a').attr('href');
      
      if (body) {
        articles.push({
          title: body.substring(0, 100) + (body.length > 100 ? '...' : ''),
          url: link ? (link.startsWith('http') ? link : `https://www.kenyans.co.ke${link}`) : null,
          time: time || null,
          content: body,
          category: 'News Tracker'
        });
      }
    });
    
    // Remove duplicates based on URL
    const uniqueArticles = [];
    const seenUrls = new Set();
    
    for (const article of articles) {
      if (!seenUrls.has(article.url)) {
        seenUrls.add(article.url);
        uniqueArticles.push(article);
      }
    }
    
    return uniqueArticles;
    
  } catch (error) {
    console.error("API Error:", error.message);
    throw new Error("Failed to fetch Kenyans.co.ke: " + error.message);
  }
};

module.exports = { kenyans };
