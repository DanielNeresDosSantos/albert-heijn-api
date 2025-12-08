import express from 'express';
import AHScraper from '../scraper/ahScraper.js';

const router = express.Router();
const scraper = new AHScraper();

router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required'
      });
    }
    
    const products = await scraper.searchProducts(q, parseInt(limit));
    
    res.json({
      success: true,
      count: products.length,
      query: q,
      data: products
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }
    
    const product = await scraper.getProductDetails(productId);
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Product details error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/categories/list', async (req, res) => {
  try {
    const categories = await scraper.getCategories();
    
    res.json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

process.on('SIGINT', async () => {
  await scraper.close();
  process.exit();
});

export default router;
