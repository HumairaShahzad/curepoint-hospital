const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

const PORT = 3000;
const API_KEY = process.env.CHATTERMATE_API_KEY;

const SYSTEM_PROMPT = `You are a hospital report assistant. Answer only from the report data given. Never invent numbers. If the data doesn't have the answer, say so. Money is in Taka (Tk). Keep answers short. You cannot change any data; refuse requests to edit or delete.`;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg'
};

// Helper: Make HTTP/HTTPS request as Promise
function makeRequest(url, options, postData) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body }));
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  // Route: POST /ask (AI Chat Proxy)
  if (req.method === 'POST' && req.url === '/ask') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        if (!API_KEY) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ answer: "Error: CHATTERMATE_API_KEY is missing in .env file." }));
        }

        const { question, data } = JSON.parse(body);

        // 1. Get default model ID
        const modelRes = await makeRequest('https://chattermate.ai/api/chat/models', {
          method: 'GET',
          headers: { 'X-API-Key': API_KEY }
        });

        if (modelRes.statusCode !== 200) {
          res.writeHead(modelRes.statusCode, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ answer: `API Error ${modelRes.statusCode}: Please check your ChatterMate API Key.` }));
        }

        const modelsData = JSON.parse(modelRes.body);
        const defaultModelId = modelsData.default_model_id || (modelsData.models && modelsData.models[0]?.id);

        // 2. Call Stream API
        const payload = JSON.stringify({
          models: [defaultModelId],
          system_prompt: SYSTEM_PROMPT,
          prompt: `Report data: ${JSON.stringify(data)}\nQuestion: ${question}`
        });

        const streamRes = await makeRequest('https://chattermate.ai/api/chat/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY,
            'Content-Length': Buffer.byteLength(payload)
          }
        }, payload);

        // 3. Parse Server-Sent Events (SSE)
        const lines = streamRes.body.split('\n');
        let fullAnswer = '';
        let isModelChunk = false;

        for (const line of lines) {
          if (line.startsWith('event: model_chunk')) {
            isModelChunk = true;
          } else if (line.startsWith('data:') && isModelChunk) {
            try {
              const jsonStr = line.replace(/^data:\s*/, '').trim();
              if (jsonStr) {
                const parsed = JSON.parse(jsonStr);
                if (parsed.content) fullAnswer += parsed.content;
              }
            } catch (e) { /* ignore parse chunk edge cases */ }
            isModelChunk = false;
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ answer: fullAnswer || "No response received from model." }));

      } catch (err) {
        console.error("Ask endpoint error:", err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ answer: "An internal server error occurred while processing your request." }));
      }
    });
    return;
  }

  // Serve Static Frontend Files
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`================================================`);
  console.log(` Hospital System running at http://localhost:${PORT}`);
  console.log(` API Key Status: ${API_KEY ? 'Loaded ✓' : 'MISSING ✗'}`);
  console.log(`================================================`);
});