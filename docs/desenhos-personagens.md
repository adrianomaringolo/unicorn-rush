# Desenhos dos personagens (páginas de colorir)

Guia para gerar no ChatGPT as páginas da área **🎨 Pintar**: uma ficha de
cada unicórnio e duas cenas por personagem, com os prompts prontos para colar.

O jogo pinta por **toque**: a criança escolhe a cor e toca numa área
fechada, que se enche inteira (ver *Pintar* no README). Então a página só
funciona se o desenho for feito do jeito que o programa entende. As regras
abaixo existem por isso, e não por gosto.

---

## Como o jogo "lê" o desenho (por que as regras existem)

1. Todo pixel **escuro** vira linha, e todo pixel **claro** vira papel. Por
   isso, cinza, sombra e degradê viram linha ou papel de um jeito
   imprevisível.
2. Cada pedaço de papel **cercado de linha por todos os lados** vira uma área
   que se pinta com um toque.
3. Se uma linha tiver uma **brecha**, mesmo de um pixel, as duas áreas viram
   uma só, e a cor vaza.
4. Pedaços **muito pequenos** não pintam e ficam brancos: o brilho do olho,
   os espacinhos entre os traços.
5. Traços soltos, que não fecham nada (pelo de bicho, hachura, folhinha de
   grama, "linhas de movimento"), não criam áreas. Só sujam a página e
   picotam o desenho em pedacinhos.

**A página ideal** tem de 25 a 60 áreas grandes. O personagem fica bem
separado do fundo, com poucos elementos de cenário, também grandes e
fechados.

---

## Como usar

1. Abra uma **conversa nova** no ChatGPT.
2. Cole primeiro o bloco **Regras da página de colorir** (logo abaixo). Ele
   vale para a conversa inteira.
3. Anexe o retrato do personagem (`pintar/referencias/NN-id.png`) e cole o
   prompt de uma das cenas.
4. Para a outra cena do mesmo personagem, continue na mesma conversa: o
   ChatGPT mantém o jeito dele.
5. Antes de salvar, faça a **Conferência** do fim deste arquivo.
6. Salve como `assets/pintar/<id>-<cena>.png` (por exemplo
   `assets/pintar/lua-sonhos.png`) e siga o passo a passo de *Pintar* no
   README: a linha em `DESENHOS` com `personagem: '<id>'`, e o `sw.js`.

Os retratos de `pintar/referencias/` saem do modelo 3D do jogo. Ponha no
prompt que eles são **referência de personagem, não de estilo**: o desenho
final deve ser 2D, fofo e de contorno, nunca low poly.

---

## Regras da página de colorir (cole uma vez no começo da conversa)

```text
Vou te pedir várias páginas de livro de colorir para um jogo infantil (crianças de 3 a 6 anos). A criança pinta tocando numa área, que se enche inteira de cor — como o balde de tinta de um programa de desenho. Por isso, TODA página desta conversa precisa seguir estas regras:

TRAÇO
- Só contorno preto puro (#000) sobre fundo branco puro (#FFF). Nada de cinza, sombra, degradê, hachura, pontilhado, textura ou meio-tom.
- Linha grossa e uniforme, a mesma espessura no desenho todo (cerca de 8 a 12 px numa imagem de 2048 px). Sem traço fino de detalhe e sem linha que afina até sumir.
- Nada preenchido de preto, a não ser a pupila dos olhos. Narinas, boca e cílios são linhas, não manchas.

ÁREAS FECHADAS (o mais importante)
- Toda linha precisa terminar encostando em outra linha. Nenhuma brecha, nenhuma ponta solta, nenhum "quase encosta": ou encosta de verdade, ou fica bem longe.
- Cada parte que a criança vai pintar com uma cor é uma forma fechada: cada mecha da crina e da cauda, cada pena ou grupo de penas da asa, o chifre (com as listras em espiral fechando de lado a lado), o casco, a marca na anca, cada elemento do cenário.
- Nada de traços decorativos soltos: sem pelo, sem fiozinhos na crina, sem folhinhas de grama riscadas, sem linhas de movimento, sem riscos de brilho. Se quiser mostrar brilho ou movimento, use formas fechadas (estrelinhas, gotas, nuvenzinhas, corações).

TAMANHO DAS ÁREAS
- Áreas grandes, fáceis de acertar com o dedo de uma criança pequena. Nenhuma área menor que uma unha num papel A4.
- No total, entre 25 e 60 áreas na página. Melhor poucas e grandes do que muitas e miúdas.
- OLHOS (erro mais comum): cada olho é um contorno FECHADO, uma oval inteira que dá a volta completa em torno do branco do olho, sem abrir embaixo nem dos lados. Dentro dela, a íris como um círculo fechado, a pupila preta e um brilho branco redondo. Os cílios saem POR FORA da oval e não substituem nenhum pedaço do contorno. A pálpebra, se houver, encosta na oval nas duas pontas. Não desenhe o olho como um arco aberto ou uma meia-lua solta.

COMPOSIÇÃO
- O personagem é o protagonista: corpo inteiro, grande, ocupando uns 60% da página, sem nada cortado.
- Contorno externo do personagem bem marcado, separando-o do fundo. Elementos de cenário não atravessam o corpo nem se misturam com a crina.
- Cenário simples, de 4 a 8 elementos grandes (nuvens, flores, árvores, ondas…). Céu e chão podem ficar como fundo branco.
- Margem branca em volta. Sem moldura e sem borda.
- Sem texto, letras, números, assinatura ou marca d'água.

ESTILO
- Desenho 2D fofo de livro infantil: cabeça um pouco grande, olhos grandes e expressivos, formas arredondadas. Nunca 3D, nunca low poly, nunca facetado, nunca realista.
- As imagens que vou anexar são do modelo 3D do jogo: use-as só para saber como é o personagem (crina, chifre, asas, marca na anca, proporções), não para copiar o estilo.
- Personagens originais: não deixe parecido com nenhum personagem de marca conhecida.

FORMATO
- Imagem quadrada, em alta resolução, em PNG.

Responda só "Entendi" agora. Depois eu mando o primeiro personagem.
```

