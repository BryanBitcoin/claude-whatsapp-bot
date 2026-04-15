const express = require('express');
const twilio = require('twilio');
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const conversations = {};
app.get('/', (req, res) => { res.send('Claude WhatsApp Bot corriendo!'); });
app.post('/webhook', async (req, res) => {
      const incomingMsg = req.body.Body;
      const from = req.body.From;
      if (!conversations[from]) conversations[from] = [];
      conversations[from].push({ role: 'user', content: incomingMsg });
      if (conversations[from].length > 10) conversations[from] = conversations[from].slice(-10);
      try {
              const response = await fetch('https://api.anthropic.com/v1/messages', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
                        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, system: 'Eres Claude, asistente personal de Bryan en Medellin Colombia. Responde en espanol colombiano, directo y conciso.', messages: conversations[from] })
              });
              const data = await response.json();
              const reply = data.content[0].text;
              conversations[from].push({ role: 'assistant', content: reply });
              const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
              await client.messages.create({ from: 'whatsapp:+14155238886', to: from, body: reply });
              res.status(200).send('OK');
      } catch (error) {
              console.error('Error:', error);
              res.status(500).send('Error');
      }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server en puerto ' + PORT));
