// Cloudflare Pages Function - Likes API
// Requires KV namespace binding: COMMENTS_KV

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const postSlug = url.searchParams.get('post');
  
  if (!postSlug) {
    return new Response(JSON.stringify({ error: 'Missing post parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const likes = await env.COMMENTS_KV.get(`likes:${postSlug}`) || '0';
    return new Response(JSON.stringify({ likes: parseInt(likes, 10) }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ likes: 0 }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    const { post } = body;
    
    if (!post) {
      return new Response(JSON.stringify({ error: 'Missing post parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get current likes
    const currentLikes = parseInt(await env.COMMENTS_KV.get(`likes:${post}`) || '0', 10);
    const newLikes = currentLikes + 1;
    
    // Save
    await env.COMMENTS_KV.put(`likes:${post}`, newLikes.toString());
    
    return new Response(JSON.stringify({ success: true, likes: newLikes }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
