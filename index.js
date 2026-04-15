const express = require('express');
const twilio = require('twilio');
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const conversations = {};
app.get('/', (req, res) => res.send('Claude Bot v3'));
app.post('/webhook', async (req, res) => {
  const msg = req.body.Body;
  const from = req.body.From;
  if (!msg || !from) return res.status(400).send('Bad');
  console.log('De:', from, '-> Msg:', msg);
  if (!conversations[from]) conversations[from] = [];
  conversations[from].push({ role: 'user', content: msg });
  if (conversations[from].length > 10) conversations[from] = conversations[from].slice(-10);
  try {
    const ar = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 800, system: 'Eres Claude, asistente de Bryan en Medellin. Responde en espanol, conciso, max 2 parrafos.', messages: conversations[from] })
    });
    const data = await ar.json();
    if (data.error) throw new Error(data.error.message);
    const reply = data.content[0].text;
    conversations[from].push({ role: 'assistant', content: reply });
    const tw = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await tw.messages.create({ from: 'whatsapp:+14155238886', to: from, body: reply });
    console.log('OK enviado');
    res.status(200).send('OK');
  } catch(e) {
    console.error('ERR:', e.message);
    res.status(500).send('Error');
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Bot v3 en puerto ' + PORT));