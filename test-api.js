// Simple API test script
const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing Albert Heijn Scraper API\n');
  
  try {
    // Test 1: Root endpoint
    console.log('📋 Test 1: Getting API info...');
    const rootResponse = await fetch(BASE_URL);
    const rootData = await rootResponse.json();
    console.log('✅ API Info:', rootData.name);
    console.log('Available endpoints:', Object.keys(rootData.endpoints));
    console.log('');
    
    // Test 2: Search products
    console.log('🔍 Test 2: Searching for "melk"...');
    const searchResponse = await fetch(`${BASE_URL}/api/products/search?q=melk&limit=5`);
    const searchData = await searchResponse.json();
    
    if (searchData.success) {
      console.log(`✅ Found ${searchData.count} products`);
      if (searchData.data.length > 0) {
        console.log('First product:', {
          name: searchData.data[0].name,
          price: searchData.data[0].price,
          id: searchData.data[0].id
        });
      }
    } else {
      console.log('❌ Search failed:', searchData.error);
    }
    console.log('');
    
    // Test 3: Get product details (if we have a product)
    if (searchData.success && searchData.data.length > 0) {
      const productId = searchData.data[0].id;
      console.log(`📝 Test 3: Getting details for product ${productId}...`);
      const detailsResponse = await fetch(`${BASE_URL}/api/products/${productId}`);
      const detailsData = await detailsResponse.json();
      
      if (detailsData.success) {
        console.log('✅ Product details retrieved');
        console.log('Product:', {
          name: detailsData.data.name,
          brand: detailsData.data.brand,
          price: detailsData.data.price,
          hasIngredients: !!detailsData.data.ingredients
        });
      } else {
        console.log('❌ Details failed:', detailsData.error);
      }
      console.log('');
    }
    
    // Test 4: Get categories
    console.log('📂 Test 4: Getting categories...');
    const categoriesResponse = await fetch(`${BASE_URL}/api/products/categories/list`);
    const categoriesData = await categoriesResponse.json();
    
    if (categoriesData.success) {
      console.log(`✅ Found ${categoriesData.count} categories`);
      if (categoriesData.data.length > 0) {
        console.log('First 3 categories:', categoriesData.data.slice(0, 3).map(c => c.name));
      }
    } else {
      console.log('❌ Categories failed:', categoriesData.error);
    }
    console.log('');
    
    console.log('✨ All API tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPI();
