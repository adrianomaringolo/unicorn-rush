# Checklist para publicar o UnicornRush na Play Store

Rascunho de trabalho, não documentação do jogo em si — por isso mora em
`docs/`, fora do `README.md`. A ordem das seções é a ordem recomendada:
validar antes de empacotar, empacotar antes de preparar a ficha da loja.

## 1. Validar antes de investir tempo no resto

- [ ] Criar uma faixa de **teste fechado** no Play Console — é pré-requisito
      do Google antes de liberar a faixa de produção (mínimo 12 testadores,
      por 14 dias corridos).
- [ ] Recrutar pais e crianças de verdade para o teste, não só quem já
      trabalhou no projeto.
- [ ] Acompanhar, durante o teste: retenção (volta no dia seguinte?), tempo
      médio de sessão, taxa de desinstalação. Isso conta mais do que "achar"
      que ficou bom.
- [ ] Ler avaliações de jogos parecidos (corrida infantil, unicórnio, "baby
      games") na própria Play Store, para achar as reclamações recorrentes
      **antes** de publicar, não depois.

## 2. Privacidade e a política "Designed for Families"

Por ser um app voltado a crianças, esta seção é a mais rígida — vale
resolver antes de gastar tempo com arte da ficha da loja.

- [ ] Escrever e publicar uma **Política de Privacidade** com URL própria — é
      campo obrigatório no Play Console e **não existe nenhum arquivo do
      tipo no repositório hoje**. Rascunho do conteúdo: o jogo não tem
      conta, não pede nome de verdade, guarda tudo em `localStorage` no
      próprio aparelho (perfis, progresso, escolhas — ver
      `src/game/storage.js`), não vende nem compartilha dado nenhum, e usa
      o Vercel Web Analytics (ver item abaixo).
- [ ] Decidir o que fazer com o `@vercel/analytics` (injetado em
      `src/main.js`, linha 12) — o programa "Designed for Families" só
      permite SDKs de terceiros que estejam na lista de parceiros
      certificados da própria Google. Conferir se o Vercel Analytics está
      nessa lista antes de submeter; se não estiver, é tirar do bundle
      empacotado (a versão web/PWA pode continuar com ele).
- [ ] Preencher o formulário **Segurança de dados** (Data Safety) do Play
      Console, mapeando o que é de fato coletado: hoje, nada de
      identificável — só page views agregados, se o Analytics acima
      continuar ligado.
- [ ] Responder o questionário de **classificação de conteúdo** (IARC): sem
      violência, sem chat, sem conteúdo gerado por outros usuários, sem
      compra com dinheiro real.
- [ ] Preencher a seção **Target audience and content** do Play Console:
      selecionar a faixa etária das crianças, e confirmar que o app não tem
      anúncios, links externos, nem rede social nenhuma — os `🔑` (chaves
      mágicas) são moeda só de dentro do jogo, ganha jogando, nunca comprada
      (ver `Game.buyItem` e a loja em `README.md` → "A loja").
- [ ] Revisar o campo de **nome do perfil** — é texto livre, editável pela
      criança ou pelo adulto (ver `README.md` → "Perfis: mais de uma
      criança no mesmo aparelho") — e confirmar, na política de
      privacidade, que ele nunca sai do aparelho.

## 3. Empacotar como app Android

- [ ] Seguir o caminho já documentado em `README.md` → "Virar app Android"
      → opção 2 (Capacitor) — script de build, `cap init`, `cap add
      android`.
- [ ] Trocar o `applicationId` de exemplo do README
      (`com.seudominio.unicornrush`) por um de verdade, no domínio próprio.
- [ ] **Decidir a orientação de tela** — o `manifest.webmanifest` está como
      `"orientation": "any"`, mas a nota do próprio README sugere travar em
      `landscape` no app empacotado. Isso está em tensão com o jogo de
      hoje, que tem ajustes de layout dedicados **para os dois formatos**
      (HUD, toasts, controles de toque — ver `style.css` e o histórico de
      commits sobre responsividade em pé vs. deitado). Testar os dois no
      app empacotado, num aparelho de verdade, antes de travar um só.
- [ ] Confirmar que o service worker (`sw.js`) fica **desligado** dentro do
      wrapper nativo, como o README já pede — os arquivos já estão
      embutidos no APK/AAB, e o cache do `sw.js` só atrapalha atualização.
- [ ] Gerar um `.aab` (Android App Bundle) — a Play Store não aceita mais
      `.apk` para apps novos.
- [ ] Testar em pelo menos **um aparelho Android físico**, não só emulador
      (vibração, por exemplo — ver `src/game/haptics.js` — não aparece em
      emulador).

## 4. Assinatura e versão

- [ ] Gerar a keystore de upload e guardá-la em lugar seguro — perdê-la
      trava qualquer atualização futura do app.
- [ ] Ativar o **Play App Signing**.
- [ ] Manter o `versionCode`/`versionName` do Android em sincronia com
      `src/game/version.js` a cada `npm run bump` (ver `CLAUDE.md`).

## 5. Ficha da loja (Store Listing)

- [ ] Ícone 512×512 — já existe (`assets/icons/icon-512.png`), e a versão
      "maskable" também (`icon-maskable-512.png`).
- [ ] **Gráfico de destaque** (feature graphic), 1024×500 — não existe
      ainda, precisa ser criado do zero.
- [ ] Screenshots de celular — `docs/prints/` tem seis capturas das pistas
      (`1-campo.png` a `6-noite.png`), mas foram tiradas para o README, não
      para a loja: conferir se o tamanho bate com o exigido (mínimo 320px
      no lado menor, máximo 3840px no maior, proporção entre 16:9 e 9:16) e
      se mostram o jogo em pé — que é o formato mais usado hoje.
- [ ] Descrição curta (até 80 caracteres) e completa (até 4000) — o
      `manifest.webmanifest` já tem uma descrição base nos dois idiomas
      (pt-BR / en-US) para partir dali.
- [ ] Título do app e conta de desenvolvedor no Play Console (taxa única de
      registro, se ainda não existir uma).

## 6. Depois de publicado

- [ ] Acompanhar o **Android Vitals** (taxa de crash, ANR) nas primeiras
      semanas — é sinal de qualidade técnica que a Google usa para decidir
      quem aparece mais.
- [ ] Responder avaliações negativas rápido: em apps infantis, pais decidem
      instalar (ou desinstalar) pelo que outros pais escreveram na review,
      mais do que pela ficha da loja.
- [ ] Repetir o ciclo do item 1 (teste fechado, mesmo que menor) a cada
      atualização grande, antes de promover para produção.