---

## Os personagens

Cada ficha tem quatro partes:
- **quem é**: menino ou menina, idade e tamanho perto dos outros;
- **o que identifica**: o que precisa aparecer no desenho;
- **as cores do jogo**: só para a criança ou o adulto consultarem na hora de
  pintar, porque o desenho sai sem cor;
- **duas cenas**: cada uma com o seu prompt.

Os prompts dizem "o personagem da imagem anexada": anexe o retrato junto.

Os tamanhos comparam com um unicórnio normal da turma. Só a **Lulu é
filhote**. **Chiclete** e **Limão** são jovens e pequenos. **Vovô** é o
mais velho.

### 01. Uni (`uni`)

- **Quem é:** menina, adulta, tamanho normal. É a protagonista. Alegre e
  carinhosa, nasceu na ponta de um arco-íris.
- **O que identifica:**
  - crina e cauda compridas em mechas de arco-íris;
  - olhos grandes com cílios longos;
  - chifre em espiral;
  - asas de penas abertas;
  - um **arco-íris com nuvenzinhas** na anca.
- **Cores do jogo:** corpo branco; mechas rosa, amarela, verde, azul e
  lilás; chifre dourado; olhos azuis; asas lilás e rosa-claro.

**Cena A, "arco-íris"** → `uni-arco-iris.png`
```text
Página de colorir com o personagem da imagem anexada: Uni, uma unicórnia adulta, alegre, de cílios longos, crina e cauda compridas em mechas largas (cada mecha uma forma fechada), chifre em espiral, asas de penas abertas e um arco-íris com nuvenzinhas na anca. Cena: ela galopando por cima de um arco-íris grande de cinco faixas largas, com três nuvens fofas e redondas embaixo e alguns corações grandes voando em volta. Siga as regras da página de colorir desta conversa.
```

**Cena B, "corações no campo"** → `uni-campo.png`
```text
Página de colorir com o personagem da imagem anexada: Uni, uma unicórnia adulta, alegre, de cílios longos, crina e cauda em mechas largas e fechadas, chifre em espiral, asas de penas e um arco-íris na anca. Cena: ela num campo, entregando um coração grande a uma borboleta sorridente, com quatro flores grandes de pétalas redondas no chão e um sol simples no canto. Siga as regras da página de colorir desta conversa.
```

### 02. Sol (`sol`)

- **Quem é:** menino, adulto, tamanho normal. Animado; acorda antes de todo
  mundo para acender o dia.
- **O que identifica:**
  - crina em mechas **pontudas como raios de sol**;
  - asas **pontudas em raios** (não de penas);
  - chifre grosso;
  - um **sol** na anca.
- **Cores do jogo:** corpo creme-dourado; crina laranja e amarela; chifre
  laranja; asas do amarelo ao laranja.

**Cena A, "nascer do sol"** → `sol-amanhecer.png`
```text
Página de colorir com o personagem da imagem anexada: Sol, um unicórnio menino, adulto e animado, com a crina em mechas pontudas como raios de sol (cada ponta uma forma fechada), asas pontudas em raios, chifre grosso e um solzinho na anca. Cena: ele no alto de um morro arredondado, ao amanhecer, com um sol grande nascendo atrás do morro (raios largos e fechados, como triângulos) e três flores grandes se abrindo no chão. Siga as regras da página de colorir desta conversa.
```

**Cena B, "pomar"** → `sol-pomar.png`
```text
Página de colorir com o personagem da imagem anexada: Sol, um unicórnio menino, adulto e animado, com a crina em mechas pontudas como raios de sol, asas pontudas em raios, chifre grosso e um sol na anca. Cena: ele ao lado de uma laranjeira de copa redonda, com cinco laranjas grandes na árvore e uma cesta com laranjas no chão. Siga as regras da página de colorir desta conversa.
```

### 03. Lua (`lua`)

- **Quem é:** menina, adulta, tamanho normal. Calma e sonhadora; sai à
  noite para cuidar dos sonhos de quem dorme.
- **O que identifica:**
  - crina longa e **ondulada**;
  - chifre comprido e fino;
  - asas finas e onduladas, **como um véu** (não de penas);
  - olhar sereno com cílios;
  - uma **lua crescente** na anca.
- **Cores do jogo:** corpo lilás bem claro; crina azul e violeta; chifre
  prateado; asas azul-lavanda.

**Cena A, "na lua"** → `lua-ceu.png`
```text
Página de colorir com o personagem da imagem anexada: Lua, uma unicórnia adulta, calma e sonhadora, de cílios longos, crina longa e ondulada em mechas largas e fechadas, chifre comprido, asas finas e onduladas como um véu e uma lua crescente na anca. Cena: ela sentada em cima de uma lua crescente grande, no céu da noite, com cinco estrelas grandes de cinco pontas e duas nuvens redondas. Siga as regras da página de colorir desta conversa.
```

**Cena B, "guardiã dos sonhos"** → `lua-sonhos.png`
```text
Página de colorir com o personagem da imagem anexada: Lua, uma unicórnia adulta, serena, de crina longa e ondulada, chifre comprido, asas de véu ondulado e uma lua crescente na anca. Cena: ela ao lado de uma cama feita de nuvem, onde um ursinho de pelúcia dorme com um gorro de dormir, e três estrelas grandes e uma bolha de sonho redonda (com um coração dentro) flutuando por cima. Siga as regras da página de colorir desta conversa.
```

