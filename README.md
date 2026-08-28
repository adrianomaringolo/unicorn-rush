# 🦄 UnicornRush

Jogo infantil de corrida infinita feito com [three.js](https://threejs.org/):
a unicórnia Lua corre por uma pista mágica juntando corações, desviando de
pedras, barreiras de doce e arbustos espinhosos.

## Personagens

Na tela inicial dá para escolher entre cinco unicórnios (setas ← → ou toque
no retrato). O escolhido gira devagar embaixo do cartão, para dar tempo de
ver o modelo, e cada um tem corpo, crina, chifre, asas, marca na anca e
rastro próprios:

| | Personagem | Jeitão | História |
| --- | --- | --- | --- |
| 🌈 | **Uni** | branca, crina arco-íris, asas de penas, rastro de sete cores | Nasceu na ponta de um arco-íris, num dia de sol com chuva. Onde ela pisa fica colorido. |
| ☀️ | **Sol** | dourado, crina de fogo, asas em raios de sol, rastro alaranjado | Acorda antes de todo mundo para acender o dia; seu rastro morninho faz as flores abrirem. |
| 🌙 | **Lua** | lilás clarinho, crina azul da noite, asas de véu, rastro violeta | Só sai quando escurece, para cuidar dos sonhos de quem dorme. Conhece todos os atalhos da noite. |
| 🤍 | **Lulu** | unicórnia **bebê**: pequenina (78% do tamanho dos outros), cabeçuda, olhos grandes e perninhas curtas, toda branca com crina em tons pastel e um coração na anca. O rastro dela é **um fiozinho** de brilho e ela pega os itens com uma **vozinha bem aguda** | É a menorzinha do grupo e ainda está aprendendo a voar; branquinha como nuvem, deixa um fiozinho de brilho por onde passa. |
| ⭐ | **Estrela** | dourada clara, crina de brilho, asas cor de creme, rastro de luz | Caiu do céu numa noite de agosto e ficou para brincar. Brilha tanto que as estrelinhas correm junto. |

Tudo isso é dado, não código: cada personagem é uma entrada em
`src/models/characters.js` com as cores, o estilo do chifre, das asas
(`feather`, `ray` ou `veil`), a marca da anca (`rainbow`, `sun`, `moon`,
`star`, `heart`), as cores e a largura do rastro e, se quiser, o tamanho
(`scale`), as proporções (`proportions`: cabeça, olhos e pernas — é o que faz
a Lulu parecer um bebê) e a `voice`, que é o tom dos sons de coleta (1 é o
normal; a Lulu usa 1,5, uma quinta acima). Para inventar um quinto unicórnio basta
acrescentar mais uma entrada lá — o modelo 3D se monta sozinho.

## Pistas

Também dá para escolher por onde correr — a pista muda o céu, a neblina, a
luz, o chão, os enfeites das laterais e até os obstáculos:

| | Pista | Como é |
| --- | --- | --- |
| 🌈 | **Campo** | O campo encantado: grama verde, **flores** (com caule, folha e pétalas) e tufinhos floridos rentes ao chão, árvores-pirulito, cogumelos, cristais e um arco-íris gigante no horizonte. Obstáculos de pedra, barreira de doce e arbusto espinhoso. |
| 🍭 | **Doces** | Mundo de confeitaria: chão de cobertura rosa, pista de biscoito, pirulitos, cupcakes e bengalas doces. Obstáculos de bala de goma, rosquinha e barra de doce. |
| ☁️ | **Céu** | Em cima das nuvens: chão de algodão, estrada dourada, sol grandão com raios, balões, arquinhos de arco-íris e morrinhos de nuvem. Obstáculos de nuvem carregada, pipa e cacho de balões. |
| 🌙 | **Noite** | Céu estrelado com lua cheia, pinheiros escuros, cogumelos que brilham, **vagalumes voando em volta da pista** e chão enluarado. **O unicórnio brilha no escuro**: as cores dele viram luz e um halo suave pulsa em volta. Os obstáculos também são acesos — espinho de cristal, pedra de luar e cogumelão brilhante —, cada um com um disco de luz no chão para dar para ver de longe. |

As montanhas do fundo nascem sempre a pelo menos 20 unidades do meio da
pista, então nenhuma cai em cima do caminho.

Cada pista é uma entrada em `src/game/tracks.js` (cores, lista de enfeites e
obstáculos e, se for escura, um `glow` que acende o personagem), então uma
pista nova é só mais uma entrada — os enfeites
disponíveis estão em `src/models/scenery.js`.

### Música

Cada pista tem sua música tema, tocada por osciladores do WebAudio (nada de
arquivo de áudio): *Passeio no campo* 🌈, *Valsa de açúcar* 🍭,
*Sonho de nuvem* ☁️ e *Canção de ninar* 🌙. A música troca junto com a pista e
dá para desligar no botãozinho 🔊 do canto do HUD (a escolha fica salva).
As melodias ficam em `src/game/music.js`, uma nota MIDI por colcheia.

## Modos de jogo

| Modo | Como é |
| --- | --- |
| 🗺️ **Fases** | Dez fases numeradas. Em cada uma é preciso juntar um número de **chaves mágicas** 🔑 antes que as três vidas acabem. As chaves são raras e ficam **bem longe uma da outra** (uma a cada 7–10 segundos de corrida), e podem cair em qualquer faixa — às vezes é preciso desviar para chegar até elas. A fase 1 é bem tranquila (3 chaves, pouca coisa no caminho) e vai apertando até a 10 (12 chaves, pista cheia). Cada fase concluída abre a próxima e ganha uma ⭐ na grade. |
| 🎈 **Livre** | Sem nenhum obstáculo: a pista só tem corações e estrelas e o unicórnio corre devagar. A partida termina com festa quando a criança junta a meta de itens — e **a cada vitória a meta cresce**: 20 itens no nível 1, 25 no nível 2, 30 no 3… até 60. O nível fica salvo, então o desafio continua de onde parou. |
| ⭐ **Aventura** | A corrida infinita: pedras, barreiras de doce e arbustos espinhosos para desviar ou pular, 3 vidas e velocidade que vai aumentando. |

A meta inicial do modo Livre, o quanto ela cresce por vitória (`targetStep`), o teto
(`targetMax`) e as velocidades de cada modo ficam em `MODES`, no começo de
`src/game/config.js`. O recorde é guardado separado por modo.

A tabela das dez fases fica em `src/game/levels.js` — uma linha por fase, com
quantas chaves ela pede, a velocidade, o intervalo entre as linhas de itens, a
chance de sair obstáculo e o espaçamento das chaves (`keyGap` é o mínimo de
linhas entre uma chave e a próxima; `keyChance`, a chance depois disso).
Mexer numa fase é mexer numa linha; o `npm run check` simula cada fase até
completar a meta e confere que ela fica mais difícil que a anterior, que as
chaves não ficam grudadas e que a fase inteira cabe num tempo razoável.

## Power-ups

De vez em quando aparece um item especial na pista (sempre numa faixa livre,
com uma argolinha girando em volta):

| | Power-up | O que faz |
| --- | --- | --- |
| 🛡️ | **Escudo** | 8 segundos atravessando obstáculos sem perder vida. O unicórnio ganha uma **bolha de energia** em volta, com uma redinha brilhando. |
| 🧲 | **Ímã** | 8 segundos puxando os corações e estrelas por perto. Três **argolas rosa** giram em volta do unicórnio. |
| ⚡ | **Turbo** | 5 segundos de super velocidade: o unicórnio **decola e passa voando por cima dos obstáculos**, com **anéis dourados** escapando para trás e a câmera abrindo um pouco. Ao acabar, ele pousa sozinho. |
| 💖 | **Vida extra** | Devolve uma vida na hora (se já estiver com as três, vira 100 pontos), com um **estouro de anéis rosa**. Não aparece no modo Livre, que não tem vidas. |

Enquanto está valendo, o power-up aparece no alto da tela com uma barrinha do
tempo que falta — e o efeito no personagem **pisca no último segundo**,
avisando que vai acabar. Os números (duração, velocidade do turbo) ficam em
`src/models/powerups.js`, junto com o modelo 3D de cada um.

## O que o jogo lembra

Tudo fica num único registro no localStorage (`unicornrush-save`), montado em
`src/game/storage.js`:

- **escolhas**: personagem, pista e último modo jogado;
- **nível do modo Livre**, que define a meta da próxima partida;
- **progresso das fases**: até qual fase foi liberada e quais já estão feitas;
- **recordes** de pontuação, um por modo;
- **contagens**: vitórias, corridas jogadas, corações e itens coletados no
  total, quantas corridas em cada pista e com cada unicórnio, e quantos
  power-ups de cada tipo;
- se a **música** está ligada ou desligada.

Tem uma **tela de estatísticas** (botão 📊 no primeiro passo da escolha e na
tela de fim de corrida) com tudo em números grandes: vitórias, nível e meta
atual, corridas, corações, itens e recorde, mais duas barrinhas — quantas
corridas em cada pista e com cada unicórnio. Lá também fica o
*Recomeçar do zero*, que pede confirmação antes de apagar o save.

As vitórias, os corações e as corridas também aparecem no último passo da
escolha.
Um save antigo (de quando cada coisa tinha sua própria chave) é migrado
sozinho na primeira vez, e um campo novo no save não quebra o que já estava
salvo.

## Distância e recorde na pista

Enquanto corre, o HUD mostra a **distância percorrida** em passos, e a cada
100 passos passa uma **placa numerada** nas duas beiras da pista (100, 200,
300…) — ela nasce lá na frente já na posição certa, então cruza com o
unicórnio exatamente no número dela.

A maior distância já corrida em cada modo fica salva e vira a **faixa do
recorde**: um arco rosa atravessando a pista, com um risco no chão marcando o
ponto exato. Ao passar por ela aparece o aviso *"🏁 Novo recorde!"*. A maior
distância de todas também virou um quadro na tela de estatísticas.

Em telas estreitas o HUD mostra só o essencial de cada modo (o recorde de
pontos e, nas fases, os pontos e a distância saem de cena) para tudo caber
numa linha só.

## Pausa

Durante a corrida aparece um **⏸️ no canto do HUD** (ou Esc / P no teclado).
A pista congela na hora e o cartão de pausa oferece três caminhos:
**▶️ Continuar**, **🔁 Começar de novo** (a mesma fase ou o mesmo modo) e
**🏠 Sair para o menu**. O tempo parado não conta: ao voltar, o jogo segue
exatamente de onde estava.

## Como começa

A escolha é um passo de cada vez, com o cenário e o unicórnio mudando ao vivo
atrás do cartão:

1. **Escolha a pista** — as quatro pistas, com o nome da música tema;
2. **Quem vai correr?** — os quatro unicórnios, com a historinha de cada um;
3. **Como vamos jogar?** — modo Livre, Fases ou Aventura. O modo Fases abre
   ainda a grade das dez fases (as fechadas ficam com cadeado).

Dá para voltar um passo a qualquer momento; as setas ← → passeiam pelas
opções do passo atual e Enter continua.

## Instalar no aparelho (PWA)

O UnicornRush é um **PWA**: dá para instalar na tela inicial do celular ou do
computador e jogar **sem internet**.

- No Android/Chrome: abrir o jogo → menu → *Instalar app*.
- No iPhone/Safari: abrir o jogo → compartilhar → *Adicionar à Tela de Início*.
- No desktop (Chrome/Edge): ícone de instalar na barra de endereço.

Depois de instalado ele abre em tela cheia, com o ícone próprio e sem barra de
navegador. O `sw.js` guarda o jogo inteiro no aparelho na primeira visita
(HTML, CSS, fonte, os módulos e o three.js — nada vem de fora), então a partir
daí funciona offline. Ao mudar arquivos, é só trocar a `VERSION` no começo do
`sw.js`: o cache antigo é apagado sozinho.

## Ícone

O logo é o `assets/icon.svg` — a cabeça da unicórnia com o chifre dourado, a
crina arco-íris e um coração, desenhado em SVG (nada de imagem pesada). Ele é
o favicon, aparece ao lado do nome nas telas de escolha e é a base dos PNGs em
`assets/icons/` (192, 512, 180 para iOS e uma versão *maskable* com o desenho
dentro da zona segura). Para regerar os PNGs depois de mexer no SVG, basta
abrir o SVG no tamanho desejado e exportar — o arquivo fonte é sempre o
`icon.svg`.

## Como jogar

```bash
npm install      # só na primeira vez
npm start        # abre http://localhost:5173
```

| Ação | Teclado | Celular / tablet |
| --- | --- | --- |
| Mudar de pista | ← → ou A / D | arrastar para o lado |
| Pular | Espaço, ↑ ou W | tocar na tela |
| Começar / recomeçar | Enter ou Espaço | botão na tela |
| Escolher (nas telas de escolha) | ← → · Enter continua | tocar na opção |
| Ligar/desligar a música | — | botão 🔊 no HUD |
| Pausar | Esc ou P | botão ⏸️ no HUD |

Todo item que dá para pegar — coração, estrela, chave e power-up — tem um
**brilho** em volta, na cor dele, que respira devagar: de longe é o que a
criança enxerga primeiro. Os itens são espalhados (menos de um por linha da
pista), então vale a pena mudar de faixa para pegá-los.

Regras: cada 💗 vale 10 pontos, cada ⭐ vale 5 corações e 50 pontos.
No modo Aventura são 3 vidas — bater num obstáculo custa uma vida e dá alguns
segundos de invencibilidade. E a batida é bem sentida: **clarão vermelho** na
tela, **tremida** da câmera, **poeira** na cor do que foi atingido, o
**obstáculo sai voando girando** para trás e ficam **estrelinhas rodando** em
volta da cabeça do unicórnio enquanto ele pisca (o corpinho pisca, as
estrelinhas não). O recorde fica salvo no
navegador, um para cada modo.

A escolha de personagem, de pista e de modo fica salva no navegador para a
próxima vez (veja *O que o jogo lembra*).

O jogo é responsivo: no celular em pé a câmera abre o campo de visão e afasta
para as três pistas caberem na tela, o HUD encolhe, os botões de toque
aparecem sozinhos (embaixo no retrato, nos cantos no modo deitado) e o
desenho usa menos pixels e sombra menor para não engasgar.

Nas telas de escolha o cartão nunca cobre a tela inteira: em pé ele ocupa no
máximo dois terços, as fichas ficam sempre numa linha só e a câmera da
pré-visualização se afasta um pouco — assim a criança vê a pista e o
personagem girando enquanto escolhe. Nas telas com muito conteúdo (fases,
estatísticas) o miolo do cartão rola por dentro e os botões continuam à
vista.

## Estrutura

```
index.html            página + HUD
style.css             visual do HUD e das telas
manifest.webmanifest  dados do app instalável (nome, ícones, cores)
sw.js                 service worker: guarda o jogo para rodar offline
assets/icon.svg       logo do jogo (também é o favicon)
assets/icons/         PNGs do ícone para instalar no aparelho
fonts.css             fonte Fredoka hospedada localmente
assets/fonts/         arquivos .woff2 da Fredoka (SIL Open Font License 1.1)
server.js             servidor estático mínimo (sem dependências)
vendor/               cópia do three.js (para rodar sem build)
src/
  main.js             inicialização
  game/
    config.js         todos os números ajustáveis (velocidade, pulo, cores…)
    levels.js         a tabela das 10 fases do modo Fases
    tracks.js         as quatro pistas (céu, luz, chão, enfeites, obstáculos)
    music.js          as músicas tema, uma por pista
    storage.js        o save: escolhas, nível, recordes e estatísticas
    Game.js           cena, câmera, estado do jogador, laço principal
    world.js          pista rolando, spawn de itens e obstáculos, partículas
    input.js          teclado, arrastar e botões de toque
    audio.js          efeitos sonoros gerados na hora (WebAudio)
    ui.js             ponte com o HUD em HTML
  models/
    characters.js     os quatro personagens (cores, asas, marca, rastro, história)
    unicorn.js        monta o modelo 3D a partir de um personagem + galope
    powerups.js       escudo, ímã, turbo e vida extra (modelo + efeito)
    auras.js          o efeito visual de cada power-up no personagem
    rainbowTrail.js   rastro de arco-íris que segue o caminho percorrido
    collectibles.js   coração, estrela e chave mágica
    scenery.js        enfeites (árvore, flor, cogumelo, cristal, pirulito,
                      cupcake, bengala, pinheiro…), obstáculos, nuvens,
                      arco-íris, lua, estrelas, montanhas, o chão, as placas
                      de distância e a faixa do recorde
scripts/smoke-test.js monta tudo fora do navegador (npm run check)
```

Nenhum asset externo: todos os modelos são gerados por código a partir de
formas simples (esferas, cones, cápsulas) e de curvas 2D extrudadas —
por isso o jogo carrega instantaneamente e é fácil de ajustar. A única
exceção é a fonte **Fredoka** (Google Fonts, SIL Open Font License 1.1),
guardada em `assets/fonts/` para o jogo funcionar mesmo sem internet.

## Ajustes rápidos

Quase tudo que muda a sensação do jogo está em `src/game/config.js`:
velocidade inicial e máxima, força do pulo, gravidade, distância entre as
linhas de itens, número de vidas e a paleta de cores.

```bash
npm run check        # testa a montagem dos modelos e 10s de mundo, sem navegador
npm run sync-three   # recopia o three.js para vendor/ após atualizar a dependência
```

## Próximos passos possíveis

- mais pistas na mesma estrutura de `TRACKS` (fundo do mar, castelo de gelo)
- mais modos na mesma estrutura de `MODES` (ex.: "corrida contra o relógio")
- power-ups (escudo de bolha, ímã de corações, voo curto)
- personagens alternativos reaproveitando `createUnicorn()` com outras cores
