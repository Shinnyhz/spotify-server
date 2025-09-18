const express = require("express");
const fetch = require("node-fetch"); // npm install node-fetch@2
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const clientId = "60ab076afd944916a7f485391181d278"; // seu Client ID
const clientSecret = "22b5ad15dfa24baba7afc7696524b2c5"; // seu Client Secret
const redirectUri = "https://spotify-server-00k8.onrender.com/auth/callback";

// Armazenamento simples de tokens por jogador (apenas para teste)
const tokens = {};

// Rota inicial
app.get("/", (req, res) => {
    res.send("Servidor do Spotify está rodando!");
});

// Callback do Spotify
app.get("/auth/callback", async (req, res) => {
    const code = req.query.code;
    const playerId = req.query.playerId; // você envia o UserId do Roblox no link

    if (!code || !playerId) return res.send("Faltando code ou playerId");

    // Troca code por access token
    const body = new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
    });

    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Authorization": "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
    });

    const data = await response.json();
    if (data.error) return res.send(`Erro: ${data.error}`);

    tokens[playerId] = data.access_token;
    res.send("Autorização concluída! Pode voltar ao jogo.");
});

// Rota para Roblox consultar música
app.get("/currently-playing/:playerId", async (req, res) => {
    const playerId = req.params.playerId;
    const token = tokens[playerId];
    if (!token) return res.json({ error: "Jogador não logado" });

    const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 204) return res.json({ error: "Nenhuma música tocando" });

    const data = await response.json();
    if (!data.item) return res.json({ error: "Nenhuma música tocando" });

    res.json({
        song: data.item.name,
        artist: data.item.artists.map(a => a.name).join(", "),
        album: data.item.album.name,
        image: data.item.album.images[0].url,
        progress_ms: data.progress_ms,
        duration_ms: data.item.duration_ms,
    });
});

// Inicia servidor
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servidor do Spotify rodando na porta ${port}`);
});
