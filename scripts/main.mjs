/**
 * Chat do Topo — Foundry VTT v13/v14
 *
 * O core ordena as mensagens da mais antiga para a mais nova e trata o rodapé
 * como o fim do log. Aqui a ordem visual é invertida por CSS (a mais nova fica
 * em cima) e o conceito de "fim" passa a ser o topo:
 *   - scrollBottom() rola para o topo (mensagem mais recente);
 *   - "isAtBottom" continua significando "estou na mensagem mais recente";
 *   - o carregamento de mensagens antigas é disparado no fim real (embaixo).
 *
 * O listener de scroll do core é bloqueado no ancestral: ele assume o layout
 * antigo e, se rodasse, pularia para a mensagem mais antiga.
 */

Hooks.once("init", () => {
  const { ChatLog } = foundry.applications.sidebar.tabs;
  const proto = ChatLog.prototype;

  // O container que rola é .chat-scroll; se ele não existir, o próprio .chat-log rola.
  const getScroller = log => log.querySelector(".chat-scroll") ?? log.querySelector(".chat-log");

  Object.defineProperty(proto, "isAtBottom", {
    configurable: true,
    get() {
      return this._chatFromTopAtNewest ?? true;
    }
  });

  proto.scrollBottom = async function({ popout = false, waitImages = false } = {}) {
    if (!this.rendered) return;
    const scroll = getScroller(this.element);
    if (!scroll) return;
    if (waitImages) await this.constructor.waitForImages(scroll);
    scroll.scrollTop = 0;
    this._chatFromTopAtNewest = true;
    this.element.querySelector(".jump-to-bottom")?.toggleAttribute("hidden", true);
    scroll.classList.toggle("scrolled", scroll.scrollHeight > scroll.clientHeight);
    if (popout) this.popout?.scrollBottom({ waitImages });
  };

  proto._chatFromTopOnScroll = function(event) {
    const scroll = event.target;
    if (!scroll?.matches?.(".chat-scroll, .chat-log")) return;
    event.stopPropagation();

    const max = scroll.scrollHeight - scroll.clientHeight;
    const atNewest = scroll.scrollTop <= 1;
    const atOldest = max <= 0 || scroll.scrollTop >= max - 1;

    this._chatFromTopAtNewest = atNewest;
    this.element.querySelector(".jump-to-bottom")?.toggleAttribute("hidden", atNewest);
    scroll.classList.toggle("scrolled", !atOldest);
    if (atOldest) this.renderBatch(CONFIG.ChatMessage.batchSize);
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
  };
});
