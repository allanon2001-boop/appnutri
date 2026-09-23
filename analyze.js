export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { imageBase64 } = req.body || {};

  if (!imageBase64) {
    return res.status(400).json({ error: 'Immagine mancante nella richiesta' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Chiave GEMINI_API_KEY non configurata sul server Vercel' });
  }

  const promptText = `Analizza questo piatto e rispondi ESCLUSIVAMENTE con un JSON valido con questa struttura:
{
  "advice": "breve commento nutrizionale sul piatto",
  "confidence": "Alta",
  "items": [
    { "name": "nome cibo", "grams": 100, "kcal": 150, "protein": 10, "carbs": 20, "fat": 5 }
  ]
}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: promptText },
            { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } }
          ]
        }]
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    let text = data.candidates[0].content.parts[0].text;
    text = text.replace(/```json/gi, '').replace(/```/gi, '').trim();

    const parsedJson = JSON.parse(text);
    return res.status(200).json(parsedJson);

  } catch (error) {
    console.error("Errore API Gemini:", error);
    return res.status(500).json({ error: 'Errore durante l\'analisi dell\'immagine tramite AI' });
  }
}
