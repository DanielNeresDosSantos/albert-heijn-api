import puppeteer from 'puppeteer';
import Cache from '../utils/cache.js';

class AHScraper {
  constructor() {
    this.browser = null;
    this.baseUrl = 'https://www.ah.nl';
    this.cache = new Cache(3600000);
    this.lastRequestTime = 0;
    this.minRequestInterval = 1000;
  }

  async initialize() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--disable-blink-features=AutomationControlled',
          '--window-size=1920,1080'
        ]
      });
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
      );
    }
    
    this.lastRequestTime = Date.now();
  }

  async searchProducts(query, limit = 20) {
    const cacheKey = `search:${query}:${limit}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log(`Cache hit: ${query}`);
      return cached;
    }

    await this.waitForRateLimit();
    await this.initialize();
    const page = await this.browser.newPage();
    
    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      });
      
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        });
      });
      
      const searchUrl = `${this.baseUrl}/zoeken?query=${encodeURIComponent(query)}`;
      console.log(`Zoeken naar: ${searchUrl}`);
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      await page.waitForTimeout(3000);
      
      try {
        await page.waitForSelector('[data-testhook="product-card"], .product-card, [class*="ProductCard"], article, [class*="product"]', { timeout: 5000 });
      } catch (e) {
        console.log('Probeer alternatieve selectors...');
      }
      
      const products = await page.evaluate((maxProducts) => {
        let productCards = document.querySelectorAll('[data-testhook="product-card"]');
        
        if (productCards.length === 0) {
          productCards = document.querySelectorAll('.product-card, [class*="ProductCard"]');
        }
        
        if (productCards.length === 0) {
          productCards = document.querySelectorAll('article');
        }
        
        if (productCards.length === 0) {
          const allLinks = document.querySelectorAll('a[href*="/producten/"]');
          const uniqueProducts = new Map();
          
          allLinks.forEach(link => {
            const href = link.href;
            if (href.includes('/producten/product/')) {
              const productId = href.split('/').pop();
              if (!uniqueProducts.has(productId)) {
                const container = link.closest('div, article, li');
                if (container) {
                  uniqueProducts.set(productId, container);
                }
              }
            }
          });
          
          productCards = Array.from(uniqueProducts.values());
        }
        
        console.log(`Found ${productCards.length} product cards`);
        const results = [];
        
        for (let i = 0; i < Math.min(productCards.length, maxProducts); i++) {
          const card = productCards[i];
          
          const linkEl = card.querySelector('a[href*="/producten/product/"]') || card.querySelector('a');
          if (!linkEl) continue;
          
          const titleEl = card.querySelector('[data-testhook="product-title"]') ||
                         card.querySelector('.product-title') ||
                         card.querySelector('[class*="ProductTitle"]') ||
                         card.querySelector('h3') ||
                         card.querySelector('h2') ||
                         card.querySelector('[class*="title"]') ||
                         linkEl;
          
          const priceEl = card.querySelector('[data-testhook="price-amount"]') ||
                         card.querySelector('.price') ||
                         card.querySelector('[class*="Price"]') ||
                         card.querySelector('[class*="price"]');
          
          const imageEl = card.querySelector('img');
          
          const brandEl = card.querySelector('[data-testhook="product-brand"]') ||
                         card.querySelector('.brand') ||
                         card.querySelector('[class*="Brand"]');
          
          if (titleEl) {
            const productUrl = linkEl.href;
            const productId = productUrl.split('/').pop() || productUrl.split('/').slice(-2)[0];
            
            results.push({
              name: titleEl.textContent.trim(),
              brand: brandEl ? brandEl.textContent.trim() : null,
              price: priceEl ? priceEl.textContent.trim() : null,
              image: imageEl ? imageEl.src : null,
              url: productUrl,
              id: productId
            });
          }
        }
        
        return results;
      }, limit);
      
      console.log(`Gevonden: ${products.length} producten`);
      
      this.cache.set(cacheKey, products);
      return products;
    } catch (error) {
      console.error('Search error:', error.message);
      throw new Error(`Failed to search products: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  async getProductDetails(productId) {
    const cacheKey = `product:${productId}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log(`Cache hit: ${productId}`);
      return cached;
    }

    await this.waitForRateLimit();
    await this.initialize();
    const page = await this.browser.newPage();
    
    try {
      // Set realistic user agent
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Set extra headers
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      });
      
      // Remove automation flags
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        });
      });
      
      const productUrl = `${this.baseUrl}/producten/product/${productId}`;
      console.log(`Ophalen: ${productUrl}`);
      await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      await page.waitForTimeout(2000);
      
      const productDetails = await page.evaluate(() => {
        const getTextContent = (selector) => {
          const el = document.querySelector(selector);
          return el ? el.textContent.trim() : null;
        };
        
        const getImageSrc = (selector) => {
          const el = document.querySelector(selector);
          return el ? el.src : null;
        };
        
        const ingredientsEl = document.querySelector('[data-testhook="product-ingredients"], .ingredients, [class*="Ingredients"]');
        let ingredients = null;
        if (ingredientsEl) {
          ingredients = ingredientsEl.textContent.trim();
        }
        
        const allergensEl = document.querySelector('[data-testhook="product-allergens"], .allergens, [class*="Allergens"]');
        let allergens = null;
        if (allergensEl) {
          allergens = allergensEl.textContent.trim();
        }
        
        const nutritionTable = document.querySelector('[data-testhook="nutrition-table"], .nutrition-table, table[class*="Nutrition"]');
        let nutrition = null;
        if (nutritionTable) {
          const rows = nutritionTable.querySelectorAll('tr');
          nutrition = {};
          rows.forEach(row => {
            const cells = row.querySelectorAll('td, th');
            if (cells.length >= 2) {
              const key = cells[0].textContent.trim();
              const value = cells[1].textContent.trim();
              nutrition[key] = value;
            }
          });
        }
        
        return {
          name: getTextContent('[data-testhook="product-title"], .product-title, h1'),
          brand: getTextContent('[data-testhook="product-brand"], .brand, [class*="Brand"]'),
          price: getTextContent('[data-testhook="price-amount"], .price, [class*="Price"]'),
          image: getImageSrc('[data-testhook="product-image"], .product-image img, img[class*="Product"]'),
          description: getTextContent('[data-testhook="product-description"], .description, [class*="Description"]'),
          ingredients: ingredients,
          allergens: allergens,
          nutrition: nutrition,
          category: getTextContent('[data-testhook="breadcrumb"], .breadcrumb, nav[class*="Breadcrumb"]')
        };
      });
      
      this.cache.set(cacheKey, productDetails);
      return productDetails;
    } catch (error) {
      console.error('Product details error:', error.message);
      throw new Error(`Failed to get product details: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  async getCategories() {
    const cacheKey = 'categories';
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log('Cache hit: categories');
      return cached;
    }

    await this.waitForRateLimit();
    await this.initialize();
    const page = await this.browser.newPage();
    
    try {
      // Set realistic user agent
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Set extra headers
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      });
      
      // Remove automation flags
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        });
      });
      
      await page.goto(this.baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      const categories = await page.evaluate(() => {
        const categoryLinks = document.querySelectorAll(
          '[data-testhook="category-link"], .category-link, a[class*="Category"]'
        );
        const results = [];
        
        categoryLinks.forEach(link => {
          const name = link.textContent.trim();
          if (name) {
            results.push({
              name: name,
              url: link.href,
              id: link.href.split('/').pop()
            });
          }
        });
        
        return results;
      });
      
      this.cache.set(cacheKey, categories);
      return categories;
    } catch (error) {
      console.error('Categories error:', error.message);
      throw new Error(`Failed to get categories: ${error.message}`);
    } finally {
      await page.close();
    }
  }
}

export default AHScraper;
