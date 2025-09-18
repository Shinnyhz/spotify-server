const express = require("express");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

// Aqui você vai armazenar tokens temporários
let userTokens = {};

// Rota para testar se o servidor está no ar
app.get("/", (req, res) => {
    res.send("Servidor do Spotify está rodando!");
});

// 🚪 Callback depois do login do Spotify
app.get("/auth/callback", async (req, res) => {
    const code = req.query.code;

    // Aqui você vai trocar pelo SEU client_id e client_secret do Spotify
    const clientId = "60ab076afd944916a7f485391181d278";
    const clientSecret = "22b5ad15dfa24baba7afc7696524b2c5";

    const tokenResponse = await axios.post("https://accounts.spotify.com/api/token", null, {
        params: {
            grant_type: "authorization_code",
            code: code,
            redirect_uri: "https://spotify-server-00k8.onrender.com/auth/callback",
            client_id: clientId,
            client_secret: clientSecret
        },
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    });

    const token = tokenResponse.data.access_token;

    // ⚠️ Aqui só para exemplo, depois você deve salvar pelo UserId do Roblox
    userTokens["12345"] = token; 

    res.send("Spotify conectado! Agora volte para o Roblox.");
});

// Rota que o Roblox acessa
app.get("/spotify/:userId", async (req, res) => {
    const userId = req.params.userId;
    const token = userTokens[userId];

    if (!token) return res.status(401).send("Usuário não conectado.");

    try {
        const spotifyResponse = await axios.get("https://api.spotify.com/v1/me/player/currently-playing", {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!spotifyResponse.data || !spotifyResponse.data.item) {
            return res.json({ track: "Nada tocando", artist: "", image: "", progress: 0, duration: 0 });
        }

        const item = spotifyResponse.data.item;

        res.json({
            track: item.name,
            artist: item.artists[0].name,
            image: item.album.images[0].url,
            progress: spotifyResponse.data.progress_ms,
            duration: item.duration_ms
        });
    } catch (err) {
        res.status(500).send("Erro ao consultar o Spotify");
    }
});

app.listen(PORT, () => {
    console.log("Servidor rodando na porta " + PORT);
});
