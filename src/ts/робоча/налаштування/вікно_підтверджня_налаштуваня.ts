export const savePromptModalId = "save-prompt-modal";

// Створення модального вікна
export function createSavePromptModal(): HTMLDivElement {
  const overlay = document.createElement("div");
  overlay.id = savePromptModalId;
  overlay.className = "modal-overlay-save";
  overlay.style.display = "none";

  const modal = document.createElement("div");
  modal.className = "modal-content-save";

  modal.innerHTML = `
    <p>Підтвердіть!!!</p>
    <div class="save-buttons">
      <button id="save-confirm" class="btn-save-confirm">Так</button>
      <button id="save-cancel" class="btn-save-cancel">Ні</button>
    </div>`;

  overlay.appendChild(modal);
  return overlay;
}

// Показ модального вікна з повідомленнями
export function showSavePromptModal(): Promise<boolean> {
  return new Promise((resolve) => {
    const modal = document.getElementById(savePromptModalId);
    if (!modal) return resolve(false);

    modal.style.display = "flex";

    const confirmBtn = document.getElementById("save-confirm")!;
    const cancelBtn = document.getElementById("save-cancel")!;

    const cleanup = () => {
      modal.style.display = "none";
      confirmBtn.removeEventListener("click", onConfirm);
      cancelBtn.removeEventListener("click", onCancel);
    };

    const showMessage = (message: string, backgroundColor: string) => {
      const note = document.createElement("div");
      note.textContent = message;
      note.style.position = "fixed";
      note.style.top = "50%";
      note.style.left = "50%";
      note.style.transform = "translate(-50%, -50%)";
      note.style.backgroundColor = backgroundColor;
      note.style.color = "white";
      note.style.padding = "12px 24px";
      note.style.borderRadius = "8px";
      note.style.zIndex = "10001";
      note.style.fontSize = "16px";
      note.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
      document.body.appendChild(note);

      setTimeout(() => {
        note.remove();
      }, 1500);
    };

    const onConfirm = () => {
      cleanup();
      showMessage("✅ Налаштування змінено", "#4caf50"); // Зелений
      resolve(true);
    };

    const onCancel = () => {
      cleanup();
      showMessage("❌ Відмінено налаштуваня", "#f44336"); // Червоний
      resolve(false);
    };

    confirmBtn.addEventListener("click", onConfirm);
    cancelBtn.addEventListener("click", onCancel);
  });
}
