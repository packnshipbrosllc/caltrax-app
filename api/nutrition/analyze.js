// OpenAI Vision API for nutrition analysis
// This runs on Vercel serverless - keeps your API key secure

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image, userId } = req.body;

  // Validate inputs
  if (!image) {
    return res.status(400).json({ error: 'Image is required' });
  }

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  // Basic rate limiting (improve with Redis/Upstash in production)
  const rateLimitKey = `nutrition_${userId}`;
  // TODO: Implement proper rate limiting with Upstash Redis

  try {
    console.log('Analyzing nutrition for user:', userId);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a nutrition expert. Analyze food images and return accurate nutrition data in strict JSON format.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this food image and provide nutrition information in this exact JSON format:
{
  "name": "Food name",
  "nutrition": {
    "calories": number,
    "protein_g": number,
    "fat_g": number,
    "carbs_g": number
  },
  "pros": ["health benefit 1", "health benefit 2"],
  "cons": ["concern 1", "concern 2"],
  "health_score": number (1-10),
  "confidence": number (0-1)
}

Return ONLY the JSON object, no other text.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: image,
                  detail: 'low' // Use 'low' to save costs, 'high' for better accuracy
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.3 // Lower temperature for more consistent results
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return res.status(response.status).json({ 
        error: 'OpenAI API error',
        details: errorData.error?.message 
      });
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    console.log('OpenAI response:', content);

    // Extract JSON from response
    let result;
    try {
      // Try to parse as JSON directly
      result = JSON.parse(content);
    } catch (parseError) {
      // If that fails, try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        result = JSON.parse(jsonStr);
      } else {
        console.error('Failed to parse JSON from OpenAI response:', content);
        return res.status(500).json({ 
          error: 'Failed to parse nutrition data',
          rawResponse: content 
        });
      }
    }

    // Validate result structure
    if (!result.name || !result.nutrition) {
      return res.status(500).json({ 
        error: 'Invalid nutrition data structure',
        result 
      });
    }

    // Ensure all nutrition values are numbers
    result.nutrition = {
      calories: Number(result.nutrition.calories) || 0,
      protein_g: Number(result.nutrition.protein_g) || 0,
      fat_g: Number(result.nutrition.fat_g) || 0,
      carbs_g: Number(result.nutrition.carbs_g) || 0
    };

    console.log('Successfully analyzed nutrition:', result.name);

    return res.status(200).json(result);

  } catch (error) {
    console.error('Nutrition analysis error:', error);
    return res.status(500).json({ 
      error: 'Analysis failed',
      message: error.message 
    });
  }
}
