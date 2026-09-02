# Prompts para gerar as imagens da história no ChatGPT

As figuras do livro (`src/game/story.js`) foram geradas a partir destes
prompts e vivem em `assets/story/1.webp` … `11.webp`.

Ao acrescentar uma página nova: gere o PNG, guarde em
`assets/story/originais/`, converta para WebP (ver *Depois de gerar*) **e só
então** acrescente a linha no `SHELL` do `sw.js` — nunca antes, porque o
cache offline se instala de uma vez só e falha inteiro se listar um arquivo
que não existe. Este arquivo fica aqui
para refazer uma página, ajustar uma cena ou gerar o livro inteiro de novo.

(O `story.js` ainda tem as mesmas nove cenas desenhadas em SVG por código,
usadas só como reserva se um arquivo de imagem faltar.)

## Como usar

1. Comece uma conversa nova e cole **o bloco de estilo inteiro** (abaixo) como
   primeira mensagem. Ele é o contrato visual: enquadramento, paleta,
   personagens.
2. Depois peça **uma cena por vez**, colando o prompt da página.
3. Da segunda em diante, anexe a imagem anterior e diga:
   *"Mesmo estilo, mesmas personagens e mesma paleta desta imagem."* — é o que
   segura a consistência entre as páginas.
4. Se a Uni sair diferente, gere a página 1 até ela ficar boa e use **essa**
   como referência para todas as outras.

Peça sempre **PNG 16:10** (1536×960 ou maior). Guarde os originais em
`assets/story/originais/` como `1.png` … `9.png`, **na ordem das páginas** —
é dali que sai o `.webp` que o jogo carrega (ver *Depois de gerar*).

---

## Bloco de estilo (colar primeiro, uma vez)

```
Você vai ilustrar as páginas de um livro infantil chamado "UnicornRush",
para crianças de 3 a 7 anos. Vou pedir uma cena por vez. Regras que valem
para TODAS as imagens:

ESTILO
- Ilustração digital 2D, vetorial, chapada (flat), sem textura e sem
  degradês fortes; contornos suaves ou nenhum contorno.
- Formas arredondadas e gordinhas, nada pontudo ou assustador.
- Luz alegre de meio-dia, clima doce e acolhedor.
- Sem NENHUM texto, letra, número ou logotipo dentro da imagem.
- Sem marca d'água, sem moldura, sem borda.

ENQUADRAMENTO
- Proporção 16:10 (paisagem), 1536x960 px.
- Cena de corpo inteiro, câmera na altura dos olhos de uma criança.
- Personagens sempre de PERFIL, olhando para a direita (menos quando eu
  pedir diferente).
- Horizonte na metade de baixo; muito céu limpo em cima, para o texto do
  livro respirar. Não encoste os personagens nas bordas.

PALETA (use exatamente estas cores)
- Céu: azul claro #bfe9ff no alto virando rosa claro #ffe3f4 embaixo
- Grama: verde claro #9de8a4 com morros mais escuros #6fcf7f
- Rosa principal: #ff5d8f · Roxo: #7a4ec7 · Dourado: #ffd166
- Arco-íris (sempre nesta ordem): #ff7b9d, #ffb26b, #ffe36b, #8ce99a,
  #74c0fc, #c09cff

PERSONAGENS (mantenha idênticos em todas as páginas)
- UNI — a heroína. Unicórnia pônei, corpo branco levemente rosado (#fffaff),
  focinho rosa (#ff9dc0), chifre dourado em espiral, crina e rabo em
  arco-íris (rosa, dourado, verde, azul, lilás), asinhas de pena branco-lilás
  (só aparecem quando eu pedir), uma marquinha de arco-íris na anca. Olhos
  grandes e simpáticos, cílios, expressão gentil.
- SOL — unicórnio pônei cor de creme (#fff1d6), crina e rabo em laranja e
  dourado, chifre laranja-dourado, marquinha de sol na anca.
- LUA — unicórnia pônei lilás claro (#e9e6ff), crina e rabo em azul e roxo,
  chifre lilás pálido, marquinha de lua crescente na anca.

OBJETOS RECORRENTES
- CHAVE MÁGICA: chave dourada e gordinha, argola redonda no topo, dois
  dentes; sempre flutuando com faíscas douradas em volta.
- PORTA MÁGICA: portal em arco, moldura roxa (#5b3c96), interior escuro
  quando trancada, com um cadeado dourado grande na frente.
- CORAÇÃO: coração rosa (#ff8fb1) chapado, flutuando.
- ECO: o unicórnio **invisível**. Não se desenha o corpo dele: desenha-se
  o **contorno** — uma silhueta de unicórnio feita só de linha branca
  pontilhada, vazia por dentro, como um desenho a giz no ar. Só o olho
  (fechado, triste) e uma lagriminha azul são de verdade. Quando ele fica
  visível (última cena), aí sim é um unicórnio inteiro: corpo branco-lilás
  (#f3eeff), crina em lilás e branco, chifre lilás pálido.
- TORRE DA NEBLINA: torre estreita de pedra roxa (#5b4a86) com telhado
  pontudo mais escuro, bandeirinha roxa no topo, uma janelinha em arco
  acesa em dourado e uma portinha trancada com cadeado. Sempre longe, no
  alto de um morro, meio escondida na neblina. Misteriosa, nunca assustadora.

Responda só com a imagem, sem explicação.
```