### 04. Brasa (`brasa`)

- **Quem é:** menino, adulto, **o maior da turma**. Forte e muito rápido:
  corre tanto que a crina pega fogo.
- **O que identifica:**
  - corpo grande e pernas longas;
  - crina e cauda em **labaredas**;
  - chifre comprido;
  - asas **enormes e pontudas**, como chamas;
  - uma **chama** na anca.
- **Cores do jogo:** corpo cinza-escuro, quase preto; olhos âmbar; fogo
  vermelho, laranja e amarelo.

> Desenho: o corpo escuro do jogo **não** pode virar preenchimento preto. A
> criança pinta.

**Cena A, "vulcão"** → `brasa-vulcao.png`
```text
Página de colorir com o personagem da imagem anexada: Brasa, um unicórnio menino, adulto, grande e forte (o maior da turma), com a crina e a cauda em labaredas (cada labareda uma forma fechada), chifre comprido, asas enormes e pontudas como chamas e uma chama na anca. O corpo fica só em contorno, sem preencher de preto. Cena: ele galopando na frente de um vulcão fofo e arredondado que solta nuvens redondas de fumaça, com três pedras grandes no chão. Siga as regras da página de colorir desta conversa.
```

**Cena B, "fogueira"** → `brasa-fogueira.png`
```text
Página de colorir com o personagem da imagem anexada: Brasa, um unicórnio menino, adulto e grande, com a crina e a cauda em labaredas fechadas, chifre comprido, asas pontudas como chamas e uma chama na anca, sem preencher o corpo de preto. Cena: ele sentado ao lado de uma fogueira de acampamento (três troncos grandes e chamas largas e fechadas), segurando com a boca um graveto com um marshmallow, e algumas estrelas grandes no céu. Siga as regras da página de colorir desta conversa.
```

### 05. Lulu (`lulu`)

- **Quem é:** menina, **filhote (bebê)**, a menorzinha de todas. Todo mundo
  cuida dela. Ainda está aprendendo a voar.
- **O que identifica:**
  - proporções de bebê: **cabeça bem grande**, pernas curtas e
    gordinhas, olhos enormes;
  - **chifre curtinho**;
  - **asinhas pequenas** de penas;
  - crina curta e fofa;
  - um **coração** na anca.
- **Cores do jogo:** branquinha como nuvem; crina em tons pastel bem
  clarinhos (rosa, azul, creme, lilás); coração rosa.

**Cena A, "primeiro voo"** → `lulu-voo.png`
```text
Página de colorir com o personagem da imagem anexada: Lulu, uma unicórnia BEBÊ, bem pequenininha, com a cabeça grande, olhos enormes com cílios, pernas curtas e gordinhas, chifre curtinho, asinhas pequenas de penas batendo, crina curta e fofa e um coração na anca. Cena: ela dando um pulinho de cima de uma pedra redonda, tentando voar, com cara de esforço feliz, três nuvenzinhas redondas e dois coraçõezinhos em volta. Siga as regras da página de colorir desta conversa.
```

**Cena B, "soneca na nuvem"** → `lulu-soneca.png`
```text
Página de colorir com o personagem da imagem anexada: Lulu, uma unicórnia bebê, pequenininha, de cabeça grande, chifre curtinho, asinhas pequenas e um coração na anca. Cena: ela dormindo enroladinha em cima de uma nuvem grande e fofa, de olhos fechados e sorrindo, abraçada a um travesseiro em forma de estrela, com uma lua crescente e três estrelas grandes no céu. Siga as regras da página de colorir desta conversa.
```

### 06. Estrela (`estrela`)

- **Quem é:** menina, adulta, tamanho normal. Brilhante e brincalhona;
  caiu do céu numa noite de agosto e resolveu ficar.
- **O que identifica:**
  - crina comprida e esvoaçante;
  - chifre comprido;
  - asas de penas abertas;
  - cílios longos;
  - uma **estrela grande** na anca.
- **Cores do jogo:** corpo creme claro; crina amarela, branca, azul-clara
  e rosa; chifre amarelo; asas branco-douradas.

**Cena A, "estrela cadente"** → `estrela-cadente.png`
```text
Página de colorir com o personagem da imagem anexada: Estrela, uma unicórnia adulta e brincalhona, de cílios longos, crina comprida e esvoaçante em mechas largas e fechadas, chifre comprido, asas de penas abertas e uma estrela grande na anca. Cena: ela descendo do céu montada numa estrela cadente grande e sorridente, com um rastro feito de três estrelas menores e duas nuvens redondas embaixo. Siga as regras da página de colorir desta conversa.
```

**Cena B, "pula-estrelas"** → `estrela-espaco.png`
```text
Página de colorir com o personagem da imagem anexada: Estrela, uma unicórnia adulta e brincalhona, de crina comprida e esvoaçante, chifre comprido, asas de penas e uma estrela na anca. Cena: ela pulando de uma estrela grande para outra no espaço, com um planeta redondo com anel, uma lua pequena e quatro estrelas grandes de cinco pontas. Siga as regras da página de colorir desta conversa.
```

### 07. Chiclete (`chiclete`)

- **Quem é:** menina, **jovem e pequena** (não é bebê). Risonha; faz bolhas
  do tamanho da cabeça e sai quicando.
- **O que identifica:**
  - cabeça um pouco grande;
  - crina **curta e encaracolada**;
  - chifre curto e grosso;
  - asas de penas;
  - uma **bolinha (bolha)** na anca;
  - quase sempre com uma **bolha de chiclete** saindo da boca.
- **Cores do jogo:** corpo rosa-chiclete; crina rosa, pink e amarelo-clara;
  chifre branco-rosado.

