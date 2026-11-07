# Chat do Topo

Módulo para **Foundry VTT v14** (testado em 14.364 com dnd5e 5.3.3).

Inverte o fluxo do chat: a mensagem mais recente aparece **no topo** e as mensagens
antigas descem conforme novas chegam. A caixa de entrada continua embaixo.

## Instalação

### Pelo Foundry (recomendado)

1. Abra o Foundry e vá em **Configurar Ajustes → Módulos Complementares → Instalar Módulo**.
2. Cole este endereço em **URL do Manifesto**:

   ```
   https://github.com/Lorian2/chat-from-top/releases/latest/download/module.json
   ```

3. Clique em **Instalar**.
4. Ative **Chat do Topo** em *Gerenciar Módulos* e recarregue (F5).

### Manual

1. Baixe o `chat-from-top.zip` da aba [Releases](https://github.com/Lorian2/chat-from-top/releases).
2. Extraia a pasta `chat-from-top` em `Data/modules/` do seu Foundry.
3. Recarregue o Foundry e ative **Chat do Topo** em *Gerenciar Módulos*.
4. Recarregue a sessão.

## Como funciona

- `styles/chat-from-top.css` usa `flex-direction: column-reverse` no `.chat-log`,
  o que coloca o último item do DOM (a mensagem mais nova) no topo da tela.
- `scripts/main.mjs` ajusta o comportamento do core:
  - `scrollBottom()` passa a rolar para o topo (mensagem mais recente);
  - o botão "ir para o fim" vira "ir para a mais recente" (ícone e rótulo);
  - o carregamento de mensagens antigas é disparado ao chegar no fim real (embaixo);
  - o listener de scroll original do core é ignorado, pois ele assume o layout antigo.

## Observações

- Funciona com qualquer sistema; foi validado com o sistema D&D 5e.
- Se outro módulo também controlar o scroll do chat, pode haver conflito.
- O histórico continua carregando em lotes ao rolar para baixo, como no core.

## Desenvolvimento

O módulo não tem build. Basta editar os arquivos e recarregar o Foundry.

Para publicar uma nova versão:

1. Atualize `version` no `module.json` e o `CHANGELOG.md`.
2. Crie e envie uma tag: `git tag v1.0.1 && git push origin v1.0.1`.
3. O workflow `.github/workflows/release.yml` monta o `chat-from-top.zip` e publica o release.

## Licença

MIT — veja [LICENSE](LICENSE).