---

## Página 1 — As Terras Mágicas

> Texto do livro: *"Muito longe daqui existe um reino onde o céu é cor-de-rosa
> e o arco-íris encosta no chão. Ali viviam todos os unicórnios do mundo,
> correndo juntos o dia inteiro."*

```
Cena 1: um campo verde com morros suaves e um arco-íris enorme que sai de
trás dos morros e cruza o céu. Três unicórnios pastando e brincando, bem
espaçados: SOL à esquerda, UNI no meio (um pouco maior, mais à frente), LUA
à direita. Nuvens brancas fofas no céu. Dois corações rosa e algumas faíscas
douradas flutuando. Clima de festa tranquila, todo mundo junto e feliz.
```

## Página 2 — A manhã silenciosa

> *"Uma manhã, Uni acordou e não ouviu ninguém. Nem um galope, nem uma risada.
> Ela chamou pelos amigos até o sol se pôr — mas as Terras Mágicas estavam
> vazias."*

```
Cena 2: o MESMO campo da cena 1, agora vazio e desbotado — céu cinza-azulado
(#cfd6e2), grama esverdeada sem viço (#b9c9ba), o arco-íris quase apagado ao
fundo, nuvens cinzentas. UNI sozinha no centro-direita, parada, cabeça baixa,
olhos tristes e uma lagriminha azul. No chão à esquerda, um rastro de
pegadas de casco que some ao longe. Nenhum outro personagem. Silêncio e
saudade — triste, mas doce, nunca assustador.
```

## Página 3 — A primeira chave

> *"No meio da grama, uma coisinha brilhava. Era uma chave dourada, quentinha,
> girando sozinha no ar. Uni chegou pertinho — e a chave brilhou mais forte."*

```
Cena 3: o campo com as cores de volta. UNI à esquerda, esticando o pescoço
para a direita, curiosa, orelhas para a frente. À direita, flutuando um
pouco acima da grama, uma CHAVE MÁGICA dourada grande, levemente inclinada,
girando, cercada por um halo de luz quente amarelada e faíscas em estrela.
Um círculo de luz dourada na grama embaixo dela. Um coração rosa pequeno
flutuando entre os dois.
```

## Página 4 — O segredo do arco-íris

> *"O arco-íris se abaixou e contou o segredo: cada amigo estava atrás de uma
> porta trancada. E cada porta pede o seu tanto de chaves — umas poucas,
> outras muitas."*

