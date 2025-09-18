// server.js
const express = require("express");
const request = require("request");
const cors = require("cors");

const app = express();
app.use(cors());

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI || "https://spotify-server-00k8.onrender.com/auth/callback";

// Armazena tokens por Roblox UserId
let userTokens = {};

// Rota raiz para teste
app.get("/", (req, res) => {
    res.send("Servidor Spotify rodando ✅");
});

// Rota de login (Redireciona para Spotify)
app.get("/login/:userid", (req, res) => {
    const scope = "user-read-currently-playing";
    const state = req.params.userid;

    const authUrl = "https://accounts.spotify.com/authorize?" +
        new URLSearchParams({
            response_type: "code",
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        }).toString();

    res.redirect(authUrl);
});

// Callback do Spotify
app.get("/auth/callback", (req, res) => {
    const code = req.query.code || null;
    const state = req.query.state || null;

    if (!code || !state) {
        return res.send("Erro: nenhum code ou state recebido.");
    }

    // Troca code por access_token
    const authOptions = {
        url: "https://accounts.spotify.com/api/token",
        form: {
            code: code,
            redirect_uri: redirect_uri,
            grant_type: "authorization_code"
        },
        headers: {
            "Authorization": "Basic " + Buffer.from(client_id + ":" + client_secret).toString("base64")
        },
        json: true
    };

    request.post(authOptions, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            // Salva tokens na memória com Roblox UserId
            userTokens[state] = body;
            res.send("Spotify conectado! Agora volte para o Roblox.");
        } else {
            console.error(body);
            res.send("Erro ao autenticar com Spotify.");
        }
    });
});

// Rota para retornar música atual
app.get("/currently-playing/:userid", (req, res) => {
    const userid = req.params.userid;
    const tokens = userTokens[userid];

    if (!tokens) {
        return res.json({ error: "Usuário não autenticado." });
    }

    const options = {
        url: "https://api.spotify.com/v1/me/player/currently-playing",
        headers: { "Authorization": "Bearer " + tokens.access_token },
        json: true
    };

    request.get(options, (error, response, body) => {
        if (!error && response.statusCode === 200 && body && body.item) {
            res.json({
                song: body.item.name,
                artist: body.item.artists.map(a => a.name).join(", "),
                image: body.item.album.images[0].url
            });
        } else {
            res.json({ song: "Nenhuma música tocando" });
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Servidor rodando na porta " + PORT);
});