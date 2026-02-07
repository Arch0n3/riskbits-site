// Cloudflare Pages Function - Comments API
// Requires KV namespace binding: COMMENTS_KV

const PROFANITY_LIST = [
  'fuck', 'shit', 'ass', 'bitch', 'damn', 'crap', 'piss', 'dick', 'cock',
  'pussy', 'asshole', 'bastard', 'slut', 'whore', 'cunt', 'fag', 'nigger',
  'retard', 'idiot', 'stupid', 'dumb', 'moron', 'loser', 'sucker',
  // Romanian profanity
  'pula', 'pizda', 'muie', 'futut', 'cacat', 'cur', 'bulangiu', 'curva',
  'tarfa', 'fraier', 'prost', 'idiot', 'cretin', 'handicapat', 'labagiu'
];

function containsProfanity(text) {
  const lowerText = text.toLowerCase();
  return PROFANITY_LIST.some(word => {
    const regex = new RegExp(`\\b${word}\\b|${word.split('').join('[^a-z]*')}`, 'i');
    return regex.test(lowerText);
  });
}

function sanitizeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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
    const comments = await env.COMMENTS_KV.get(`comments:${postSlug}`, 'json') || [];
    return new Response(JSON.stringify({ comments }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ comments: [] }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    const { post, name, comment } = body;
    
    // Validation
    if (!post || !name || !comment) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Length limits
    if (name.length > 50) {
      return new Response(JSON.stringify({ error: 'Name too long (max 50 chars)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (comment.length > 1000) {
      return new Response(JSON.stringify({ error: 'Comment too long (max 1000 chars)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Profanity check
    if (containsProfanity(name) || containsProfanity(comment)) {
      return new Response(JSON.stringify({ error: 'Comment contains inappropriate language' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get existing comments
    const comments = await env.COMMENTS_KV.get(`comments:${post}`, 'json') || [];
    
    // Add new comment
    const newComment = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      name: sanitizeHtml(name.trim()),
      comment: sanitizeHtml(comment.trim()),
      date: new Date().toISOString()
    };
    
    comments.push(newComment);
    
    // Save (keep last 100 comments per post)
    const trimmedComments = comments.slice(-100);
    await env.COMMENTS_KV.put(`comments:${post}`, JSON.stringify(trimmedComments));
    
    return new Response(JSON.stringify({ success: true, comment: newComment }), {
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
