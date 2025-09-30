exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { image } = JSON.parse(event.body);
    
    if (!image) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'No image provided' })
      };
    }

    // In a real implementation, you would:
    // 1. Use a barcode detection library like ZXing or QuaggaJS
    // 2. Process the image to detect barcodes
    // 3. Look up the barcode in a food database (like Open Food Facts API)
    // 4. Return the product information

    // For now, we'll simulate barcode detection with some sample products
    const sampleProducts = [
      {
        barcode: '1234567890123',
        productInfo: {
          name: 'Organic Granola Bar',
          nutrition: {
            calories: 150,
            protein_g: 4,
            fat_g: 6,
            carbs_g: 22
          },
          score: 8
        }
      },
      {
        barcode: '9876543210987',
        productInfo: {
          name: 'Greek Yogurt (Plain)',
          nutrition: {
            calories: 100,
            protein_g: 17,
            fat_g: 0,
            carbs_g: 6
          },
          score: 9
        }
      },
      {
        barcode: '5555555555555',
        productInfo: {
          name: 'Mixed Nuts',
          nutrition: {
            calories: 180,
            protein_g: 6,
            fat_g: 16,
            carbs_g: 6
          },
          score: 7
        }
      }
    ];

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Return a random sample product for demo purposes
    const randomProduct = sampleProducts[Math.floor(Math.random() * sampleProducts.length)];

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        barcode: randomProduct.barcode,
        productInfo: randomProduct.productInfo
      })
    };

  } catch (error) {
    console.error('Barcode scanning error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to scan barcode',
        details: error.message 
      })
    };
  }
};
