// File: app/api/search/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const serpapiKey = process.env.SERPAPI_KEY;

  // 1. Get parameters from the URL
  const keyword = searchParams.get('keyword');
  const maxPriceStr = searchParams.get('max_price');
  const minPriceStr = searchParams.get('min_price') || '0';
  const minRatingStr = searchParams.get('min_rating') || '0';

  // --- Input Validation ---
  if (!keyword || !maxPriceStr || !serpapiKey) {
    return NextResponse.json(
      { error: "Missing 'keyword', 'max_price', or API key is not set." },
      { status: 400 }
    );
  }

  const maxPrice = parseFloat(maxPriceStr);
  const minPrice = parseFloat(minPriceStr);
  const minRating = parseFloat(minRatingStr);

  // 2. Set up parameters for the SerpApi call
  const apiParams = new URLSearchParams({
    api_key: serpapiKey,
    engine: 'google_shopping',
    q: keyword,
    hl: 'en',
    gl: 'in',
  });

  const apiUrl = `https://serpapi.com/search.json?${apiParams.toString()}`;

  try {
    // 3. Call the SerpApi service using fetch
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    const data = await response.json();

    // 4. Process the results into a clean list
    const cleanResults = data.shopping_results
      .map((item: any) => {
        const price = parseFloat(item.extracted_price) || 0;
        const rating = parseFloat(item.rating) || 0;

        // --- Filtering Logic ---
        if (price === 0 || !(price >= minPrice && price <= maxPrice) || rating < minRating) {
          return null; // This item will be filtered out
        }

        return {
          name: item.title,
          source: item.source,
          price: price,
          rating: rating,
          link: item.product_link,
          thumbnail: item.thumbnail,
          value_score: price > 0 ? rating / price : 0,
        };
      })
      .filter(Boolean); // Remove any null items

    // 5. Sort the final list by the best value score
    cleanResults.sort((a: any, b: any) => b.value_score - a.value_score);

    // 6. Return the final, clean JSON
    return NextResponse.json(cleanResults);

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