**Cena A, "terra dos doces"** → `chiclete-doces.png`
```text
Página de colorir com o personagem da imagem anexada: Chiclete, uma unicórnia jovem e pequena, risonha, de crina curta e encaracolada (cachos como formas fechadas), chifre curto e grosso, asas de penas e uma bolinha na anca. Cena: ela soprando uma bolha de chiclete grande e redonda, na terra dos doces, com dois pirulitos gigantes em espiral larga, um cupcake grande e três balas embrulhadas no chão. Siga as regras da página de colorir desta conversa.
```

**Cena B, "quicando"** → `chiclete-baloes.png`
```text
Página de colorir com o personagem da imagem anexada: Chiclete, uma unicórnia jovem e pequena, rindo muito, de crina curta e encaracolada, chifre curto, asas de penas e uma bolinha na anca. Cena: ela quicando no ar com as quatro patas para cima, segurando três balões redondos com cordinhas grossas, e duas bolhas de chiclete estourando como estrelas grandes. Siga as regras da página de colorir desta conversa.
```

### 08. Musgo (`musgo`)

- **Quem é:** menino, adulto, um pouco maior que o normal. O mais calmo da
  turma; conhece cada árvore pelo nome, e onde ele cochila nasce uma flor.
- **O que identifica:**
  - crina em mechas que **parecem folhas**;
  - **chifre de madeira**, grosso, com veios em anéis fechados;
  - asas de penas em forma de folha;
  - olhar sereno;
  - uma **folha** na anca.
- **Cores do jogo:** corpo verde-claro; crina em vários verdes; chifre
  marrom de madeira.

**Cena A, "cochilo na árvore"** → `musgo-cochilo.png`
```text
Página de colorir com o personagem da imagem anexada: Musgo, um unicórnio menino, adulto e calmo, com a crina em mechas que parecem folhas (cada uma fechada), chifre grosso de madeira com anéis, asas de penas em forma de folha e uma folha na anca. Cena: ele cochilando deitado debaixo de uma árvore grande de copa redonda, de olhos fechados e sorrindo, com três flores grandes nascendo do chão perto dele e um passarinho na árvore. Siga as regras da página de colorir desta conversa.
```

**Cena B, "na selva"** → `musgo-selva.png`
```text
Página de colorir com o personagem da imagem anexada: Musgo, um unicórnio menino, adulto e sereno, de crina em mechas de folha, chifre grosso de madeira, asas de penas em forma de folha e uma folha na anca. Cena: ele na selva conversando com um sapinho sentado num cogumelo grande, com três folhas gigantes de bananeira atrás e uma flor grande. Siga as regras da página de colorir desta conversa.
```

### 09. Onda (`onda`)

- **Quem é:** menina, adulta, um pouco menor que o normal, esguia e de
  pernas longas. A mais rápida debaixo d'água; adora aparecer de surpresa.
- **O que identifica:**
  - crina e cauda em forma de **ondas enroladas**, com uma mecha diferente
    (coral);
  - chifre comprido e fino;
  - asas finas **como véu**;
  - uma **onda** na anca.
- **Cores do jogo:** corpo verde-água; crina azul-oceano com uma mecha
  rosa-coral; chifre rosa-coral.

**Cena A, "pulo na onda"** → `onda-mar.png`
```text
Página de colorir com o personagem da imagem anexada: Onda, uma unicórnia adulta, esguia e de pernas longas, com a crina e a cauda em forma de ondas enroladas (cada onda uma forma fechada), chifre comprido e fino, asas finas como véu e uma onda na anca. Cena: ela saltando de dentro de uma onda grande enrolada, com três peixinhos sorridentes pulando junto e duas gotas grandes no ar. Siga as regras da página de colorir desta conversa.
```

**Cena B, "fundo do mar"** → `onda-corais.png`
```text
Página de colorir com o personagem da imagem anexada: Onda, uma unicórnia adulta e esguia, de crina em ondas enroladas, chifre comprido, asas de véu e uma onda na anca. Cena: ela nadando no fundo do mar ao lado de uma tartaruga sorridente, com dois corais grandes de galhos grossos, uma estrela-do-mar no chão e quatro bolhas redondas subindo. Siga as regras da página de colorir desta conversa.
```

### 10. Floco (`floco`)

- **Quem é:** menino, adulto, tamanho normal. Sonolento no verão; acorda no
  primeiro dia frio e sopra purpurina de gelo.
- **O que identifica:**
  - crina fofa;
  - chifre comprido;
  - asas de penas;
  - um **floco de neve** na anca.
- **Cores do jogo:** corpo azul-gelo; crina branca e azul-clara; chifre
  branco-azulado.

**Cena A, "primeira neve"** → `floco-neve.png`
```text
Página de colorir com o personagem da imagem anexada: Floco, um unicórnio menino, adulto, com cara de quem acabou de acordar, de crina fofa em mechas largas e fechadas, chifre comprido, asas de penas e um floco de neve na anca. Cena: ele saindo de um monte de neve arredondado, espreguiçando, ao lado de um boneco de neve de cachecol, com cinco flocos de neve grandes e simples (seis pontas grossas) caindo. Siga as regras da página de colorir desta conversa.
```

**Cena B, "deslizando no gelo"** → `floco-gelo.png`
```text
Página de colorir com o personagem da imagem anexada: Floco, um unicórnio menino, adulto, de crina fofa, chifre comprido, asas de penas e um floco de neve na anca. Cena: ele deslizando feliz num lago congelado de formato oval, com dois pinheiros nevados (copa em três camadas grandes) e três flocos de neve grandes no ar. Siga as regras da página de colorir desta conversa.
```

### 11. Coco (`coco`)