```
Cena 4: o arco-íris desce do céu e encosta no chão bem no meio da cena. Em
primeiro plano, plantadas na grama, TRÊS PORTAS MÁGICAS em arco lado a lado,
todas trancadas, cada uma com um cadeado dourado grande. Dentro de cada
porta, no escuro, a silhueta de um unicórnio esperando — a da esquerda
alaranjada, a do meio rosa, a da direita azul-arroxeada. Cada porta é um
pouco diferente da outra em tamanho. Sem personagens em primeiro plano.
Faíscas douradas entre as portas.
```

## Página 5 — Correr, correr, correr!

> *"As chaves estavam espalhadas pelas pistas do reino, e só apareciam para
> quem corria depressa. Então Uni respirou fundo, abriu as asas… e disparou."*

```
Cena 5: uma pista larga cor-de-rosa clara (#f7d9ff) atravessando a grama da
esquerda para a direita, com tracinhos brancos marcando o caminho. UNI em
GALOPE de perfil, no meio da cena, patas dianteiras esticadas para a frente
e traseiras para trás, as quatro no ar, ASINHAS DE PENA ABERTAS. Atrás dela,
um rastro de arco-íris esvoaçante que se afina e some para a esquerda.
À frente, no caminho: uma pedra arredondada lilás para desviar, dois
corações rosa flutuando e uma chave dourada mais adiante. Sensação de
velocidade e alegria.
```

## Página 6 — Uma chave, um amigo

> *"A porta do Sol pedia quatro chaves. Uni juntou as quatro, girou a
> fechadura… e ele saiu correndo para abraçá-la! Depois veio a Lua, que pedia
> seis. E o reino foi ficando colorido de novo."*

```
Cena 6: à esquerda, uma PORTA MÁGICA ABERTA, sem cadeado, com uma luz
dourada quente jorrando de dentro e um facho de luz caindo na grama. Saindo
dela, em galope alegre para a direita, o unicórnio SOL. À direita da cena,
UNI parada de frente para ele, olhando para a esquerda, feliz, esperando o
abraço. Entre os dois, uma chave dourada flutuando e vários corações rosa
subindo. Arco-íris forte no céu, grama viva. Reencontro emocionado.
```

## Página 7 — E os caminhos também!

> *"Não eram só os amigos: os outros cantos do reino também estavam fechados.
> O País dos Doces, a Praia, a Noite — cada caminho pede as suas chaves para
> abrir."*

```
Cena 7: três PORTAIS em arco, lado a lado na grama, cada um com grades finas
e um cadeado dourado — mas por dentro de cada um dá para espiar um lugar
diferente:
- esquerda: o PAÍS DOS DOCES — céu rosa, chão rosa forte, um pirulito
  gigante e um cupcake com cobertura branca e cereja;
- meio: a PRAIA — céu azul, sol dourado, faixa de mar azul, areia clara e um
  coqueiro;
- direita: a NOITE — céu azul-marinho, lua crescente branca e estrelas
  douradas.
Sem personagens; a cena é sobre os lugares fechados esperando para abrir.
```

## Página 8 — Mas quem foi?

> *"E ainda falta a Uni descobrir uma coisa: quem foi que trancou os amigos
> dela? Ninguém sabe. Dizem que a resposta mora lá em cima, na torre da
> neblina — e que ela só abre no dia em que o último amigo sair de trás da
> porta dele."*

```
Cena 8: fim de tarde, céu em azul-lilás (#b4c8f2) virando rosa (#ffd8e8),
com duas estrelinhas douradas aparecendo. UNI pequena no canto inferior
esquerdo, de perfil, parada, olhando para cima e para a direita.
Do lado direito, ao longe e bem mais alto, um morro roxo-acinzentado com a
TORRE DA NEBLINA no topo, meio coberta por faixas de névoa branca; a
janelinha em arco acesa em dourado, a portinha com cadeado.
Ligando as duas coisas, subindo da Uni até a torre: um caminho de doze
pedras arredondadas que vão diminuindo com a distância — as três primeiras
douradas (já vencidas), a quarta branca com contorno rosa (a da vez) e as
oito últimas em lilás apagado (ainda fechadas).
Dois pontos de interrogação roxos translúcidos flutuando no céu perto da
torre, um grande e um pequeno. Clima de mistério doce e de vontade de
chegar lá — nada de sombra ameaçadora, nada de vilão à vista.
```

