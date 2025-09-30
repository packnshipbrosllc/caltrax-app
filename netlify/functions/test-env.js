exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      hasStripeKey: !!process.env.STRIPESECRETKEY,
      hasWebhookSecret: !!process.env.STRIPEWEBHOOKSECRET,
      hasPublishableKey: !!process.env.REACTAPPSTRIPEPUBLISHABLEKEY,
      stripeKeyLength: process.env.STRIPESECRETKEY ? process.env.STRIPESECRETKEY.length : 0
    })
  };
};




