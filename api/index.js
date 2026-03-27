import { createClient } from 'redis';

export default async function handler(req, res) {
    // Redis Bağlantısını Kur
    const client = createClient({
        url: process.env.REDIS_URL
    });

    client.on('error', err => console.log('Redis Error', err));
    await client.connect();

    const { id, raw } = req.query;

    // 1. RAW GETİR (Örn: site.com/api?id=abc&raw=true)
    if (id && raw === 'true') {
        const script = await client.get(`sc:${id}`);
        await client.disconnect();

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*'); // Her yerden çekilebilsin
        return res.status(200).send(script || "-- Script bulunamadı!");
    }

    // 2. SCRIPT KAYDET (POST)
    if (req.method === 'POST') {
        const { content } = req.body;
        if (!content) return res.status(400).json({ error: "İçerik boş olamaz" });

        const newId = Math.random().toString(36).substring(7); // Rastgele ID
        await client.set(`sc:${newId}`, content);
        await client.disconnect();

        return res.status(200).json({ id: newId });
    }

    // 3. BASİT DASHBOARD (Yükleme Paneli)
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`
        <body style="background:#0a0a0a; color:#00ff00; font-family:monospace; padding:50px;">
            <h2 style="color:white;">Vercel Script Raw v2</h2>
            <textarea id="c" style="width:100%; height:300px; background:#111; color:#0f0; border:1px solid #333; padding:15px; border-radius:8px;" placeholder="Scriptini buraya yapıştır..."></textarea><br><br>
            <button onclick="save()" style="padding:12px 25px; cursor:pointer; background:#222; color:white; border:1px solid #444; border-radius:5px;">Vercel + Redis'e Gönder</button>
            <div id="res" style="margin-top:25px; padding:15px; border:1px dashed #444; display:none;"></div>

            <script>
                async function save() {
                    const content = document.getElementById('c').value;
                    const btn = document.querySelector('button');
                    btn.innerText = "Yükleniyor...";
                    
                    const r = await fetch(window.location.pathname, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ content })
                    });
                    
                    const d = await r.json();
                    const rawUrl = window.location.origin + window.location.pathname + '?id=' + d.id + '&raw=true';
                    
                    const resDiv = document.getElementById('res');
                    resDiv.style.display = 'block';
                    resDiv.innerHTML = '<strong>Raw Link:</strong> <br><input type="text" readonly value="'+rawUrl+'" style="width:100%; background:transparent; border:none; color:cyan; font-size:16px; margin-top:10px;">';
                    btn.innerText = "Yükle";
                }
            </script>
        </body>
    `);
}
