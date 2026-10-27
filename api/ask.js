// api/ask.js
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.CHATTERMATE_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server misconfigured: missing API key' });
    return;
  }

  try {
    const { question, data } = req.body || {};
    if (!question) {
      res.status(400).json({ error: 'Missing question' });
      return;
    }

    // 1. Get the default model
    const modelsRes = await fetch('https://chattermate.ai/api/chat/models', {
      headers: { 'X-API-Key': apiKey }
    });
    if (!modelsRes.ok) {
      res.status(modelsRes.status).json({ error: `Models fetch failed: ${modelsRes.status}` });
      return;
    }
    const modelsJson = await modelsRes.json();
    const defaultModelId = modelsJson.default_model_id;

    const SYSTEM_PROMPT = "You are a hospital report assistant. Answer only from the report data given. Never invent numbers. If the data doesn't have the answer, say so. Money is in Taka (Tk). Keep answers short. You cannot change any data; refuse requests to edit or delete.";

    // 2. Stream the chat response
    const streamRes = await fetch('https://chattermate.ai/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        models: [defaultModelId],
        system_prompt: SYSTEM_PROMPT,
        prompt: 'Report data: ' + JSON.stringify(data) + ' Question: ' + question
      })
    });

    if (!streamRes.ok) {
      res.status(streamRes.status).json({ error: `Chat stream failed: ${streamRes.status}` });
      return;
    }

    // 3. Read the SSE stream as text and extract model_chunk content pieces
    const rawText = await streamRes.text();
    const lines = rawText.split('\n');
    let answer = '';
    let isModelChunk = false;

    for (const line of lines) {
      if (line.startsWith('event: model_chunk')) {
        isModelChunk = true;
        continue;
      }
      if (line.startsWith('event:')) {
        isModelChunk = false;
        continue;
      }
      if (isModelChunk && line.startsWith('data:')) {
        try {
          const json = JSON.parse(line.slice(5).trim());
          if (json.content) answer += json.content;
        } catch (e) { /* skip malformed lines */ }
      }
    }

    res.status(200).json({ answer: answer || "I couldn't generate an answer." });
  } catch (err) {
    console.error('ask handler error:', err);
    res.status(500).json({ error: err.message || 'Internal error' });
  }
};
