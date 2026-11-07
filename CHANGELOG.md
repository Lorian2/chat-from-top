# Changelog

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
