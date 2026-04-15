const express = require('express');
const twilio = require('twilio');
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const conversations = {};
app.get('/', (req, res) => { res.send('Claude WhatsApp Bot corriendo! v2'); });
app.post('/webhook', async (req, res) => {
        const incomingMsg = req.body.Body;
        const from = req.body.From;
        console.log('Mensaje recibido de ' + from + ': ' + incomingMsg);
        if (!incomingMsg || !from) { return res.status(400).send('Bad request'); }
        if (!conversations[from]) conversations[from] = [];
        conversations[from].push({ role: 'user', content: incomingMsg });
        if (conversations[from].length > 10) conversations[from] = conversations[from].slice(-10);
        try {
                  const response = await fetch('https://api.anthropic.com/v1/messages', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
                              body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, system: 'Eres Claude, asistente personal de Bryan en Medellin Colombia. Responde en espanol colombiano, directo y conciso. Maximo 3 parrafos por respuesta.', messages: conversations[from] })
                  });
                  const data = await response.json();
                  console.log('Respuesta Anthropic status:', response.status);
                  if (data.error) { console.error('Anthropic error:', JSON.stringify(data.error)); throw new Error(data.error.message); }
                  if (!data.content || !data.content[0]) { console.error('Respuesta inesperada:', JSON.stringify(data)); throw new Error('Respuesta invalida de Claude'); }
                  const repl
