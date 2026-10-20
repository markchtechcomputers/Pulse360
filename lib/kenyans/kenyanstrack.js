const axios = require("axios");
const cheerio = require("cheerio");

const kenyanstrack = async () => {
  try {
    const res = await axios.get("https://www.kenyans.co.ke/news/tracker", {
      timeout: 8000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });
    
    const $ = cheerio.load(res.data);
    const trackerData = [];
    
    // Group updates by date
    $('.news-updates').each((i, section) => {
      const dateHeading = $(section).find('h3').text().trim();
      
      // Get all updates for this date
      const updates = [];
      $(section).find('.update-row').each((j, row) => {
        const timeElement = $(row).find('.updates-time').first();
        const time = timeElement.clone().children().remove().end().text().trim();
        
        // Get the body content (excluding the time)
        const bodyElement = $(row).find('.updates-body').last();
        let body = bodyElement.html() || '';
        
        // Extract links
        const links = [];
        bodyElement.find('a').each((k, link) => {
          const href = $(link).attr('href');
          const text = $(link).text().trim();
          if (href && text) {
            links.push({
              text,
              url: href.startsWith('http') ? href : `https://www.kenyans.co.ke${href}`
            });
          }
        });
        
        // Clean body text (remove HTML tags but keep structure)
        let cleanBody = body.replace(/<br\s*\/?>/g, '\n').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        
        // Check if this is a breaking news update (has strong tags)
        const hasStrong = $(row).find('strong').length > 0;
        
        updates.push({
          time: time || null,
          body: cleanBody,
          links: links.length > 0 ? links : null,
          isBreaking: hasStrong,
          raw: $(row).text().replace(/\s+/g, ' ').trim()
        });
      });
      
      if (dateHeading && updates.length > 0) {
        trackerData.push({
          date: dateHeading,
          updates
        });
      }
    });
    
    // Get pagination information
    const pagination = [];
    $('.pager__items .pager__item a').each((i, el) => {
      const link = $(el);
      const href = link.attr('href');
      const text = link.text().trim();
      
      if (href && (text === '›' || text === 'Next')) {
        pagination.push({
          type: 'next',
          url: `https://www.kenyans.co.ke${href}`
        });
      } else if (href && !isNaN(parseInt(text))) {
        pagination.push({
          type: 'page',
          page: parseInt(text),
          url: `https://www.kenyans.co.ke${href}`
        });
      }
    });
    
    // Check if there's a next page
    const hasNextPage = $('.pager__item--next a').length > 0;
    const nextPageUrl = hasNextPage ? 
      `https://www.kenyans.co.ke${$('.pager__item--next a').attr('href')}` : 
      null;
    
    // Get current page
    const currentPageElement = $('.pager__item.is-active');
    const currentPage = currentPageElement.length > 0 ? 
      parseInt(currentPageElement.text().trim()) : 1;
    
    // Get breaking news from the top bar (if any)
    const breakingNews = [];
    $('.breaking a').each((i, el) => {
      const link = $(el);
      const text = link.text().trim();
      const href = link.attr('href');
      
      // Extract breaking news text (remove "Breaking News" label)
      const cleanText = text.replace('Breaking News»', '').replace('Breaking News', '').trim();
      
      if (cleanText && href) {
        breakingNews.push({
          title: cleanText,
          url: href.startsWith('http') ? href : `https://www.kenyans.co.ke${href}`,
          isBreaking: true
        });
      }
    });
    
    // Calculate total updates
    const totalUpdates = trackerData.reduce((acc, day) => acc + day.updates.length, 0);
    
    return {
      title: "News Tracker",
      url: "https://www.kenyans.co.ke/news/tracker",
      currentPage,
      hasNextPage,
      nextPageUrl,
      pagination: pagination.length > 0 ? pagination : null,
      breakingNews: breakingNews.length > 0 ? breakingNews : null,
      totalUpdates,
      updatesByDate: trackerData,
      fetchedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error("API Error:", error.message);
    throw new Error("Failed to fetch Kenyans.co.ke tracker: " + error.message);
  }
};

module.exports = { kenyanstrack };
