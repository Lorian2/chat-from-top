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
});

const plainText = html => {
  const body = new DOMParser().parseFromString(String(html ?? ""), "text/html").body;
  return body.textContent.replace(/\s+/g, " ").trim();
};

/**
 * Balão de prévia: quando o chat não está visível (outra aba do sidebar ou
 * sidebar recolhida), mostra remetente + texto da mensagem nova.
 *
 * O core já exibe um painel de cards (#chat-notifications), mas ele fica oculto
 * em janelas estreitas ou com o ajuste "Notification Pip". O balão só aparece
 * quando esse painel do core não está ativo, para não duplicar o aviso.
 */
Hooks.once("ready", () => {
  const preview = document.createElement("div");
  preview.id = "chat-from-top-preview";
  preview.setAttribute("role", "status");
  preview.innerHTML = '<div class="speaker"></div><div class="text"></div>';
  document.body.append(preview);

  let hideTimer;
  const hide = () => preview.classList.remove("visible");

  const show = message => {
    const speaker = message.speaker?.alias || message.author?.name || "";
    preview.querySelector(".speaker").textContent = speaker;
    preview.querySelector(".text").textContent = plainText(message.content);
    preview.setAttribute("aria-label", `${game.i18n.localize("CHAT_FROM_TOP.NewMessage")}: ${speaker}`);

    // Fica à esquerda do sidebar (ou acima da barra de abas, se recolhido).
    const sidebar = document.getElementById("sidebar");
    preview.style.right = `${ui.sidebar?.expanded && sidebar ? sidebar.offsetWidth + 16 : 64}px`;

    preview.classList.add("visible");
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, 8000);
  };

  preview.addEventListener("click", () => {
    hide();
    ui.sidebar.expand?.();
    ui.chat.activate?.();
  });

  Hooks.on("createChatMessage", message => {
    if (!(message.visible ?? message.isContentVisible ?? true)) return;
    if (ui.sidebar?.expanded && ui.chat?.active) return;
    if (ui.chat?.popout?.rendered) return;
    if (document.querySelector("#chat-notifications.active")) return;
    show(message);
  });
});
