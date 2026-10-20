const axios = require("axios");
const cheerio = require("cheerio");

const kenyansearch = async (query) => {
  try {
    const url = `https://www.kenyans.co.ke/search?search=${encodeURIComponent(query)}&sort_by=date&sort_order=DESC`;
    const res = await axios.get(url, {
      timeout: 8000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });
    
    const $ = cheerio.load(res.data);
    const results = [];
    
    // Get search result count
    const resultCountText = $('.search-header').text().trim();
    const resultCountMatch = resultCountText.match(/Displaying \d+ - \d+ of ([\d,]+)/);
    const totalResults = resultCountMatch ? resultCountMatch[1].replace(/,/g, '') : null;
    
    // Parse each search result
    $('.search-wrapper .search-title').each((i, el) => {
      const titleElement = $(el);
      const link = titleElement.find('a');
      const title = link.text().trim();
      const url = link.attr('href');
      
      // Get the parent container for this result
      const resultContainer = titleElement.closest('li');
      
      // Get date
      const dateElement = resultContainer.find('.search-date time');
      const date = dateElement.attr('datetime') || dateElement.text().trim();
      
      // Get excerpt
      const excerpt = resultContainer.find('.search-excerpt').text().trim();
      
      // Get the full result item to check for images (though search results may not have images)
      const imageElement = resultContainer.find('img').first();
      let imageUrl = imageElement.attr('src');
      if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
        imageUrl = `https://www.kenyans.co.ke${imageUrl}`;
      } else if (imageUrl && imageUrl.startsWith('data:')) {
        // Try to get from srcset
        const srcset = imageElement.attr('srcset');
        if (srcset) {
          imageUrl = srcset.split(' ')[0];
          if (!imageUrl.startsWith('http')) {
            imageUrl = `https://www.kenyans.co.ke${imageUrl}`;
          }
        } else {
          imageUrl = null;
        }
      }
      
      if (title && url) {
        results.push({
          title,
          url: url.startsWith('http') ? url : `https://www.kenyans.co.ke${url}`,
          date: date || null,
          excerpt: excerpt || null,
          imageUrl: imageUrl || null,
          query: query
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
        // Next page
        pagination.push({
          type: 'next',
          url: `https://www.kenyans.co.ke${href}`
        });
      } else if (href && !isNaN(parseInt(text))) {
        // Page number
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
    
    // Remove duplicates based on URL
    const uniqueResults = [];
    const seenUrls = new Set();
    
    for (const result of results) {
      if (!seenUrls.has(result.url)) {
        seenUrls.add(result.url);
        uniqueResults.push(result);
      }
    }
    
    return {
      query,
      totalResults: totalResults ? parseInt(totalResults) : null,
      currentPage,
      hasNextPage,
      nextPageUrl,
      pagination: pagination.length > 0 ? pagination : null,
      resultsCount: uniqueResults.length,
      results: uniqueResults,
      fetchedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error("API Error:", error.message);
    throw new Error("Failed to fetch Kenyans.co.ke search: " + error.message);
  }
};

module.exports = { kenyansearch };
