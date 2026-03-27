import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    const { id, action, content, name } = req.body || req.query;

    // 1. Scripti Kaydet (POST)
    if (req.method === 'POST') {
        const scriptId = Math.random().toString(36).substring(2, 10);
        await kv.set(`script:${scriptId}`, content);
        return res.status(200).json({ id: scriptId, url: `/api/script?id=${scriptId}&raw=true` });
    }

    // 2. Scripti Getir (GET)
    if (req.method === 'GET' && id) {
        const script = await kv.get(`script:${id}`);
        if (!script) return res.status(404).send("Script bulunamadı.");

        // Eğer raw=true ise sadece kodu döndür (Roblox veya Python için)
        if (req.query.raw === 'true') {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.status(200).send(script);
        }
        return res.status(200).json({ content: script });
    }

    // 3. Scripti Sil (DELETE)
    if (req.method === 'DELETE') {
        await kv.del(`script:${id}`);
        return res.status(200).json({ message: "Silindi" });
    }
}
