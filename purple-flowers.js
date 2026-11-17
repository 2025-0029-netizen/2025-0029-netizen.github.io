(() => {
  const music = document.getElementById("bg-music");
  const tapMsg = document.getElementById("tap-msg");
  let musicStarted = false;

  function hideTapMessage() {
    if (tapMsg) {
      tapMsg.classList.add("hidden");
    }
  }

  function startMusic() {
    if (musicStarted || !music) return;
    music.volume = 0.5;
    const playPromise = music.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          musicStarted = true;
          hideTapMessage();
          events.forEach((e) => document.removeEventListener(e, unlock));
        })
        .catch(() => {
          // Autoplay bloqueado → se inicia con el primer toque
        });
    } else {
      musicStarted = true;
      hideTapMessage();
    }
  }

  const events = ["click", "touchstart", "touchend", "keydown", "pointerdown"];
  const unlock = () => {
    startMusic();
  };

  // Intentar lo antes posible
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startMusic);
  } else {
    startMusic();
  }

  window.addEventListener("load", () => {
    setTimeout(() => {
      document.body.classList.remove("not-loaded");
      startMusic();
    }, 700);
  });

  // Cualquier interacción del usuario inicia la música
  events.forEach((e) => {
    document.addEventListener(e, unlock, { passive: true });
  });
})();
