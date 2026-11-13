/**
 * Chat do Topo — Foundry VTT v13/v14
 *
 * O core ordena as mensagens da mais antiga para a mais nova e trata o rodapé
 * como o fim do log. O CSS inverte o container das mensagens (a mais nova fica
 * em cima); aqui o "fim" do log passa a ser o topo:
 *   - scrollBottom() leva à mensagem mais recente;
 *   - "isAtBottom" continua significando "estou na mensagem mais recente";
 *   - o carregamento de mensagens antigas é disparado no fim real (embaixo).
 *
 * O container que rola varia entre versões (.chat-scroll, .window-content ou o
 * próprio .chat-log), então ele é detectado pelo overflow real, não pelo nome.
 */

Hooks.once("init", () => {
  const { ChatLog } = foundry.applications.sidebar.tabs;
  const proto = ChatLog.prototype;

  const MSG = ".message, .chat-message";
  const FLIP = "chat-from-top-flip";

  const findScroller = root => {
    const candidates = [".chat-scroll", ".chat-log", ".window-content"]
      .map(sel => root.querySelector(sel))
      .filter(Boolean);
    return candidates.find(el => /(auto|scroll)/.test(getComputedStyle(el).overflowY))
      ?? candidates[0] ?? root;
  };

  // Em column-reverse a mensagem mais recente fica no topo: posição 0 do scroll.
  // No fallback com scaleY o layout segue normal e a mais recente fica no fim.
  const isFlipped = el => el.classList.contains(FLIP);
  const newestPos = el => (isFlipped(el) ? el.scrollHeight : 0);
  const oldestPos = el => (isFlipped(el) ? 0 : el.scrollHeight);

  // column-reverse no próprio container que rola deixa as mensagens novas
  // inalcançáveis no Chromium; nesse caso a inversão é feita com scaleY(-1).
  const fixLayout = root => {
    const list = root.querySelector(MSG)?.parentElement;
    if (!list || list === root) return;
    if (list !== findScroller(root)) return;
    if (getComputedStyle(list).flexDirection !== "column-reverse") return;
    list.style.setProperty("flex-direction", "column", "important");
    list.classList.add(FLIP);
    list.style.transform = "scaleY(-1)";
    for (const el of list.querySelectorAll(MSG)) el.style.transform = "scaleY(-1)";
  };

  // Só sobrescreve isAtBottom se não for campo privado (v13 usa #isAtBottom).
  try {
    Object.defineProperty(proto, "isAtBottom", {
      configurable: true,
      get() {
        return this._chatFromTopAtNewest ?? true;
      }
    });
  } catch (_) {
    // Campo privado: segue sem sobrescrever.
  }

  proto.scrollBottom = async function({ popout = false, waitImages = false } = {}) {
    if (!this.rendered) return;
    const scroll = findScroller(this.element);
    if (!scroll) return;
    if (waitImages) await this.constructor.waitForImages?.(scroll);
    // Mensagens recém-inseridas no modo scaleY também precisam ser desviradas.
    if (isFlipped(scroll)) {
      for (const el of scroll.querySelectorAll(MSG)) el.style.transform = "scaleY(-1)";
    }
    scroll.scrollTop = newestPos(scroll);
    this._chatFromTopAtNewest = true;
    this.element.querySelector(".jump-to-bottom")?.toggleAttribute("hidden", true);
    scroll.classList.toggle("scrolled", scroll.scrollHeight > scroll.clientHeight);
    if (popout) this.popout?.scrollBottom?.({ waitImages });
  };

  proto._chatFromTopOnScroll = function(event) {
    const scroll = event.target;
    if (!scroll?.matches?.(".chat-scroll, .chat-log, .window-content")) return;
    event.stopPropagation();

    const atNewest = Math.abs(scroll.scrollTop - newestPos(scroll)) <= 1;
    const atOldest = Math.abs(scroll.scrollTop - oldestPos(scroll)) <= 1;

    this._chatFromTopAtNewest = atNewest;
    this.element.querySelector(".jump-to-bottom")?.toggleAttribute("hidden", atNewest);
    scroll.classList.toggle("scrolled", !atOldest);
    if (atOldest) this.renderBatch?.(CONFIG.ChatMessage.batchSize);
  };

  proto._chatFromTopLabelJumpButton = function() {
    const button = this.element.querySelector(".jump-to-bottom");
    if (!button) return;
    const label = game.i18n.localize("CHAT_FROM_TOP.JumpToNewest");
    button.setAttribute("aria-label", label);
    button.setAttribute("data-tooltip", label);
  };

  const onFirstRender = proto._onFirstRender;
  proto._onFirstRender = async function(context, options) {
    await onFirstRender.call(this, context, options);
    this.element.addEventListener("scroll", event => this._chatFromTopOnScroll(event), {
      capture: true,
      passive: true
    });
    this._chatFromTopLabelJumpButton();
    fixLayout(this.element);
    this.scrollBottom();
  };

  // O core carrega mensagens antigas quando o scroll chega ao topo (no layout
  // dele, o topo é o início do log). Aqui o topo é a mensagem mais recente.
  const renderBatch = proto.renderBatch;
  if (renderBatch) {
    proto.renderBatch = function(size) {
      if (this._chatFromTopAtNewest) return Promise.resolve();
      return renderBatch.call(this, size);
    };
  }

  // Após apagar uma mensagem o core chama #onScrollLog() direto, que no layout
  // invertido entende o topo como "fim": carrega histórico e rola para as
  // mensagens antigas. Se estávamos na mais recente, voltamos para ela.
  const deleteMessage = proto.deleteMessage;
  if (deleteMessage) {
    proto.deleteMessage = function(messageId, options) {
      const atNewest = this._chatFromTopAtNewest;
      const done = deleteMessage.call(this, messageId, options);
      // A remoção do elemento acontece ao fim da animação de 100ms.
      if (atNewest) setTimeout(() => this.scrollBottom(), 200);
      return done;
    };
  }
});
