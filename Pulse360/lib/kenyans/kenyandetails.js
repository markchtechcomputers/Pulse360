const axios = require("axios");
const cheerio = require("cheerio");

const kenyandetails = async (url) => {
  try {
    const res = await axios.get(url, {
      timeout: 8000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });
    
    const $ = cheerio.load(res.data);
    
    // Extract article details
    const title = $('h1.page-title').text().trim() || 
                  $('meta[property="og:title"]').attr('content') || 
                  $('title').text().replace(' - Kenyans.co.ke', '').trim();
    
    // Get author
    const author = $('.news-author a').text().trim() || 
                   $('meta[name="twitter:creator"]').attr('content') || 
                   $('.news-author').text().replace('by', '').trim();
    
    // Get publication date
    const publishedDate = $('meta[property="article:published_time"]').attr('content') || 
                          $('time.datetime').attr('datetime') || 
                          $('.article-date time').attr('datetime') ||
                          $('.news-date time').attr('datetime');
    
    const modifiedDate = $('meta[property="article:modified_time"]').attr('content');
    
    // Get featured image
    let imageUrl = $('meta[property="og:image"]').attr('content') || 
                   $('meta[name="twitter:image"]').attr('content') || 
                   $('link[rel="image_src"]').attr('href');
    
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = `https://www.kenyans.co.ke${imageUrl}`;
    }
    
    // Get image caption
    const imageCaption = $('.field--name-field-image-caption').first().text().trim() || 
                         $('figcaption').text().trim() ||
                         $('img[alt]').first().attr('alt') || '';
    
    // Get article content
    const content = [];
    $('.field--name-body p').each((i, el) => {
      const text = $(el).text().trim();
      if (text) {
        content.push(text);
      }
    });
    
    // Get all images within the article body
    const bodyImages = [];
    $('.field--name-body img, .field--name-body picture img').each((i, el) => {
      const img = $(el);
      let src = img.attr('src');
      
      // Try to get from srcset if src is data:image
      if (src && src.startsWith('data:')) {
        const srcset = img.attr('srcset');
        if (srcset) {
          src = srcset.split(' ')[0];
        }
      }
      
      if (src && !src.startsWith('data:')) {
        if (!src.startsWith('http')) {
          src = `https://www.kenyans.co.ke${src}`;
        }
        bodyImages.push({
          url: src,
          alt: img.attr('alt') || '',
          caption: img.closest('figure').find('figcaption').text().trim() || 
                   img.closest('.media').find('.field--name-field-image-caption').text().trim() || ''
        });
      }
    });
    
    // Get article description/summary
    const description = $('meta[name="description"]').attr('content') || 
                        $('meta[property="og:description"]').attr('content') || '';
    
    // Get category/tags
    const categories = [];
    $('.field--name-field-tags a, .taxonomy-term a').each((i, el) => {
      categories.push($(el).text().trim());
    });
    
    // Get related articles (if any)
    const relatedArticles = [];
    $('.news-article-list a[href*="/news/"]').each((i, el) => {
      const link = $(el);
      const href = link.attr('href');
      const relatedTitle = link.text().trim() || link.closest('.news-article-block').find('.news-title').text().trim();
      
      if (href && relatedTitle && !href.includes(url)) {
        relatedArticles.push({
          title: relatedTitle,
          url: href.startsWith('http') ? href : `https://www.kenyans.co.ke${href}`
        });
      }
    });
    
    // Get word count
    const wordCount = content.join(' ').split(/\s+/).length;
    
    // Get canonical URL
    const canonicalUrl = $('link[rel="canonical"]').attr('href') || url;
    
    return {
      title,
      url: canonicalUrl,
      author: author || null,
      publishedDate: publishedDate || null,
      modifiedDate: modifiedDate || null,
      description: description || null,
      imageUrl: imageUrl || null,
      imageCaption: imageCaption || null,
      content: content.length > 0 ? content : null,
      bodyImages: bodyImages.length > 0 ? bodyImages : null,
      categories: categories.length > 0 ? categories : null,
      relatedArticles: relatedArticles.length > 0 ? [...new Map(relatedArticles.map(item => [item.url, item])).values()] : null, // remove duplicates
      wordCount: wordCount || 0,
      fetchedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error("API Error:", error.message);
    throw new Error("Failed to fetch Kenyans.co.ke article: " + error.message);
  }
};

module.exports = { kenyandetails };
