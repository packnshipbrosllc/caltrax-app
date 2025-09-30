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
    const { email, password } = JSON.parse(event.body);

    // Check if user exists in our store
    if (!global.userStore) {
      global.userStore = new Map();
    }

    const userData = global.userStore.get(email);

    if (!userData) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'No account found with this email address' 
        })
      };
    }

    // Verify password
    const hashedInputPassword = hashPassword(password);
    if (hashedInputPassword !== userData.password) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Invalid password' 
        })
      };
    }

    // Update last login
    userData.lastLogin = new Date().toISOString();
    global.userStore.set(email, userData);

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = userData;

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
        user: userWithoutPassword
      })
    };
  } catch (error) {
    console.error('Error getting user:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to get user',
        details: error.message 
      })
    };
  }
};

