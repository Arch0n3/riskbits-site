// Comments & Likes System
(function() {
  const postSlug = window.POST_SLUG;
  if (!postSlug) return;
  
  const API_BASE = '/api';
  
  // --- Likes ---
  async function loadLikes() {
    try {
      const res = await fetch(`${API_BASE}/likes?post=${postSlug}`);
      const data = await res.json();
      document.getElementById('like-count').textContent = data.likes || 0;
    } catch (e) {
      console.error('Failed to load likes:', e);
    }
  }
  
  async function addLike() {
    const btn = document.getElementById('like-btn');
    const countEl = document.getElementById('like-count');
    
    // Check if already liked (localStorage)
    if (localStorage.getItem(`liked:${postSlug}`)) {
      btn.classList.add('shake');
      setTimeout(() => btn.classList.remove('shake'), 500);
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE}/likes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post: postSlug })
      });
      const data = await res.json();
      
      if (data.success) {
        countEl.textContent = data.likes;
        localStorage.setItem(`liked:${postSlug}`, '1');
        btn.classList.add('liked');
        btn.querySelector('.heart').textContent = '❤️';
      }
    } catch (e) {
      console.error('Failed to add like:', e);
    }
  }
  
  // --- Comments ---
  async function loadComments() {
    const container = document.getElementById('comments-list');
    const countEl = document.getElementById('comments-count');
    
    try {
      const res = await fetch(`${API_BASE}/comments?post=${postSlug}`);
      const data = await res.json();
      const comments = data.comments || [];
      
      countEl.textContent = comments.length;
      
      if (comments.length === 0) {
        container.innerHTML = '<p class="no-comments">No comments yet. Be the first!</p>';
        return;
      }
      
      container.innerHTML = comments.map(c => `
        <div class="comment">
          <div class="comment-header">
            <span class="comment-author">${c.name}</span>
            <span class="comment-date">${formatDate(c.date)}</span>
          </div>
          <p class="comment-text">${c.comment}</p>
        </div>
      `).join('');
    } catch (e) {
      container.innerHTML = '<p class="no-comments">Could not load comments.</p>';
    }
  }
  
  async function submitComment(e) {
    e.preventDefault();
    
    const form = e.target;
    const nameInput = form.querySelector('#comment-name');
    const textInput = form.querySelector('#comment-text');
    const submitBtn = form.querySelector('button[type="submit"]');
    const errorEl = document.getElementById('comment-error');
    
    const name = nameInput.value.trim();
    const comment = textInput.value.trim();
    
    if (!name || !comment) {
      showError('Please fill in both fields.');
      return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Posting...';
    errorEl.style.display = 'none';
    
    try {
      const res = await fetch(`${API_BASE}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post: postSlug, name, comment })
      });
      const data = await res.json();
      
      if (data.error) {
        showError(data.error);
      } else {
        nameInput.value = '';
        textInput.value = '';
        loadComments();
      }
    } catch (e) {
      showError('Failed to post comment. Try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Post Comment';
    }
  }
  
  function showError(msg) {
    const errorEl = document.getElementById('comment-error');
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
  }
  
  function formatDate(isoDate) {
    const d = new Date(isoDate);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  
  // --- Init ---
  document.addEventListener('DOMContentLoaded', function() {
    loadLikes();
    loadComments();
    
    // Check if already liked
    if (localStorage.getItem(`liked:${postSlug}`)) {
      const btn = document.getElementById('like-btn');
      if (btn) {
        btn.classList.add('liked');
        btn.querySelector('.heart').textContent = '❤️';
      }
    }
    
    // Event listeners
    document.getElementById('like-btn')?.addEventListener('click', addLike);
    document.getElementById('comment-form')?.addEventListener('submit', submitComment);
  });
})();
