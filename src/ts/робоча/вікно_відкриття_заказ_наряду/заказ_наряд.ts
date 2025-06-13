export function createModal() {
  const existing = document.getElementById("custom-modal-sakaz_narad");
  if (existing) return;

  const modalOverlay = document.createElement("div");
  modalOverlay.id = "custom-modal-sakaz_narad";
  modalOverlay.className = "modal-overlay-sakaz_narad hidden";

  modalOverlay.innerHTML = `
    <div class="modal-content-sakaz_narad">
      <button class="modal-close-sakaz_narad" id="close-modal-sakaz_narad">&times;</button>
      <h2>Модальне вікно</h2>
      <p>Це динамічно створене модальне вікно 400x400px.</p>
    </div>
  `;

  document.body.appendChild(modalOverlay);

  modalOverlay
    .querySelector("#close-modal-sakaz_narad")
    ?.addEventListener("click", () => {
      modalOverlay.classList.add("hidden");
    });

  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.classList.add("hidden");
    }
  });
}

export function showModal() {
  const modal = document.getElementById("custom-modal-sakaz_narad");
  if (modal) modal.classList.remove("hidden");
}
