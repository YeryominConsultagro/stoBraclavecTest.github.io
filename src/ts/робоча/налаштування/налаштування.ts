import { supabase } from "../../вхід/supabaseClient";
import {
  createSavePromptModal,
  savePromptModalId,
  showSavePromptModal,
} from "./вікно_підтверджня_налаштуваня";

// Константи для налаштувань
const SETTINGS_CONFIG = {
  1: { id: "toggle-shop", label: "Магазин", class: "_shop" },
  2: { id: "toggle-slyusar", label: "Слюсар", class: "_slyusar" },
  3: { id: "toggle-receiver", label: "Приймальник", class: "_receiver" },
  4: { id: "toggle-income", label: "Джерело", class: "_income" },
};

// Створення HTML для перемикача
function createToggleHTML(config: { id: string; label: string; class: string }): string {
  return `
    <label class="toggle-switch ${config.class}">
      <input type="checkbox" id="${config.id}" />
      <span class="slider"></span>
      <span class="label-text">${config.label}</span>
    </label>
  `;
}

// Завантаження налаштувань з бази даних
async function loadSettingsFromDB(modal: HTMLElement): Promise<void> {
  try {
    const { data: settings, error } = await supabase
      .from("settings")
      .select("setting_id, data");

    if (error) {
      console.error("Помилка при завантаженні налаштувань:", error);
      return;
    }

    settings?.forEach((row: { setting_id: number; data: boolean }) => {
      const config = SETTINGS_CONFIG[row.setting_id as keyof typeof SETTINGS_CONFIG];
      if (config) {
        const checkbox = modal.querySelector(`#${config.id}`) as HTMLInputElement;
        if (checkbox) {
          checkbox.checked = row.data;
        }
      }
    });
  } catch (err) {
    console.error("Помилка завантаження:", err);
  }
}

// Налаштування підсвітки активних перемикачів
function setupToggleHighlights(modal: HTMLElement): void {
  const checkboxes = modal.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
  
  checkboxes.forEach((checkbox) => {
    const label = checkbox.closest(".toggle-switch");
    
    const updateHighlight = (): void => {
      label?.classList.toggle("active", checkbox.checked);
    };

    updateHighlight(); // Початкове налаштування
    checkbox.addEventListener("change", updateHighlight);
  });
}

// Збереження налаштувань у базу даних
async function saveSettingsToDB(modal: HTMLElement): Promise<boolean> {
  const confirmed = await showSavePromptModal();
  
  if (!confirmed) {
    console.log("Збереження скасовано користувачем.");
    return false;
  }

  const settingsData = Object.entries(SETTINGS_CONFIG).map(([settingId, config]) => ({
    setting_id: parseInt(settingId),
    data: (modal.querySelector(`#${config.id}`) as HTMLInputElement).checked,
  }));

  try {
    for (const setting of settingsData) {
      const { error } = await supabase
        .from("settings")
        .upsert({
          setting_id: setting.setting_id,
          data: setting.data,
        });

      if (error) {
        console.error(`Помилка збереження налаштування ${setting.setting_id}:`, error);
      }
    }

    console.log("Налаштування успішно збережено!");
    return true;
  } catch (err) {
    console.error("Помилка при збереженні налаштувань:", err);
    return false;
  }
}

// Основна функція створення модального вікна
export async function createSettingsModal(): Promise<void> {
  const existing = document.getElementById("modal-settings");
  if (existing) return;

  const modal = document.createElement("div");
  modal.id = "modal-settings";
  modal.className = "modal-settings hidden";

  // Генерація HTML для всіх перемикачів
  const togglesHTML = Object.values(SETTINGS_CONFIG)
    .map(createToggleHTML)
    .join("");

  modal.innerHTML = `
    <div class="modal-window">
      <h2>Налаштування</h2>
      ${togglesHTML}
      <div class="modal-actions">
        <button id="modal-cancel-button" type="button">Відмінити</button>
        <button id="modal-ok-button" type="button">ОК</button>
      </div>
    </div>
  `;

  // Створення модального вікна підтвердження
  if (!document.getElementById(savePromptModalId)) {
    const confirmModal = createSavePromptModal();
    document.body.appendChild(confirmModal);
  }

  document.body.appendChild(modal);

  // Завантаження налаштувань з бази даних
  await loadSettingsFromDB(modal);

  // Налаштування підсвітки перемикачів
  setupToggleHighlights(modal);

  // Обробка кнопки "ОК"
  const okButton = modal.querySelector("#modal-ok-button") as HTMLButtonElement;
  okButton.addEventListener("click", async () => {
    const saved = await saveSettingsToDB(modal);
    if (saved) {
      modal.classList.add("hidden");
    }
  });

  // Обробка кнопки "Відмінити"
  const cancelButton = modal.querySelector("#modal-cancel-button") as HTMLButtonElement;
  cancelButton.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  // Закриття по кліку поза модальним вікном
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });
}

// Функція відкриття модального вікна
export function openSettingsModal(): void {
  const modal = document.getElementById("modal-settings");
  if (modal) {
    modal.classList.remove("hidden");
  }
}

// Автоматичне відкриття по кліку
document.addEventListener("DOMContentLoaded", () => {
  const settingsBtn = document.querySelector('[data-action="openSettings"]');
  
  settingsBtn?.addEventListener("click", async (e: Event) => {
    e.preventDefault();
    
    if (!document.getElementById("modal-settings")) {
      await createSettingsModal();
    }
    
    openSettingsModal();
  });
});