- **Quem é:** menino, adulto, tamanho normal. Dormiu tanto debaixo do
  coqueiro que ficou da cor da casca; conhece o lugar onde a onda faz mais
  espuma.
- **O que identifica:**
  - crina em mechas que lembram **folhas de coqueiro**;
  - chifre grosso;
  - asas de penas;
  - uma **concha** na anca.
- **Cores do jogo:** corpo marrom de casca de coco; asas verdes e creme;
  chifre creme; concha rosa.

**Cena A, "debaixo do coqueiro"** → `coco-coqueiro.png`
```text
Página de colorir com o personagem da imagem anexada: Coco, um unicórnio menino, adulto e tranquilo, com a crina em mechas que lembram folhas de coqueiro (cada uma fechada), chifre grosso, asas de penas e uma concha na anca. Cena: ele cochilando na areia debaixo de um coqueiro com quatro folhas grandes e três cocos, com o mar ao fundo em duas ondas largas e um sol simples. Siga as regras da página de colorir desta conversa.
```

**Cena B, "castelo de areia"** → `coco-praia.png`
```text
Página de colorir com o personagem da imagem anexada: Coco, um unicórnio menino, adulto, de crina em mechas de folha de coqueiro, chifre grosso, asas de penas e uma concha na anca. Cena: ele na praia ao lado de um castelo de areia de três torres, com um baldinho, uma pá e três conchas grandes na areia. Siga as regras da página de colorir desta conversa.
```

### 12. Cometa (`cometa`)

- **Quem é:** menino, adulto, um pouco maior, de pernas bem longas e
  cabeça menor. Não sabe parar: está atravessando o céu desde que nasceu.
  Quem o acompanha ganha um pedido.
- **O que identifica:**
  - corpo esguio de corredor;
  - chifre **bem comprido** e fino;
  - asas **pontudas em raios**;
  - crina esvoaçando para trás;
  - um **cometa** na anca.
- **Cores do jogo:** corpo azul-anil escuro; crina azul-gelo, rosa, lilás
  e amarela; chifre azul-gelo.

> Desenho: o corpo escuro não vira preenchimento preto.

**Cena A, "atravessando o espaço"** → `cometa-espaco.png`
```text
Página de colorir com o personagem da imagem anexada: Cometa, um unicórnio menino, adulto, esguio e de pernas longas, com chifre bem comprido e fino, asas pontudas em raios, crina esvoaçando para trás em mechas fechadas e um cometa na anca; corpo só em contorno, sem preencher de preto. Cena: ele voando no espaço com um rastro de cometa largo atrás dele (formado por três faixas fechadas), passando por um planeta com anel, um foguetinho e quatro estrelas grandes. Siga as regras da página de colorir desta conversa.
```

**Cena B, "faça um pedido"** → `cometa-pedido.png`
```text
Página de colorir com o personagem da imagem anexada: Cometa, um unicórnio menino, adulto e esguio, de chifre bem comprido, asas pontudas em raios, crina esvoaçante e um cometa na anca, sem preencher o corpo de preto. Cena: ele passando no céu da noite por cima de uma casinha com telhado e janela redonda iluminada, com uma lua crescente e cinco estrelas grandes. Siga as regras da página de colorir desta conversa.
```

### 13. Cereja (`cereja`)

- **Quem é:** menina, adulta, um pouco menor que o normal. Não anda, desvia:
  troca de pista duas vezes antes da poeira assentar.
- **O que identifica:**
  - crina **verde em mechas** como o cabinho e as folhas da cereja;
  - chifre;
  - asas **pontudas em raios**;
  - olhos grandes;
  - uma **bolinha** na anca, como uma cereja.
- **Cores do jogo:** corpo vermelho-cereja; crina verde; chifre creme; asas
  rosa e vermelhas.

**Cena A, "o desvio"** → `cereja-parque.png`
```text
Página de colorir com o personagem da imagem anexada: Cereja, uma unicórnia adulta, ágil e espevitada, com a crina em mechas largas como folhas de cereja (cada uma fechada), chifre, asas pontudas em raios, olhos grandes e uma bolinha na anca. Cena: ela dando um salto de lado no parque, desviando de dois cones grandes, com um carrossel simples ao fundo (telhado em gomos largos e um cavalinho) e duas nuvenzinhas de poeira redondas nos cascos. Siga as regras da página de colorir desta conversa.
```

**Cena B, "bolo de cereja"** → `cereja-bolo.png`
```text
Página de colorir com o personagem da imagem anexada: Cereja, uma unicórnia adulta, sorridente, de crina em mechas como folhas de cereja, chifre, asas pontudas em raios e uma bolinha na anca. Cena: ela ao lado de um bolo grande de dois andares, com cobertura escorrendo em gotas largas e três cerejas em cima, e uma cesta de cerejas no chão. Siga as regras da página de colorir desta conversa.
```

### 14. Limão (`limao`)

- **Quem é:** menino, **jovem e pequeno**, o menor depois da Lulu. Não para
  quieto um segundo e pula mais alto que todos.
- **O que identifica:**
  - cabeça um pouco grande e olhos grandes;
  - crina espetadinha;
  - chifre curto;
  - **asinhas pequenas e pontudas**;
  - um **raio** na anca.
- **Cores do jogo:** corpo amarelo-limão; crina verde-limão, amarela e
  branca; chifre creme.

**Cena A, "o pulo"** → `limao-pulo.png`
```text
Página de colorir com o personagem da imagem anexada: Limão, um unicórnio menino, jovem e pequeno, agitado e feliz, de cabeça um pouco grande, olhos grandes, crina espetadinha em mechas fechadas, chifre curto, asinhas pequenas e pontudas e um raio na anca. Cena: ele no meio de um pulo bem alto por cima de uma poça redonda, com três estrelinhas grandes de "estalinho" em volta e um limoeiro de copa redonda com quatro limões ao lado. Siga as regras da página de colorir desta conversa.
```

