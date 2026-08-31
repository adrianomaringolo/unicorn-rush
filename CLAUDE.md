# UnicornRush — instruções do projeto

## Versão: subir a cada commit

**Todo commit que muda o jogo tem de subir a versão.** Ela aparece no cartão
*Sobre*, dentro do jogo, e é assim que se sabe o que está instalado no
aparelho de uma criança quando algo não bate.

Não edite os números à mão — use o script, que mexe nos três lugares de uma
vez:

```bash
npm run bump              # 0.2.0 → 0.2.1   (correção, ajuste, conteúdo pequeno)
npm run bump -- minor     # 0.2.1 → 0.3.0   (personagem, pista, mecânica nova)
npm run bump -- major     # 0.3.0 → 1.0.0   (mudança grande de como se joga)
npm run bump -- 1.4.2     # exatamente essa
```

Os três lugares que ele mantém em sincronia:

| Arquivo | Para quê |
| --- | --- |
| `src/game/version.js` | o número que o cartão *Sobre* mostra |
| `package.json` | a versão do pacote |
| `sw.js` | o nome do cache offline |

O `sw.js` é o mais importante dos três: **o nome do cache carrega a versão**,
e é a troca dele que faz o aparelho de quem já jogou descartar os arquivos
antigos. Sem subir a versão, quem já abriu o jogo continua com o código
velho, mesmo depois de um deploy novo — e um arquivo quebrado que entre no
cache fica preso até a versão mudar.

O script recusa a subir se os três arquivos estiverem em versões diferentes:
é melhor falhar do que deixar um deles para trás.

## Ordem de trabalho

Rode `npm run check` antes de considerar qualquer mudança pronta — ele monta
todos os modelos e simula as fases fora do navegador. Para ver na tela,
`npm start` e abrir `http://localhost:5173`.

O resto (arquitetura, como inventar personagem e pista, atalhos de teste no
console) está no `README.md`.
