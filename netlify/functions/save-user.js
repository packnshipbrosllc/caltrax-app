const { hashPassword } = require('../../src/utils/security');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { email, password, profile, plan, subscriptionData } = JSON.parse(event.body);

    // Hash the password
    const hashedPassword = hashPassword(password);

    // Create user data
    const userData = {
      email,
      password: hashedPassword,
      profile,
      plan,
      subscriptionData,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    // In a real app, you'd save this to a database
    // For now, we'll use a simple in-memory store (this won't persist between deployments)
    // But it will work for testing cross-device functionality
    
    // Store in a global variable (this is just for demo - in production use a real database)
    if (!global.userStore) {
      global.userStore = new Map();
    }
    
    global.userStore.set(email, userData);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ 
        success: true, 
        message: 'User saved successfully',
        user: userData
      })
    };
  } catch (error) {
    console.error('Error saving user:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to save user',
        details: error.message 
      })
    };
  }
};