**Cena B, "frutas gigantes"** → `limao-frutas.png`
```text
Página de colorir com o personagem da imagem anexada: Limão, um unicórnio menino, jovem e pequeno, de crina espetadinha, chifre curto, asinhas pontudas e um raio na anca. Cena: ele pulando entre frutas gigantes no chão — uma melancia em fatia, um limão inteiro e uma pera, todas maiores que ele — com uma borboleta voando. Siga as regras da página de colorir desta conversa.
```

### 15. Violeta (`violeta`)

- **Quem é:** menina, adulta, tamanho normal. Meio feita de fumaça: quando
  salta, demora para descer, como se o ar a segurasse.
- **O que identifica:**
  - crina comprida que **se desfaz em volutas de fumaça** (formas
    fechadas, enroladas);
  - chifre comprido;
  - asas finas **como véu**;
  - olhos grandes;
  - uma **estrela** na anca.
- **Cores do jogo:** corpo roxo; crina lilás, roxa e branca; chifre lilás
  claro.

**Cena A, "flutuando"** → `violeta-flutua.png`
```text
Página de colorir com o personagem da imagem anexada: Violeta, uma unicórnia adulta, leve e sonhadora, de olhos grandes, com a crina comprida terminando em volutas de fumaça enroladas (cada volta uma forma fechada), chifre comprido, asas finas como véu e uma estrela na anca. Cena: ela flutuando no meio de um pulo, bem devagar, entre quatro nuvens de névoa redondas e enroladas, com duas estrelas grandes. Siga as regras da página de colorir desta conversa.
```

**Cena B, "bosque da bruma"** → `violeta-bruma.png`
```text
Página de colorir com o personagem da imagem anexada: Violeta, uma unicórnia adulta, de crina em volutas de fumaça, chifre comprido, asas de véu e uma estrela na anca. Cena: ela num bosque de névoa, ao lado de três cogumelos grandes de chapéu redondo com bolinhas grandes, e uma faixa de névoa enrolada e fechada passando no chão. Siga as regras da página de colorir desta conversa.
```

### 16. Cristal (`cristal`)

- **Quem é:** menina, adulta, tamanho normal, de pernas longas.
  Transparente como uma janela de gelo: o arco-íris passa por dentro dela
  quando o sol bate de lado.
- **O que identifica:**
  - chifre **bem comprido**, liso;
  - crina em mechas **lapidadas como pedras preciosas** (formas
    geométricas grandes);
  - asas **como véu**;
  - um **diamante** na anca.
- **Cores do jogo:** corpo azul quase branco; crina azul-gelo e branca;
  chifre branco; diamante azul.

> Desenho: "transparente" não dá para fazer em contorno. Peça só as facetas
> grandes na crina.

**Cena A, "caverna de cristais"** → `cristal-caverna.png`
```text
Página de colorir com o personagem da imagem anexada: Cristal, uma unicórnia adulta, elegante e de pernas longas, com chifre bem comprido e liso, crina em mechas lapidadas como pedras preciosas (poucas facetas grandes, cada uma fechada), asas finas como véu e um diamante na anca. Cena: ela numa caverna, ao lado de quatro cristais grandes saindo do chão, com a entrada da caverna em arco ao fundo e duas pedras redondas. Siga as regras da página de colorir desta conversa.
```

**Cena B, "arco-íris no gelo"** → `cristal-lago.png`
```text
Página de colorir com o personagem da imagem anexada: Cristal, uma unicórnia adulta e elegante, de chifre bem comprido, crina lapidada em facetas grandes, asas de véu e um diamante na anca. Cena: ela de pé à beira de um lago congelado oval, com um arco-íris de cinco faixas largas no céu e um sol simples, e três pedras de gelo arredondadas. Siga as regras da página de colorir desta conversa.
```

### 17. Vovô (`vovo`)

- **Quem é:** menino, **o mais velho da turma** (um vovô), grande. Já
  correu em todas as pistas, algumas antes de terem nome. Não desvia
  rápido, mas sabe tudo.
- **O que identifica:**
  - crina e **barbicha brancas**;
  - olhar sábio e gentil, de olhos menores;
  - chifre grosso;
  - asas **grandes** de penas;
  - um **cometa** na anca.
- **Cores do jogo:** corpo cinza; crina toda branca e prateada; chifre
  prata.

**Cena A, "o vilarejo"** → `vovo-vilarejo.png`
```text
Página de colorir com o personagem da imagem anexada: Vovô, um unicórnio idoso e gentil, o avô da turma, grande, com a crina e uma barbicha brancas em mechas largas e fechadas, olhar sábio e sorridente, chifre grosso, asas grandes de penas e um cometa na anca. Cena: ele caminhando por uma rua do vilarejo, entre duas casinhas de telhado triangular e porta redonda, com um poste de luz e uma árvore redonda. Siga as regras da página de colorir desta conversa.
```

**Cena B, "o mapa"** → `vovo-mapa.png`
```text
Página de colorir com o personagem da imagem anexada: Vovô, um unicórnio idoso e sábio, com crina e barbicha brancas, chifre grosso, asas grandes de penas e um cometa na anca. Cena: ele sentado numa pedra grande no campo, olhando um mapa aberto (com uma estrada sinuosa larga e três desenhos simples: uma montanha, uma árvore e uma estrela, sem texto), com duas flores grandes ao lado. Siga as regras da página de colorir desta conversa.
```

### 18. Sombra (`sombra`)

- **Quem é:** menino, adulto, um pouco maior que o normal. Preto de
  verdade, mas brilha por conta própria; nunca corre no escuro.
