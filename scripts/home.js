/* =========================================
   HOME — ANIMAÇÕES
   ========================================= */

const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;


/* =========================================
   1. ANIMAÇÃO DE TEXTO E SCROLL
   ========================================= */

if (!reduceMotion) {
  // Elementos que aparecem conforme a página rola
  const revealElements = document.querySelectorAll(
    ".banner-meta, .contact-buttons, .case-row, .work-top, .work-card, .skillset-block"
  );

  revealElements.forEach((element) => {
    element.setAttribute("data-reveal", "");
  });

  // Divide o título principal em palavras animadas
  const heroLines = document.querySelectorAll(".hero-line");

  heroLines.forEach((line) => {
    const words = line.textContent.trim().split(/\s+/);

    line.replaceChildren();

    words.forEach((word, index) => {
      const span = document.createElement("span");

      span.className = "hero-word";
      span.textContent = word;
      span.style.transitionDelay = `${index * 70}ms`;

      line.appendChild(span);

      if (index < words.length - 1) {
        line.appendChild(document.createTextNode(" "));
      }
    });
  });

  // Ativa as animações
  document.body.classList.add("motion-ready");

  // Observa os elementos durante o scroll
  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          currentObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -40px 0px",
    }
  );

  document.querySelectorAll("[data-reveal]").forEach((element) => {
    observer.observe(element);
  });

  // Faz as linhas do título aparecerem em sequência
  heroLines.forEach((line, index) => {
    window.setTimeout(() => {
      line.classList.add("is-visible");
    }, 180 + index * 120);
  });
}


/* =========================================
   2. ASTERISCO QUE SEGUE O CURSOR
   ========================================= */

const customCursor = document.querySelector(".custom-cursor");

const supportsFinePointer = window.matchMedia(
  "(hover: hover) and (pointer: fine)"
).matches;

if (customCursor && supportsFinePointer && !reduceMotion) {
  let mouseX = -100;
  let mouseY = -100;

  let cursorX = -100;
  let cursorY = -100;

  let animationFrame = null;

  // Atualiza a posição do mouse
  document.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;

    mouseX = event.clientX;
    mouseY = event.clientY;

    customCursor.classList.add("is-active");

    if (animationFrame === null) {
      animationFrame = requestAnimationFrame(updateCursor);
    }
  });

  // Movimento suave do asterisco
  function updateCursor() {
    cursorX += (mouseX - cursorX) * 0.18;
    cursorY += (mouseY - cursorY) * 0.18;

    customCursor.style.transform = `
      translate3d(${cursorX}px, ${cursorY}px, 0)
      translate(-50%, -50%)
    `;

    const distance = Math.hypot(
      mouseX - cursorX,
      mouseY - cursorY
    );

    if (distance > 0.5) {
      animationFrame = requestAnimationFrame(updateCursor);
    } else {
      animationFrame = null;
    }
  }

  // Aumenta o asterisco sobre elementos interativos
  const interactiveElements = document.querySelectorAll(
    "a, button, [role='button'], .contact-button"
  );

  interactiveElements.forEach((element) => {
    element.addEventListener("pointerenter", () => {
      customCursor.classList.add("is-hovering");
    });

    element.addEventListener("pointerleave", () => {
      customCursor.classList.remove("is-hovering");
    });
  });

  // Esconde o asterisco quando o mouse sai da página
  document.addEventListener("pointerleave", () => {
    customCursor.classList.remove("is-active");
  });

  document.addEventListener("pointerenter", () => {
    if (mouseX >= 0 && mouseY >= 0) {
      customCursor.classList.add("is-active");
    }
  });
}