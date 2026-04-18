const apologyCard = document.getElementById("apology-card");
const stage = document.getElementById("buttons-stage");
const yesButton = document.getElementById("yes-button");
const noButton = document.getElementById("no-button");
const microCopy = document.getElementById("micro-copy");
const popup = document.getElementById("call-popup");
const callLink = document.getElementById("call-link");
const closePopup = document.getElementById("close-popup");

const phoneNumber = apologyCard?.dataset.phone || "+917017986885";
let dodgeCount = 0;
const maxDodges = 5;

callLink.href = `tel:${phoneNumber}`;
callLink.textContent = `Call ${phoneNumber}`;

function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
}

function moveNoButton() {
    if (!stage) {
        return;
    }

    const stageRect = stage.getBoundingClientRect();
    const buttonRect = noButton.getBoundingClientRect();

    const maxLeft = Math.max(0, stageRect.width - buttonRect.width - 10);
    const maxTop = Math.max(0, stageRect.height - buttonRect.height - 10);

    const nextLeft = randomInRange(0, maxLeft);
    const nextTop = randomInRange(0, maxTop);

    noButton.style.left = `${nextLeft}px`;
    noButton.style.top = `${nextTop}px`;
}

function resetNoButtonPosition() {
    if (window.innerWidth <= 900) {
        noButton.style.left = "0px";
        noButton.style.top = dodgeCount >= maxDodges ? "140px" : "92px";
        return;
    }

    noButton.style.left = dodgeCount >= maxDodges ? "230px" : noButton.style.left || "230px";
}

function dodgeNoButton() {
    if (dodgeCount >= maxDodges) {
        noButton.classList.add("is-tired");
        microCopy.textContent = "Okay... ab main drama band karta hoon. Ab tum honestly choose kar sakti ho.";
        return;
    }

    dodgeCount += 1;
    moveNoButton();

    if (dodgeCount < maxDodges) {
        microCopy.textContent = "\"Not yet\" wala button thoda shy hai. Ek baar aur try karo.";
    } else {
        noButton.classList.add("is-tired");
        microCopy.textContent = "Button bhaagte-bhaagte thak gaya. Honest answer mode unlocked.";
    }
}

function openCallFlow() {
    popup.hidden = false;
    document.body.style.overflow = "hidden";

    setTimeout(() => {
        window.location.href = `tel:${phoneNumber}`;
    }, 250);
}

function closeCallFlow() {
    popup.hidden = true;
    document.body.style.overflow = "";
}

["mouseenter", "touchstart"].forEach((eventName) => {
    noButton.addEventListener(
        eventName,
        (event) => {
            if (eventName === "touchstart") {
                event.preventDefault();
            }
            dodgeNoButton();
        },
        { passive: false }
    );
});

noButton.addEventListener("click", () => {
    if (dodgeCount < maxDodges) {
        dodgeNoButton();
        return;
    }

    microCopy.textContent = "I understand, Kumkum. Main tumhe space dunga aur phir bhi tumhari care karta rahunga.";
});

yesButton.addEventListener("click", openCallFlow);
closePopup.addEventListener("click", closeCallFlow);

popup.addEventListener("click", (event) => {
    if (event.target === popup) {
        closeCallFlow();
    }
});

window.addEventListener("resize", resetNoButtonPosition);
resetNoButtonPosition();