- **O que identifica:**
  - asas **de morcego** (membrana com dedos, não penas);
  - chifre comprido;
  - olhos grandes e brilhantes;
  - uma **lua crescente** na anca.
- **Cores do jogo:** corpo preto; crina roxa e anil; olhos e chifre lilás.

> Desenho: **muito importante**: o corpo preto do jogo **não** pode virar
> preenchimento preto, senão a página fica sem área para pintar. Desenhe só
> o contorno. O brilho dele vira estrelinhas fechadas em volta.

**Cena A, "caverna"** → `sombra-caverna.png`
```text
Página de colorir com o personagem da imagem anexada: Sombra, um unicórnio menino, adulto, misterioso mas simpático, com asas de morcego (membrana em gomos largos, cada gomo fechado), chifre comprido, olhos grandes e brilhantes, crina em mechas fechadas e uma lua crescente na anca. IMPORTANTE: o corpo dele é preto no jogo, mas aqui fica só em contorno, nada preenchido de preto. Cena: ele numa caverna, com três morceguinhos fofos voando, dois cristais grandes no chão e quatro estrelinhas fechadas brilhando em volta dele. Siga as regras da página de colorir desta conversa.
```

**Cena B, "lua cheia"** → `sombra-lua.png`
```text
Página de colorir com o personagem da imagem anexada: Sombra, um unicórnio menino, adulto, com asas de morcego, chifre comprido, olhos grandes e uma lua crescente na anca, só em contorno, sem preenchimento preto. Cena: ele no alto de um morro arredondado olhando uma lua cheia enorme, com uma coruja numa árvore sem folhas de galhos grossos e três estrelas grandes. Siga as regras da página de colorir desta conversa.
```

### 19. Relâmpago (`relampago`)

- **Quem é:** menino, adulto, tamanho normal. Nasceu no talho de um raio,
  numa noite de tempestade; o vento não o desvia nem um pouco.
- **O que identifica:**
  - crina em mechas **em zigue-zague**;
  - chifre em espiral;
  - asas **pontudas em raios**;
  - olhos amarelos e determinados;
  - um **raio** na anca.
- **Cores do jogo:** corpo azul-acinzentado escuro; crina amarela, branca e
  azul-clara; chifre amarelo.

> Desenho: o corpo escuro não vira preenchimento preto.

**Cena A, "cortando a tempestade"** → `relampago-tempestade.png`
```text
Página de colorir com o personagem da imagem anexada: Relâmpago, um unicórnio menino, adulto e determinado, com a crina em mechas em zigue-zague (cada uma fechada), chifre em espiral, asas pontudas em raios e um raio na anca; corpo só em contorno, sem preencher de preto. Cena: ele galopando reto no meio de uma tempestade, entre três nuvens grandes e redondas, com dois raios largos (forma de zigue-zague fechada) e quatro gotas de chuva grandes. Siga as regras da página de colorir desta conversa.
```

**Cena B, "na nuvem"** → `relampago-nuvem.png`
```text
Página de colorir com o personagem da imagem anexada: Relâmpago, um unicórnio menino, adulto, de crina em zigue-zague, chifre em espiral, asas pontudas em raios e um raio na anca, sem preenchimento preto. Cena: ele de pé, orgulhoso, em cima de uma nuvem grande e fofa, com um raio largo saindo da nuvem e um arco-íris pequeno de três faixas largas aparecendo do outro lado. Siga as regras da página de colorir desta conversa.
```

### 20. Pipoca (`pipoca`)

- **Quem é:** menino, adulto, tamanho normal. Mora onde a música nunca
  para, entre o carrossel do Parque e as ruas do Vilarejo; onde ele passa
  cheira a manteiga.
- **O que identifica:**
  - crina em **tufos redondos como pipocas**;
  - chifre com **listras como um saquinho de pipoca**;
  - asas de penas;
  - uma **estrela** na anca.
- **Cores do jogo:** corpo creme; crina branca, amarela e com tufos
  vermelhos; chifre vermelho.

**Cena A, "carrossel"** → `pipoca-carrossel.png`
```text
Página de colorir com o personagem da imagem anexada: Pipoca, um unicórnio menino, adulto, festeiro e sorridente, com a crina em tufos redondos como pipocas (cada tufo fechado), chifre com listras largas como um saquinho de pipoca, asas de penas e uma estrela na anca. Cena: ele na frente de um carrossel simples (telhado em gomos largos, dois cavalinhos), com três balões redondos e duas notas musicais grandes no ar. Siga as regras da página de colorir desta conversa.
```

**Cena B, "balde de pipoca"** → `pipoca-balde.png`
```text
Página de colorir com o personagem da imagem anexada: Pipoca, um unicórnio menino, adulto, de crina em tufos de pipoca, chifre listrado, asas de penas e uma estrela na anca. Cena: ele ao lado de um balde de pipoca gigante, com listras largas e pipocas grandes transbordando, algumas pipocas voando e dois corações no ar. Siga as regras da página de colorir desta conversa.
```

### 21. Pérola (`perola`)

- **Quem é:** menina, adulta, tamanho normal. Cresceu dentro de uma concha
  no fundo do mar; enxerga onde ninguém enxerga e acha chaves mágicas
  escondidas.
- **O que identifica:**
  - crina ondulada **com pérolas redondas** presas;
  - chifre comprido;
  - asas finas **como véu**;
  - uma **concha** na anca.
- **Cores do jogo:** corpo branco-perolado; crina em tons pastel (rosa, azul,
  lilás, verde-água).

