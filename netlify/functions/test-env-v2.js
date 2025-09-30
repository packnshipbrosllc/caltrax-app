// Test function to check environment variables
exports.handler = async (event, context) => {
  // Check all possible ways to access environment variables
  const envCheck = {
    processEnv: {
      STRIPESECRETKEY: !!process.env.STRIPESECRETKEY,
      STRIPEWEBHOOKSECRET: !!process.env.STRIPEWEBHOOKSECRET,
      REACTAPPSTRIPEPUBLISHABLEKEY: !!process.env.REACTAPPSTRIPEPUBLISHABLEKEY
    },
    contextEnv: {
      STRIPESECRETKEY: !!context.clientContext?.env?.STRIPESECRETKEY,
      STRIPEWEBHOOKSECRET: !!context.clientContext?.env?.STRIPEWEBHOOKSECRET,
      REACTAPPSTRIPEPUBLISHABLEKEY: !!context.clientContext?.env?.REACTAPPSTRIPEPUBLISHABLEKEY
    },
    allEnvKeys: Object.keys(process.env).filter(key => 
      key.includes('STRIPE') || key.includes('REACT') || key.includes('NETLIFY')
    ),
    netlifyContext: context.clientContext
  };

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(envCheck)
  };
};


