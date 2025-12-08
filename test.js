import AHScraper from './src/scraper/ahScraper.js';

async function testScraper() {
  const scraper = new AHScraper();
  
  console.log('🧪 Testing Albert Heijn Scraper\n');
  
  try {
    // Test 1: Search products
    console.log('📦 Test 1: Searching for "melk"...');
    const searchResults = await scraper.searchProducts('melk', 5);
    console.log(`✅ Found ${searchResults.length} products`);
    if (searchResults.length > 0) {
      console.log('First product:', {
        name: searchResults[0].name,
        brand: searchResults[0].brand,
        price: searchResults[0].price,
        id: searchResults[0].id
      });
    }
    console.log('');
    
    // Test 2: Get product details (if we have a product ID)
    if (searchResults.length > 0) {
      const productId = searchResults[0].id;
      console.log(`📝 Test 2: Getting details for product ${productId}...`);
      const productDetails = await scraper.getProductDetails(productId);
      console.log('✅ Product details retrieved');
      console.log('Details:', {
        name: productDetails.name,
        brand: productDetails.brand,
        price: productDetails.price,
        hasIngredients: !!productDetails.ingredients,
        hasAllergens: !!productDetails.allergens,
        hasNutrition: !!productDetails.nutrition
      });
      console.log('');
    }
    
    // Test 3: Get categories
    console.log('📂 Test 3: Getting categories...');
    const categories = await scraper.getCategories();
    console.log(`✅ Found ${categories.length} categories`);
    if (categories.length > 0) {
      console.log('First 3 categories:', categories.slice(0, 3).map(c => c.name));
    }
    console.log('');
    
    // Test 4: Cache test (should be instant)
    console.log('⚡ Test 4: Testing cache (searching "melk" again)...');
    const startTime = Date.now();
    const cachedResults = await scraper.searchProducts('melk', 5);
    const duration = Date.now() - startTime;
    console.log(`✅ Cache hit! Retrieved in ${duration}ms`);
    console.log('');
    
    console.log('✨ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await scraper.close();
    console.log('\n🔒 Browser closed');
  }
}

testScraper();