## Página 9 — Falta você!

> *"Muito amigo trancado, muito caminho fechado e um mistério lá em cima — e a
> Uni não dá conta sozinha. Corre com ela, junta as chaves, vence as fases… e
> traz todo mundo de volta para casa. Vamos?"*

```
Cena 9: o campo no auge, arco-íris grande e vivo cruzando o céu inteiro,
grama verde brilhante. UNI no centro, ASINHAS ABERTAS, virada quase de
frente para quem olha, sorrindo e convidando — pata dianteira levantada como
quem chama. Duas chaves douradas flutuando, uma de cada lado. Corações rosa,
estrelas douradas e faíscas espalhados pelo céu. A imagem mais luminosa e
festiva de todas: é o convite para jogar.
```

---

## Página 10 — O que ninguém via

> *"Lá dentro morava o Eco. Ele era invisível, e só a alegria podia deixá-lo
> visível. Achou que, prendendo todo mundo, teria amigos — e ficou mais triste
> ainda. Então espalhou as chaves, para a Uni, que é a alegria em pessoa,
> encontrá-lo."*

```
Cena 10: fim de tarde melancólico, céu azul-lilás desbotando para um rosa
acinzentado, grama sem viço. À direita, no alto de um morro roxo-acinzentado,
a TORRE DA NEBLINA com a janelinha acesa. À esquerda, em primeiro plano, o
ECO: uma silhueta de unicórnio feita só de contorno branco pontilhado, vazia
por dentro — dá para ver a grama através dele. Cabeça baixa, olho fechado,
uma lagriminha azul (a única coisa "sólida" nele). No chão, entre ele e a
torre, três CHAVES MÁGICAS douradas que ele foi deixando pelo caminho. Um
ponto de interrogação cinza pálido no céu. Tristeza silenciosa, nunca
assustadora: ele não é um vilão, é alguém que ninguém enxergava.
```

## Página 11 — A alegria chegou

> *"A Uni abriu a última porta e chamou o Eco para correr. E aí, pela primeira
> vez, ele sentiu alegria — e todo mundo pôde vê-lo! Hoje ele corre com os
> outros pelas pistas do reino, e ninguém mais fica sozinho por lá."*

```
Cena 11: a cena mais luminosa do livro. Arco-íris grande e vivo, grama verde
brilhante, céu limpo. UNI galopando à direita, e ao lado dela o ECO —
agora um unicórnio INTEIRO e visível, corpo branco-lilás, crina em lilás e
branco, chifre lilás pálido — galopando junto pela primeira vez, com cara de
espanto feliz. Nos dois cantos, PORTAS MÁGICAS abertas e vazias, com luz
dourada saindo. Corações rosa e estrelas douradas subindo. Ninguém está
sozinho na imagem.
```

## Depois de gerar

Corte para 16:10 exatos, salve o original em `assets/story/originais/N.png`
e converta para o WebP que o jogo carrega:

```bash
cd unicorn-rush
for i in 1 2 3 4 5 6 7 8 9; do
  cwebp -q 88 -resize 1280 0 -m 6 -sharp_yuv \
        assets/story/originais/$i.png -o assets/story/$i.webp
done
```

1280 px de largura é o suficiente para o cartão do livro num celular retina,
e a qualidade 88 não deixa marca visível nesses desenhos chapados. O livro
inteiro fica em ~780 KB — o jogo cabe todo no cache offline, e PNGs de 1,5 MB
cada estragariam isso.

Os originais ficam **fora do repositório** (estão no `.gitignore`): pesam
13 MB e só servem para converter de novo.

Se acrescentar ou tirar uma página, não esqueça de duas coisas: a lista
`SHELL` do `sw.js` (senão o jogo instalado abre offline com buraco no lugar
da figura) e o `image` da página em `src/game/story.js`.
