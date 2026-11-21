// Grava a narração do jogo no ElevenLabs: um mp3 por fala, por idioma.
//
//   npm run vozes                  grava o que falta, nos dois idiomas
//   npm run vozes -- --simular     só conta: quantas falas, quantas faltam, quantos caracteres
//   npm run vozes -- --idioma pt   só um idioma
//   npm run vozes -- --limite 5    grava no máximo 5 (para testar)
//   npm run vozes -- --forcar      regrava tudo (trocou a voz, o modelo, o tom)
//
// A lista de falas vem de src/game/falas.js — as mesmas funções que o jogo
// usa para montar o que diz, então o texto gravado é idêntico ao pedido. O
// nome de cada arquivo é a chave do texto (`chaveDaFala`): mudou uma
// história, só ela é regravada; o arquivo da versão velha é apagado.
//
// Saída: assets/voz/<idioma>/<chave>.mp3 e assets/voz/<idioma>/index.json
// ({ voz, modelo, falas: { chave: texto } }), que é o que o jogo consulta.
//
// A chave da API é ELEVENLABS_API_KEY, do ambiente ou de um `.env` na raiz
// (fora do git). Nunca é impressa.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setIdioma } from '../src/game/i18n.js';
import {
  todasAsFalas, chaveDaFala, falaVitoria, falaEhSua, falaLigou,
} from '../src/game/falas.js';
import { CHARACTER_LIST } from '../src/models/characters.js';
import { TRACK_LIST } from '../src/game/tracks.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// A narradora. A mesma voz nos dois idiomas: é uma personagem só.
const VOZ = { nome: 'Aria', id: '9BWtsMINqrJLrRacOk9x' };
const MODELO = 'eleven_v3';
const FORMATO = 'mp3_44100_64';            // voz falada: 64 kbps sobra
const AJUSTES = { stability: 0.5, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true };
// Sem a marca, a Aria (que é americana) fala português com sotaque de fora.
const SOTAQUE = { pt: '[Brazilian Portuguese accent]', en: '' };
const IDIOMAS = ['pt', 'en'];

// Pronúncia: trocas feitas **só no texto enviado** ao ElevenLabs — a chave
// do arquivo continua sendo o texto do jogo. "Uni" sem acento a Aria lê
// "Uní", com a força no i; o nome é "Úni".
const PRONUNCIA = {
  pt: [[/\bUni\b/g, 'Úni']],
  en: [],
};
const SIMULTANEAS = 4;

const args = process.argv.slice(2);
const opcao = (nome) => { const i = args.indexOf(nome); return i >= 0 ? args[i + 1] : undefined; };
const simular = args.includes('--simular');
const forcar = args.includes('--forcar');
const limite = Number(opcao('--limite')) || Infinity;
const idiomas = opcao('--idioma') ? [opcao('--idioma')] : IDIOMAS;

function chaveDaApi() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY.trim();
  const arquivo = path.join(RAIZ, '.env');
  if (fs.existsSync(arquivo)) {
    const m = fs.readFileSync(arquivo, 'utf8').match(/^ELEVENLABS_API_KEY\s*=\s*"?([^"\n]+)"?/m);
    if (m) return m[1].trim();
  }
  return null;
}

// O tom de cada fala: as de comemoração saem animadas; o resto, alegre.
function comTom(texto, comemoracoes, idioma) {
  const tom = comemoracoes.has(texto) ? '[excited]' : '[cheerfully]';
  const falado = (PRONUNCIA[idioma] || []).reduce((t, [de, para]) => t.replace(de, para), texto);
  return [SOTAQUE[idioma], tom, falado].filter(Boolean).join(' ');
}

async function gravar(chave, texto, idioma) {
  for (let tentativa = 0; ; tentativa++) {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOZ.id}?output_format=${FORMATO}`, {
      method: 'POST',
      headers: { 'xi-api-key': chave, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: texto, model_id: MODELO, language_code: idioma, voice_settings: AJUSTES }),
    });
    if ((r.status === 429 || r.status >= 500) && tentativa < 5) {
      await new Promise((ok) => setTimeout(ok, 2000 * (tentativa + 1)));
      continue;
    }
    if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 160)}`);
    return Buffer.from(await r.arrayBuffer());
  }
}

