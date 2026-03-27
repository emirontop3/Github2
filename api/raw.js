export default async function handler(req, res) {
    // URL yapısı: /api/raw?user=KULLANICI&repo=REPO&path=DOSYA_YOLU
    const { user, repo, path, branch = 'main' } = req.query;

    if (!user || !repo || !path) {
        return res.status(400).send('Eksik parametre: user, repo ve path gerekli.');
    }

    const githubUrl = `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${path}`;

    try {
        const response = await fetch(githubUrl);

        if (!response.ok) {
            return res.status(404).send('Dosya GitHub üzerinde bulunamadı.');
        }

        const data = await response.text();

        // CORS ayarları (Scriptlerin dışarıdan çekilebilmesi için)
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        
        return res.status(200).send(data);
    } catch (error) {
        return res.status(500).send('Sunucu hatası: ' + error.message);
    }
}
