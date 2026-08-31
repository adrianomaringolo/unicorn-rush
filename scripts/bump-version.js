// Sobe a versão do jogo nos três lugares onde ela aparece, de uma vez:
//
//   src/game/version.js   o número que o cartão "Sobre" mostra
//   package.json          a versão do pacote
//   sw.js                 o nome do cache offline (é ele que descarta o
//                         cache antigo no aparelho de quem já jogou)
//
// Uso:
//   npm run bump              → sobe o último número (0.2.0 → 0.2.1)
//   npm run bump -- minor     → 0.2.1 → 0.3.0
//   npm run bump -- major     → 0.3.0 → 1.0.0
//   npm run bump -- 1.4.2     → exatamente essa
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const arquivo = (nome) => join(raiz, nome);

const atual = JSON.parse(readFileSync(arquivo('package.json'), 'utf8')).version;
const pedido = process.argv[2] || 'patch';

function proxima(versao, como) {
  if (/^\d+\.\d+\.\d+$/.test(como)) return como;
  const [maior, menor, remendo] = versao.split('.').map(Number);
  if (como === 'major') return `${maior + 1}.0.0`;
  if (como === 'minor') return `${maior}.${menor + 1}.0`;
  if (como === 'patch') return `${maior}.${menor}.${remendo + 1}`;
  throw new Error(`não entendi "${como}" — use patch, minor, major ou 1.2.3`);
}

const nova = proxima(atual, pedido);

// Troca em cada arquivo, conferindo que a substituição realmente aconteceu:
// falhar aqui é melhor do que deixar um dos três para trás.
const trocas = [
  ['package.json', `"version": "${atual}"`, `"version": "${nova}"`],
  ['src/game/version.js', `export const VERSION = '${atual}';`, `export const VERSION = '${nova}';`],
  ['sw.js', `const VERSION = 'unicornrush-v${atual}';`, `const VERSION = 'unicornrush-v${nova}';`],
];

// Confere os três antes de escrever qualquer um: se abortasse no meio,
// deixaria um arquivo adiantado e os outros para trás — exatamente o
// problema que este script existe para evitar.
const pendentes = [];
for (const [nome, de, para] of trocas) {
  const texto = readFileSync(arquivo(nome), 'utf8');
  if (!texto.includes(de)) {
    console.error(`❌ ${nome}: não achei ${de}`);
    console.error('   Os três arquivos precisam estar na mesma versão antes de subir.');
    process.exit(1);
  }
  pendentes.push([nome, texto.replace(de, para)]);
}

for (const [nome, texto] of pendentes) {
  writeFileSync(arquivo(nome), texto);
  console.log(`   ${nome}`);
}

console.log(`\n✅ ${atual} → ${nova}`);
