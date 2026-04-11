const revealItems = document.querySelectorAll(".reveal");
const stars = document.querySelector(".stars");
const bgAudio = document.querySelector("#bg-audio");
const musicToggle = document.querySelector("#music-toggle");

for (let index = 0; index < 28; index += 1) {
    const sparkle = document.createElement("span");
    const size = Math.random() * 3 + 1;
    sparkle.className = "sparkle";
    sparkle.style.cssText = `
        position:absolute;
        width:${size}px;
        height:${size}px;
        left:${Math.random() * 100}%;
        top:${Math.random() * 100}%;
        border-radius:50%;
        background:${Math.random() > 0.35 ? "rgba(255,255,255,0.9)" : "rgba(255,224,195,0.95)"};
        box-shadow:0 0 12px rgba(255,255,255,0.45);
        animation: twinkle ${Math.random() * 4 + 4}s ease-in-out ${Math.random() * 3}s infinite;
    `;
    stars.appendChild(sparkle);
}

const styleTag = document.createElement("style");
styleTag.textContent = `
    @keyframes twinkle {
        0%, 100% { opacity: 0.15; transform: scale(0.9); }
        50% { opacity: 1; transform: scale(1.45); }
    }
`;
document.head.appendChild(styleTag);

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.16
});

revealItems.forEach((item) => observer.observe(item));

window.addEventListener("scroll", () => {
    const offset = window.scrollY * 0.08;
    document.querySelectorAll(".aurora").forEach((aurora, index) => {
        aurora.style.transform = `translate3d(0, ${offset * (index + 1)}px, 0)`;
    });
}, { passive: true });

function setMusicState(isPlaying) {
    musicToggle.classList.toggle("is-playing", isPlaying);
    musicToggle.setAttribute("aria-label", isPlaying ? "Pause background music" : "Play background music");
    musicToggle.querySelector(".music-toggle__text").textContent = isPlaying ? "Pause our song" : "Play our song";
}

async function tryPlayMusic() {
    try {
        await bgAudio.play();
        setMusicState(true);
    } catch {
        setMusicState(false);
    }
}

musicToggle.addEventListener("click", async () => {
    if (bgAudio.paused) {
        await tryPlayMusic();
        return;
    }

    bgAudio.pause();
    setMusicState(false);
});

window.addEventListener("load", () => {
    tryPlayMusic();
});

document.addEventListener("pointerdown", () => {
    if (bgAudio.paused) {
        tryPlayMusic();
    }
}, { once: true });

setMusicState(false);
