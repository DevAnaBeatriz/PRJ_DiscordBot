"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const voice_1 = require("@discordjs/voice");
const ytdl_core_1 = __importDefault(require("@distube/ytdl-core"));
const yt_search_1 = __importDefault(require("yt-search"));
const ytpl_1 = __importDefault(require("ytpl"));
const dotenv = __importStar(require("dotenv"));
const isomorphic_unfetch_1 = __importDefault(require("isomorphic-unfetch"));
dotenv.config();
const { getData } = require('spotify-url-info')(isomorphic_unfetch_1.default);
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildVoiceStates,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
    ],
});
const PREFIX = "ap!";
const queue = [];
let player;
let connection;
let resource;
client.once("ready", () => {
    var _a;
    console.log(`💖 Bot está online como ${(_a = client.user) === null || _a === void 0 ? void 0 : _a.tag}`);
});
client.on("messageCreate", (message) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (!message.content.startsWith(PREFIX) || message.author.bot)
        return;
    const args = message.content.slice(PREFIX.length).split(" ");
    const command = (_a = args.shift()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    if (command === "play") {
        const voiceChannel = (_b = message.member) === null || _b === void 0 ? void 0 : _b.voice.channel;
        if (!voiceChannel) {
            return message.channel.send("Eii! Você precisa estar em um canal de voz para tocar música! >:(");
        }
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!(permissions === null || permissions === void 0 ? void 0 : permissions.has("Connect")) || !(permissions === null || permissions === void 0 ? void 0 : permissions.has("Speak"))) {
            return message.channel.send("Aaaah, eu não tenho permissão para entrar e falar nesse canal! :(");
        }
        if (!args.length) {
            return message.channel.send("Opss! Você precisa fornecer um nome ou link do YouTube ou do Spotify!");
        }
        const query = args.join(" ");
        let songs = [];
        if (query.includes("spotify.com")) {
            try {
                const spotifyData = yield getData(query);
                if (spotifyData.type === "track") {
                    const songTitle = `${spotifyData.artists[0].name} - ${spotifyData.name}`;
                    const searchResult = yield (0, yt_search_1.default)(songTitle);
                    if (searchResult.videos.length > 0) {
                        songs.push({ url: searchResult.videos[0].url, title: songTitle });
                    }
                }
            }
            catch (error) {
                console.error("Erro ao processar Spotify:", error);
                return message.channel.send("❌ Não consegui processar esse link do Spotify!");
            }
        }
        else if (query.includes("youtube.com/playlist") || query.includes("list=")) {
            try {
                const playlist = yield (0, ytpl_1.default)(query.split("list=")[1]);
                songs = playlist.items.map((video) => ({
                    url: video.url,
                    title: video.title || "Música sem título",
                }));
                message.channel.send(`🎶 Adicionadas **${songs.length} músicas** da playlist **${playlist.title}** à fila!`);
            }
            catch (error) {
                console.error("Erro ao processar playlist do YouTube:", error);
                return message.channel.send("❌ Não consegui acessar essa playlist. Certifique-se de que ela é pública.");
            }
        }
        else {
            if (ytdl_core_1.default.validateURL(query)) {
                const videoInfo = yield ytdl_core_1.default.getInfo(query);
                songs.push({ url: query, title: videoInfo.videoDetails.title });
            }
            else {
                const searchResult = yield (0, yt_search_1.default)(query);
                if (searchResult.videos.length > 0) {
                    songs.push({ url: searchResult.videos[0].url, title: searchResult.videos[0].title });
                }
            }
        }
        if (songs.length === 0) {
            return message.channel.send("Oxi! Não encontrei nenhuma música!");
        }
        queue.push(...songs);
        message.channel.send(`🎶 Adicionadas **${songs.length} músicas** à fila!`);
        if (queue.length === songs.length) {
            playSong(message);
        }
    }
    if (command === "skip") {
        queue.shift();
        if (queue.length > 0) {
            playSong(message);
        }
        else {
            message.channel.send("Ops! A fila está vazia!");
        }
    }
    if (command === "stop") {
        queue.length = 0;
        if (player) {
            player.stop();
        }
        message.channel.send("STOP! Música parada!");
    }
    if (command === "exit") {
        if (player) {
            player.stop();
        }
        if (connection) {
            connection.destroy();
        }
        message.channel.send("BYE BYE :( desconectado!");
    }
    if (command === "resume") {
        if (player && resource) {
            player.unpause();
            message.channel.send("▶ PLAY! Música retomada!");
        }
        else {
            message.channel.send("EITA! Não há música pausada para continuar.");
        }
    }
    let lastLoveMessage;
    if (command === "love") {
        const heartMessages = [
            "💖 Você é a melhor coisa que já aconteceu na minha vida! 💖",
            "🌹 Eu te amo mais do que qualquer música linda que esse bot pode tocar! 🎶",
            "💘 Cada dia com você é um presente, e eu sou tão grata por ter você ao meu lado!",
            "✨ Você ilumina minha vida como uma melodia perfeita! 🎵💫",
            "💜 Meu amor por você cresce mais a cada dia, como um refrão viciante! 🎼💜",
            "💕 Você é minha música favorita, aquela que eu nunca quero parar de ouvir! 🎶",
            "💞 Meu amor por você é como uma sinfonia eterna, cada nota é um momento especial! 🎻",
            "💖 O som do seu riso é minha trilha sonora favorita! 🎵💖",
            "😍 Com você, cada dia é uma nova canção cheia de amor e alegria! 🎶",
            "💘 Você é a harmonia perfeita na música da minha vida! 🎼",
            "💓 Meu coração bate no ritmo do nosso amor! 🥁💓",
            "💝 Você é a melodia que embala meus sonhos mais lindos! ✨🎶",
            "🎵 Cada batida do meu coração toca uma nota do amor que sinto por você! 💖",
            "💖 Você é a estrela que brilha na minha constelação de felicidade! ✨💘",
            "🌈 Estar com você é como ouvir minha música favorita no repeat! 🎧💜",
            "💖 Você é a letra perfeita da canção mais bonita da minha vida! 🎶",
            "💞 Seu amor é como um refrão viciante, não sai da minha cabeça! 🎵😍",
            "💝 Eu te amo mais do que todas as músicas do mundo combinadas! 🌍🎶",
            "💖 Você é o dueto perfeito para o meu coração! 🎤❤️",
            "💘 Se o amor fosse uma música, a nossa seria a mais linda já escrita! 🎼💘",
            "💖 Seu abraço é a minha melhor canção de ninar! 🌙🎶",
            "🎵 Com você, cada dia é um novo verso cheio de amor e felicidade! 💞",
            "💜 Se a vida fosse um álbum, você seria minha faixa favorita! 🎶💖",
            "💖 Você é a trilha sonora da minha felicidade eterna! 🎧💞",
            "💝 Meu amor por você é infinito, como um loop de uma canção perfeita! 🔄🎵",
            "💘 Se o amor fosse uma melodia, a nossa nunca teria fim! 🎶✨",
            "🎼 Você é a nota perfeita no acorde da minha vida! 🎵💖",
            "💖 Seu amor é como uma balada romântica, sempre tocando no meu coração! 🎶💜",
            "💞 Nossa história de amor é uma música linda que nunca sai de moda! 🎼✨",
            "💖 Você é a melhor coisa que já aconteceu na minha vida! 💖",
            "🌹 Eu te amo mais do que qualquer música linda que esse bot pode tocar! 🎶",
            "💘 Cada dia com você é um presente, e eu sou tão grata por ter você ao meu lado!",
            "✨ Você ilumina minha vida como uma melodia perfeita! 🎵💫",
            "💜 Meu amor por você cresce mais a cada dia, como um refrão viciante! 🎼💜",
            "💕 Você é meu porto seguro, meu lar, meu amor eterno! 💖",
            "💞 Cada momento ao seu lado é uma lembrança preciosa que guardo no coração! 💖",
            "💖 O simples fato de te amar já torna cada dia mais bonito e especial! ✨",
            "😍 Seu sorriso tem o poder de iluminar até os dias mais nublados da minha vida! ☀️",
            "💘 Você é o sonho mais lindo que se tornou realidade! 💕",
            "💓 Seu amor me envolve como um abraço quentinho em um dia frio! 🥰",
            "💝 Desde que te conheci, descobri que o amor verdadeiro existe e tem seu nome! 💖",
            "🌟 Com você, a vida faz sentido, os dias são mais doces e o mundo é mais colorido! 💖",
            "💖 Amar você é a melhor decisão que já tomei na minha vida! 💞",
            "💜 Se eu pudesse escolher qualquer pessoa no mundo, ainda escolheria você, mil vezes! 💘",
            "💞 Não importa onde eu esteja, enquanto eu estiver com você, estarei em casa! 🏡💖",
            "💝 Você é minha paz, meu abrigo e o amor da minha vida! 💕",
            "💖 Eu poderia passar a eternidade ao seu lado e ainda não seria tempo suficiente! ⏳💞",
            "💕 Você é o motivo do meu sorriso, a alegria dos meus dias e a luz da minha vida! ☀️",
            "💘 Te amar é tão natural quanto respirar, porque você é tudo para mim! 💖",
            "🌹 Nada neste mundo me faz mais feliz do que estar ao seu lado! 💞",
            "💜 Seu amor me dá forças para enfrentar qualquer desafio, pois sei que tenho você! 💖",
            "💝 Cada 'eu te amo' que digo vem carregado de toda a intensidade do meu coração! 💕",
            "💖 Você é minha história favorita, e quero escrever cada página ao seu lado! 📖💕",
            "🌟 Ter você na minha vida é o maior presente que já recebi! 🎁💖",
            "💘 O amor que sinto por você cresce a cada dia, como uma chama que nunca se apaga! 🔥",
            "💞 Meu coração pertence a você, e eu nunca quis que fosse diferente! 💖",
            "💜 Seu toque é o carinho que aquece minha alma, e seu olhar é o brilho que ilumina meu mundo! ✨",
            "💖 Eu te amo não apenas pelo que você é, mas pelo que me faz sentir quando estou ao seu lado! 💕",
            "💕 O tempo pode passar, mas meu amor por você será eterno! 💖"
        ];
        let randomMessage;
        do {
            randomMessage = heartMessages[Math.floor(Math.random() * heartMessages.length)];
        } while (randomMessage === lastLoveMessage);
        lastLoveMessage = randomMessage;
        message.channel.send(randomMessage);
    }
    if (command === "pause") {
        if (player) {
            player.pause();
            message.channel.send("⏸ PAUSE! Música pausada!");
        }
        else {
            message.channel.send("OPSS! Não há música tocando no momento.");
        }
    }
    if (command === "queue") {
        if (queue.length === 0) {
            return message.channel.send("EITA! A fila está vazia!");
        }
        const MAX_SONGS_PER_MESSAGE = 20;
        const queueChunks = [];
        for (let i = 0; i < queue.length; i += MAX_SONGS_PER_MESSAGE) {
            queueChunks.push(queue.slice(i, i + MAX_SONGS_PER_MESSAGE));
        }
        queueChunks.forEach((chunk, index) => {
            const queueMessage = chunk.map((song, i) => `${i + 1 + index * MAX_SONGS_PER_MESSAGE}. **${song.title}**`).join("\n");
            message.channel.send(`🎶 Fila de músicas (Parte ${index + 1}):\n${queueMessage}`);
        });
    }
}));
function playSong(message) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const voiceChannel = (_a = message.member) === null || _a === void 0 ? void 0 : _a.voice.channel;
        if (!voiceChannel) {
            return message.channel.send("OPS! Você precisa estar em um canal de voz!");
        }
        const song = queue[0];
        if (!song)
            return;
        connection = (0, voice_1.joinVoiceChannel)({
            channelId: voiceChannel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator,
        });
        try {
            const stream = (0, ytdl_core_1.default)(song.url, {
                filter: "audioonly",
                highWaterMark: 1 << 25,
                quality: "highestaudio",
                dlChunkSize: 0,
                requestOptions: {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                    }
                }
            });
            resource = (0, voice_1.createAudioResource)(stream);
            player = (0, voice_1.createAudioPlayer)();
            player.play(resource);
            connection.subscribe(player);
            message.channel.send(`🎶 Tocando agora: **${song.title}**`);
            player.on("idle", () => {
                queue.shift();
                if (queue.length > 0) {
                    playSong(message);
                }
                else {
                    message.channel.send("🎶 Fila finalizada! Saindo do canal de voz.");
                    if (connection.state.status !== "destroyed") {
                        connection.destroy();
                    }
                }
            });
            player.on("error", (error) => {
                console.error("Erro no AudioPlayer:", error);
                message.channel.send("❌ Houve um erro na reprodução. Pulando para a próxima música...");
                queue.shift();
                if (queue.length > 0) {
                    playSong(message);
                }
                else {
                    if (connection.state.status !== "destroyed") {
                        connection.destroy();
                    }
                }
            });
        }
        catch (error) {
            console.error("Erro ao tocar música:", error);
            message.channel.send("Aaaaaah, não consegui tocar essa música. Pulando para a próxima...");
            queue.shift();
            if (queue.length > 0) {
                playSong(message);
            }
            else {
                connection.destroy();
            }
        }
    });
}
client.login(process.env.TOKEN);
