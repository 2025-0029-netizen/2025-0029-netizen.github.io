onload = () => {
  const c = setTimeout(() => {
    document.body.classList.remove("not-loaded");
    const music = document.getElementById("bg-music");
    if (music) {
      music.volume = 0.5;
      music.play().catch(() => {
        // Autoplay may be blocked by the browser; starts on first click
        document.body.addEventListener("click", () => music.play(), { once: true });
      });
    }
    clearTimeout(c);
  }, 1000);
};
