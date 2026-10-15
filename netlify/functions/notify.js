// Netlify function: browser se aaya data Telegram bot ko forward karta hai.
// Token/Chat ID code mein nahi, Netlify ke Environment variables mein rakhe jaate hain.
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return { statusCode: 500, body: 'Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID' };

  let p;
  try { p = JSON.parse(event.body || '{}'); } catch (e) { return { statusCode: 400, body: 'Bad JSON' }; }

  const api = 'https://api.telegram.org/bot' + token + '/';
  try {
    let r;
    if (p.type === 'photo') {
      const m = /^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/.exec(p.image || '');
      if (!m) return { statusCode: 400, body: 'Bad image' };
      const buf = Buffer.from(m[2], 'base64');
      const fd = new FormData();
      fd.append('chat_id', chat);
      fd.append('caption', String(p.caption || '').slice(0, 1000));
      fd.append('photo', new Blob([buf], { type: m[1] }), 'photo.jpg');
      r = await fetch(api + 'sendPhoto', { method: 'POST', body: fd });
    } else {
      r = await fetch(api + 'sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chat, text: String(p.text || '').slice(0, 4000) })
      });
    }
    return { statusCode: r.ok ? 200 : 502, body: r.ok ? 'ok' : 'telegram error' };
  } catch (e) {
    return { statusCode: 500, body: 'error' };
  }
};
