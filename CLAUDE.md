# UnicornRush — instruções do projeto

## Versão: subir a cada commit

**Todo commit que muda o jogo tem de subir a versão.** Ela aparece no cartão
*Sobre*, dentro do jogo, e é assim que se sabe o que está instalado no
aparelho de uma criança quando algo não bate.

Não edite os números à mão — use o script, que mexe nos quatro lugares de uma
vez:

```bash
npm run bump              # 0.2.0 → 0.2.1   (correção, ajuste, conteúdo pequeno)
npm run bump -- minor     # 0.2.1 → 0.3.0   (personagem, pista, mecânica nova)
npm run bump -- major     # 0.3.0 → 1.0.0   (mudança grande de como se joga)
npm run bump -- 1.4.2     # exatamente essa
```

Os quatro lugares que ele mantém em sincronia:

| Arquivo | Para quê |
| --- | --- |
| `src/game/version.js` | o número que o cartão *Sobre* mostra |
| `package.json` | a versão do pacote |
| `sw.js` | o nome do cache offline |
| `index.html` | o número no pé da tela de carregamento |

O `sw.js` é o mais importante deles: **o nome do cache carrega a versão**,
e é a troca dele que faz o aparelho de quem já jogou descartar os arquivos
antigos. Sem subir a versão, quem já abriu o jogo continua com o código
velho, mesmo depois de um deploy novo — e um arquivo quebrado que entre no
cache fica preso até a versão mudar.

O script recusa a subir se os arquivos estiverem em versões diferentes:
é melhor falhar do que deixar um deles para trás.

## Ícones: nunca emoji do aparelho

O jogo **não mostra emoji do sistema** — só os ícones da nossa coleção, em
`assets/icones/`, desenhados por código em `scripts/icones/` (contorno
roxo, gradiente e reflexo de bala de goma). Emoji do aparelho muda de cara
em cada celular e vira quadradinho nos antigos.

No código o texto continua escrito com o emoji (`t('🎀 Enfeites')`), e o
`withIcons()` de `src/game/icons.js` troca pela imagem na hora de
desenhar. Então, **sempre que um emoji novo entrar em algo que aparece na
tela** (texto, botão, toast, o `emoji` de um personagem, pista, power-up,
enfeite…):

1. confira se ele já está na tabela `ARQUIVOS` de `src/game/icons.js`;
2. se não estiver, **desenhe o ícone** em `scripts/icones/` — pode partir do
   emoji como referência, mas no estilo da coleção, usando o kit de
   `base.mjs` —, rode `node scripts/icones/gerar.mjs folha.html` e confira
   na folha de prova (grande e em 28px);
3. acrescente a linha em `ARQUIVOS` e o arquivo novo na lista do `sw.js`.

Não use emoji que não tenha ícone, nem deixe para depois: o
`npm run check` falha quando encontra um emoji sem desenho próprio.

## Ordem de trabalho

Rode `npm run check` antes de considerar qualquer mudança pronta — ele monta
todos os modelos e simula as fases fora do navegador. Para ver na tela,
`npm start` e abrir `http://localhost:5173`.

O resto (arquitetura, como inventar personagem e pista, atalhos de teste no
console) está no `README.md`.

## Desenho novo de pintar: sempre conferir

**Toda vez que entrar um desenho novo de pintar, ou um PNG for trocado**
(em `assets/pintar/`, vindo de `~/Downloads/desenhos` ou de onde for), monte
o gabarito e **confira a página pintada por números antes de dar por
pronto**. A receita de instalar e montar o gabarito está no README, em
"Pintar". A conferência é esta:

1. `npm run check` — o gabarito fecha (toda área uma vez, nenhuma tinta
   inventada).
2. `node scripts/conferir-pintura.mjs <id> …` — pinta cada página inteira
   com o gabarito (já com as áreas miúdas automáticas) em `_conferencia/`
   e avisa sozinho de papel sem cor, vazamento e paleta grande demais.
   Resolva todo ⚠️ (brecha no contorno se fecha no PNG; nunca deixe ponto
   branco puro). Os "(confira)" são para olhar, não necessariamente erro.
3. **Olhe cada `_conferencia/<id>.png` de verdade**, inteira e com recortes
   ampliados (olhos, crina, flores, detalhes pequenos). Procure:
   - área sem cor ou branca demais onde devia ter cor;
   - cor no lugar errado (céu verde, folha azul, a mecha que ficou da cor
     do corpo, uma pétala de outra flor);
   - fundo aparecendo entre a cauda e a perna pintado como mecha (é fundo);
   - olhos: parte de fora `branco`, pupila na cor do olho do personagem,
     brilho `branco`;
   - vizinhas que deviam ser diferentes e ficaram da mesma cor.
4. Corrija o gabarito, rode de novo os passos 1 a 3 e só então conte ao
   usuário, dizendo o que a conferência achou e o que foi corrigido.