const chave = simular ? null : chaveDaApi();
if (!simular && !chave) {
  console.error('❌ falta ELEVENLABS_API_KEY (no ambiente ou num .env na raiz)');
  process.exit(1);
}

let gravadas = 0;
let falhas = 0;
for (const idioma of idiomas) {
  setIdioma(idioma, { salvar: false });
  const pasta = path.join(RAIZ, 'assets/voz', idioma);
  fs.mkdirSync(pasta, { recursive: true });

  const falas = todasAsFalas();
  const comemoracoes = new Set([
    falaLigou(),
    ...TRACK_LIST.map(falaVitoria),
    ...[...CHARACTER_LIST, ...TRACK_LIST].map(falaEhSua),
  ]);

  const indice = {};
  for (const texto of falas) indice[chaveDaFala(texto)] = texto;

  // O que foi enviado da última vez, fala por fala. Se o texto enviado mudou
  // (outra pronúncia, outro tom, outra marca), a fala é regravada mesmo com
  // o arquivo existindo — o texto do jogo é o mesmo, mas o áudio não seria.
  const arquivoIndice = path.join(pasta, 'index.json');
  const enviados = fs.existsSync(arquivoIndice)
    ? JSON.parse(fs.readFileSync(arquivoIndice, 'utf8')).enviados || {}
    : {};

  const faltam = Object.entries(indice)
    .filter(([k, texto]) => forcar
      || !fs.existsSync(path.join(pasta, `${k}.mp3`))
      || (enviados[k] && enviados[k] !== comTom(texto, comemoracoes, idioma)))
    .slice(0, Math.max(0, limite - gravadas));
  const caracteres = faltam.reduce((n, [, texto]) => n + comTom(texto, comemoracoes, idioma).length, 0);
  console.log(`\n${idioma}: ${falas.length} falas, ${faltam.length} para gravar (${caracteres} caracteres)`);
  if (simular) continue;

  // Grava em grupos pequenos: rápido sem esbarrar no limite da API.
  for (let i = 0; i < faltam.length; i += SIMULTANEAS) {
    await Promise.all(faltam.slice(i, i + SIMULTANEAS).map(async ([k, texto]) => {
      try {
        const mp3 = await gravar(chave, comTom(texto, comemoracoes, idioma), idioma);
        fs.writeFileSync(path.join(pasta, `${k}.mp3`), mp3);
        enviados[k] = comTom(texto, comemoracoes, idioma);
        gravadas++;
        console.log(`  ✅ ${k}  ${texto.slice(0, 60)}`);
      } catch (erro) {
        falhas++;
        console.log(`  ❌ ${k}  ${texto.slice(0, 60)} — ${erro.message}`);
      }
    }));
  }

  // O índice só lista o que existe de verdade: uma fala que falhou fica de
  // fora e cai na voz do aparelho, em vez de pedir um arquivo que não há.
  const existentes = Object.fromEntries(Object.entries(indice)
    .filter(([k]) => fs.existsSync(path.join(pasta, `${k}.mp3`))));
  // `falas` é o que o jogo lê; `enviados`, o que o script compara na próxima.
  const enviadosValidos = Object.fromEntries(Object.entries(enviados).filter(([k]) => k in existentes));
  fs.writeFileSync(arquivoIndice,
    `${JSON.stringify({ voz: VOZ.nome, modelo: MODELO, falas: existentes, enviados: enviadosValidos }, null, 2)}\n`);

  // Apaga as gravações de textos que mudaram ou saíram do jogo.
  const sobras = fs.readdirSync(pasta)
    .filter((f) => f.endsWith('.mp3') && !(f.slice(0, -4) in indice));
  sobras.forEach((f) => fs.unlinkSync(path.join(pasta, f)));
  if (sobras.length) console.log(`  🧹 ${sobras.length} gravações velhas apagadas`);
}

if (!simular) console.log(`\n${gravadas} gravadas, ${falhas} falharam`);
if (falhas) process.exitCode = 1;