**Cena A, "a concha"** → `perola-concha.png`
```text
Página de colorir com o personagem da imagem anexada: Pérola, uma unicórnia adulta, delicada, de crina ondulada em mechas fechadas enfeitada com pérolas redondas grandes, chifre comprido, asas finas como véu e uma concha na anca. Cena: ela saindo de dentro de uma concha gigante aberta no fundo do mar, com quatro bolhas redondas subindo, uma alga de folhas largas e uma estrela-do-mar. Siga as regras da página de colorir desta conversa.
```

**Cena B, "a chave escondida"** → `perola-chave.png`
```text
Página de colorir com o personagem da imagem anexada: Pérola, uma unicórnia adulta, de crina ondulada com pérolas, chifre comprido, asas de véu e uma concha na anca. Cena: ela achando uma chave mágica grande (com a ponta em forma de coração) escondida entre duas algas e três conchas no fundo do mar, com um peixinho curioso olhando. Siga as regras da página de colorir desta conversa.
```

### 22. Eco (`eco`)

- **Quem é:** menino, adulto, tamanho normal. Era invisível e só a alegria o
  deixava visível. Esperou sozinho numa torre até a Uni encontrá-lo; agora
  nunca corre sozinho, porque o eco dele corre ao lado.
- **O que identifica:**
  - crina suave e ondulada;
  - chifre;
  - asas finas **como véu**;
  - expressão tímida e feliz;
  - um **coração** na anca;
  - às vezes, uma **segunda figura igual** a ele (o eco).

> Desenho: não peça "transparente" nem "contorno tracejado". Linha
> tracejada é brecha, e a cor vaza. O eco é só uma cópia menor, desenhada
> normal.

**Cena A, "a torre"** → `eco-torre.png`
```text
Página de colorir com o personagem da imagem anexada: Eco, um unicórnio menino, adulto, com expressão tímida e feliz, crina suave e ondulada em mechas fechadas, chifre, asas finas como véu e um coração na anca. Cena: ele olhando pela janela redonda e grande de uma torre de pedra (pedras grandes, cada uma fechada), sorrindo, com corações e estrelas grandes saindo da janela e duas nuvens em volta. Siga as regras da página de colorir desta conversa.
```

**Cena B, "nunca mais sozinho"** → `eco-amigos.png`
```text
Página de colorir com o personagem da imagem anexada: Eco, um unicórnio menino, adulto e feliz, de crina suave e ondulada, chifre, asas de véu e um coração na anca. Cena: ele correndo num campo e, logo atrás, o "eco" dele — uma segunda figura igualzinha a ele, um pouco menor, desenhada com a mesma linha contínua (não tracejada) —, os dois sorrindo, com três corações e duas flores grandes. Siga as regras da página de colorir desta conversa.
```

---

## Conferência antes de salvar

Abra a imagem grande e confira:

- [ ] **Linhas fechadas.** Siga com o olho o contorno da crina, das asas, do
  chifre e de cada elemento do cenário. Procure brechas, principalmente onde
  uma mecha encontra a cabeça e onde a asa encontra o corpo.
- [ ] **Só preto e branco**, sem cinza, sombra, degradê ou hachura.
- [ ] **Nada preenchido de preto**, a não ser as pupilas. Cuidado com
  Brasa, Cometa, Sombra e Relâmpago, que têm o corpo escuro no jogo.
- [ ] **Olhos fechados**: o contorno de cada olho dá a volta inteira no
  branco. Brecha pequena, de poucos pixels, o jogo fecha sozinho; arco
  aberto pela metade, não.
- [ ] **Sem traço solto**: pelo, fiozinho, linha de movimento, grama
  riscada.
- [ ] **Sem área minúscula**: nada menor que a ponta de um dedo na tela do
  celular.
- [ ] **Sem texto** e sem assinatura.
- [ ] O personagem **é reconhecível**: a marca da anca certa, o tipo de asa
  (penas, raios, véu ou morcego), o chifre e o tamanho certo (Lulu bebê,
  Brasa grande).
- [ ] Não ficou parecido com personagem de marca conhecida.

## Pedidos de correção (cole na mesma conversa)

- **Vazou / brecha:**
  *"Feche todas as linhas: em volta da crina (onde ela encontra a cabeça),
  das asas e do chifre há linhas que não encostam. Mantenha o resto
  igual."*
- **Detalhe demais:**
  *"Simplifique: menos linhas por dentro, áreas maiores, no máximo 50
  áreas, contorno mais grosso. Tire os fiozinhos da crina e os traços
  soltos."*
- **Olho aberto (o branco do olho não fecha):**
  *"Os olhos estão abertos: o contorno do branco do olho não dá a volta
  inteira. Redesenhe cada olho como uma oval fechada completa, com a íris e
  a pupila dentro e os cílios por fora. Mantenha o resto igual."*
- **Saiu com cinza ou sombra:**
  *"Refaça só com contorno preto puro sobre branco puro, sem nenhum cinza,
  sombra ou preenchimento."*
- **Corpo preenchido de preto:**
  *"O corpo deve ficar branco, só com o contorno preto. Nada preenchido de
  preto além das pupilas."*
- **Estilo 3D ou low poly:**
  *"A imagem anexada é só referência do personagem. Quero desenho 2D fofo de
  livro de colorir, com formas arredondadas, sem facetas."*
- **Personagem pequeno demais:**
  *"Aumente o personagem para ocupar uns 60% da página e diminua o
  cenário."*

## Depois de salvar

- **Tamanho do arquivo.** O PNG do ChatGPT costuma ter mais de 1 MB. Antes
  de pôr no jogo, converta para tons de cinza e otimize (o
  as páginas caíram de ~1,5 MB para ~350 KB, em 16 tons de cinza com o `pngquant`). O que importa é ter
  de 1000 a 2000 px no lado maior.
- **Teste no jogo.** Toque em cada área e confira que ela pinta inteira e
  não vaza. Se uma parte grande se pinta junto com a vizinha, há uma brecha.
