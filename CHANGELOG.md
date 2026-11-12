# Changelog

## 1.3.1

- A prévia da mensagem agora aparece no **topo** da tela, com o chat fechado:
  - o balão flutuante foi movido do canto inferior para o superior;
  - os cards do painel de notificações do core (que empilhavam embaixo) passam a
    empilhar em cima, com a mensagem mais recente no topo.

## 1.3.0

- Novo balão de prévia: quando o chat não está visível (outra aba do sidebar ou
  sidebar recolhida), uma mensagem nova aparece num balão flutuante com remetente
  e texto, que some sozinho em 8 segundos ou ao clicar (o clique abre o chat).
  - Só aparece quando o painel de notificações do core (`#chat-notifications`)
    não está ativo, para não duplicar o aviso.

## 1.2.5

- Correção da inversão no v13, sem depender de nomes de classes da versão.
  - O CSS inverte qualquer container que tenha mensagens como filhas diretas
    (`:has(> .message)`), então a caixa de texto fica fora e permanece embaixo.
  - O container que rola é detectado pelo `overflow` real (`.chat-scroll`,
    `.window-content` ou `.chat-log`), não pelo nome.
  - Quando o próprio container das mensagens é o que rola, `column-reverse`
    deixa as mensagens novas inalcançáveis no Chromium; nesse caso a inversão
    usa `scaleY(-1)` e o scroll volta a funcionar.

## 1.2.4

- Correção definitiva para v13: as mensagens ficam no topo e a caixa de texto
  continua embaixo.
  - No v13 o `.window-content` contém as mensagens **e** o input. O container é
    invertido (`column-reverse`) e o input recebe `order: -1` para permanecer no
    final (embaixo).
  - O `.chat-log` também é invertido para a mensagem mais nova ficar no topo.
  - As regras de v13 usam `:not(:has(.chat-scroll))`, então não afetam o v14.

## 1.2.3

- Correção: a caixa de texto do chat não fica mais no topo.
  - O `flex-direction: column-reverse` agora aplica apenas ao `.chat-log` (as mensagens),
    nunca ao container pai (`.window-content`) nem à caixa de entrada.
  - O JS `forceReverse` só inverte `.chat-scroll` e `.chat-log`, deixando o input embaixo.

## 1.2.2

- Correção agressiva para Foundry VTT v13:
  - CSS aplica `display: flex; flex-direction: column-reverse !important` em mais
    seletores (incluindo `.window-content` direto).
  - JS aplica o estilo inline no container do chat após o primeiro render, como
    fallback quando o CSS não alcança a estrutura do DOM do v13.

## 1.2.1

- Correção de compatibilidade com Foundry VTT v13:
  - CSS agora também casa com estruturas sem `.chat-scroll` (ex.: `.window-content`).
  - JS encontra o container de rolagem com mais fallbacks (`.window-content`, próprio elemento).
  - `isAtBottom` só sobrescrito quando não é campo privado (v13 usa `#isAtBottom`, ignorado com segurança).

## 1.2.0

- Novo arquivo `styles/sidebar-right.css`: move a barra de abas do sidebar
  (chat, iniciativa, atores, ...) para a borda direita, deixando o painel e a
  caixa de texto do chat à esquerda dela.

## 1.1.0

- Compatível com Foundry VTT v13 e v14.
- O container de rolagem é detectado em tempo de execução (`.chat-scroll` ou `.chat-log`),
  então a inversão funciona mesmo em versões com estrutura de DOM diferente.

## 1.0.0

- Versão inicial para Foundry VTT v14.
- Mensagem mais recente no topo, antigas descendo conforme chegam.
- Botão de atalho invertido e renomeado para "Ir para a mensagem mais recente".
- Carregamento do histórico antigo ao rolar para baixo.
- Traduções em inglês e português (Brasil).
