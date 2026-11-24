// Leitor de PNG mínimo, só para os scripts (o navegador lê PNG sozinho):
// devolve { largura, altura, pixels } com os pixels em RGBA, como um
// ImageData. Cobre o que as páginas de pintar usam — tons de cinza, RGB,
// paleta (o pngquant grava assim) e alfa, de 1 a 8 bits —, sem entrelaçado.
import { readFileSync, writeFileSync } from 'node:fs';
import { inflateSync, deflateSync } from 'node:zlib';

export function lerPng(caminho) {
  const b = readFileSync(caminho);
  if (b.readUInt32BE(0) !== 0x89504e47) throw new Error(`${caminho} não é PNG`);
  let pos = 8;
  let L = 0; let A = 0; let bits = 0; let tipo = 0; let paleta = null; let alfa = null;
  const dados = [];
  while (pos < b.length) {
    const tam = b.readUInt32BE(pos);
    const nome = b.toString('ascii', pos + 4, pos + 8);
    const corpo = b.subarray(pos + 8, pos + 8 + tam);
    if (nome === 'IHDR') {
      L = corpo.readUInt32BE(0); A = corpo.readUInt32BE(4); bits = corpo[8]; tipo = corpo[9];
      if (corpo[12]) throw new Error(`${caminho}: PNG entrelaçado não é lido aqui`);
      if (bits > 8) throw new Error(`${caminho}: PNG de ${bits} bits não é lido aqui`);
    } else if (nome === 'PLTE') paleta = corpo;
    else if (nome === 'tRNS') alfa = corpo;
    else if (nome === 'IDAT') dados.push(corpo);
    else if (nome === 'IEND') break;
    pos += 12 + tam;
  }
  const canais = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[tipo];
  const bpp = Math.max(1, (canais * bits) / 8);           // bytes por pixel, para os filtros
  const linha = Math.ceil((L * canais * bits) / 8);
  const cru = inflateSync(Buffer.concat(dados));
  const img = new Uint8Array(linha * A);
  for (let y = 0; y < A; y++) {
    const f = cru[y * (linha + 1)];
    const src = y * (linha + 1) + 1;
    const dst = y * linha;
    for (let x = 0; x < linha; x++) {
      const a = x >= bpp ? img[dst + x - bpp] : 0;
      const c = y > 0 ? img[dst - linha + x] : 0;
      const d = x >= bpp && y > 0 ? img[dst - linha + x - bpp] : 0;
      let v = cru[src + x];
      if (f === 1) v += a;
      else if (f === 2) v += c;
      else if (f === 3) v += (a + c) >> 1;
      else if (f === 4) {
        const p = a + c - d; const pa = Math.abs(p - a); const pb = Math.abs(p - c); const pc = Math.abs(p - d);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? c : d;
      }
      img[dst + x] = v & 255;
    }
  }
  const amostra = (y, i) => {                              // i-ésima amostra da linha y
    if (bits === 8) return img[y * linha + i];
    const porByte = 8 / bits;
    const byte = img[y * linha + Math.floor(i / porByte)];
    return (byte >> (8 - bits * (1 + (i % porByte)))) & ((1 << bits) - 1);
  };
  const escala = 255 / ((1 << bits) - 1);
  const pixels = new Uint8ClampedArray(L * A * 4);
  for (let y = 0; y < A; y++) {
    for (let x = 0; x < L; x++) {
      const k = (y * L + x) * 4;
      if (tipo === 3) {
        const n = amostra(y, x);
        pixels[k] = paleta[n * 3]; pixels[k + 1] = paleta[n * 3 + 1]; pixels[k + 2] = paleta[n * 3 + 2];
        pixels[k + 3] = alfa && n < alfa.length ? alfa[n] : 255;
      } else if (tipo === 0 || tipo === 4) {
        const g = amostra(y, x * canais) * escala;
        pixels[k] = pixels[k + 1] = pixels[k + 2] = g;
        pixels[k + 3] = tipo === 4 ? amostra(y, x * canais + 1) * escala : 255;
      } else {
        for (let c = 0; c < canais; c++) pixels[k + c] = amostra(y, x * canais + c) * escala;
        if (tipo === 2) pixels[k + 3] = 255;
      }
    }
  }
  return { largura: L, altura: A, pixels };
}

// O contrário: grava `pixels` (RGB, 3 bytes por pixel) num PNG de 8 bits,
// sem paleta. Só para as imagens de conferência dos scripts.
const CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function bloco(nome, corpo) {
  const tam = Buffer.alloc(4); tam.writeUInt32BE(corpo.length);
  const tipoECorpo = Buffer.concat([Buffer.from(nome, 'ascii'), corpo]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(tipoECorpo));
  return Buffer.concat([tam, tipoECorpo, crc]);
}
export function escreverPng(caminho, largura, altura, rgb) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largura, 0); ihdr.writeUInt32BE(altura, 4);
  ihdr[8] = 8; ihdr[9] = 2;                               // 8 bits, RGB
  const cru = Buffer.alloc((largura * 3 + 1) * altura);
  for (let y = 0; y < altura; y++) {
    cru[y * (largura * 3 + 1)] = 0;
    Buffer.from(rgb.buffer, rgb.byteOffset + y * largura * 3, largura * 3).copy(cru, y * (largura * 3 + 1) + 1);
  }
  writeFileSync(caminho, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloco('IHDR', ihdr), bloco('IDAT', deflateSync(cru)), bloco('IEND', Buffer.alloc(0)),
  ]));
}
