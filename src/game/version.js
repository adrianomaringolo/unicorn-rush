// A versão do jogo, num lugar só.
//
// Aparece no cartão "Sobre" e dá nome ao cache do service worker. Não é lida
// do `package.json` de propósito: o jogo roda sem build, e buscar um JSON só
// para mostrar um número custaria uma requisição na abertura.
//
// Para subir a versão use `npm run bump` — ele mexe nos três lugares de uma
// vez (aqui, no `package.json` e no `sw.js`), que é o que impede de um deles
// ficar para trás.
export const VERSION = '0.27.9';
