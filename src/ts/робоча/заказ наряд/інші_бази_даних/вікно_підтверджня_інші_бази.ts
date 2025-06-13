import { supabase } from "../../../вхід/supabaseClient";
import { all_bd, CRUD } from "./інші_бази_даних"; // Використовуйте правильний шлях

export const savePromptModalId = "save-prompt-modal";

export function createSavePromptModal(): HTMLDivElement {
  const overlay = document.createElement("div");
  overlay.id = savePromptModalId;
  overlay.className = "modal-overlay-save";
  overlay.style.display = "none";

  const modal = document.createElement("div");
  modal.className = "modal-content-save";

  modal.innerHTML = `<p>Підтвердіть!!!</p>
    <div class="save-buttons">
      <button id="save-confirm" class="btn-save-confirm">Так</button>
      <button id="save-cancel" class="btn-save-cancel">Ні</button>
    </div>`;

  overlay.appendChild(modal);
  return overlay;
}

export let currentTableName: string = "";

// Функція для очищення інпута і перезавантаження даних
const clearInputAndReloadData = async () => {
  // Очищаємо інпут
  const searchInput = document.getElementById(
    "search-input-all_other_bases"
  ) as HTMLInputElement;
  if (searchInput) {
    searchInput.value = "";
  }

  // Очищаємо dropdown
  const dropdown = document.getElementById(
    "custom-dropdown-all_other_bases"
  ) as HTMLDivElement;
  if (dropdown) {
    dropdown.innerHTML = "";
    dropdown.classList.add("hidden-all_other_bases");
  }

  // Перезавантажуємо дані якщо є активна таблиця
  if (currentTableName) {
    // Імпортуємо функцію loadDatabaseData з іншого файлу
    await loadDatabaseData(currentTableName);
  }
};

export const loadDatabaseData = async (buttonText: string) => {
  currentTableName = buttonText;
};

function getInputValue(): string {
  const inputElement = document.getElementById(
    "search-input-all_other_bases"
  ) as HTMLInputElement;
  return inputElement ? inputElement.value.trim() : "";
}

async function performCrudOperation(): Promise<boolean> {
  if (!CRUD) {
    console.error("Відсутня змінна CRUD");
    return false;
  }

  if (!all_bd) {
    console.error("Відсутні дані all_bd");
    return false;
  }

  const inputValue = getInputValue();

  if ((CRUD === "Редагувати" || CRUD === "Додати") && !inputValue) {
    console.error("Відсутнє значення в інпуті для операції:", CRUD);
    return false;
  }

  try {
    const data = JSON.parse(all_bd);
    const tableName = data.table;

    if (!tableName) {
      console.error("Відсутня назва таблиці в all_bd");
      return false;
    }

    if (CRUD === "Редагувати" || CRUD === "Видалити") {
      data.record = { ...data };
    }

    switch (CRUD) {
      case "Редагувати":
        return await handleEdit(tableName, data, inputValue);
      case "Видалити":
        return await handleDelete(tableName, data);
      case "Додати":
        return await handleAdd(tableName, inputValue);
      default:
        console.error("Невідомий CRUD режим:", CRUD);
        return false;
    }
  } catch (error) {
    console.error("Помилка при обробці CRUD операції:", error);
    return false;
  }
}

async function handleEdit(
  tableName: string,
  data: any,
  newValue: string
): Promise<boolean> {
  try {
    if (!data.record) {
      console.error("Немає знайденого запису для редагування");
      return false;
    }

    const idField = Object.keys(data.record).find(
      (key) => key.includes("_id") || key === "id"
    );

    if (!idField) {
      console.error("Не знайдено ID поле для редагування");
      return false;
    }

    const idValue = data.record[idField];
    console.log(
      `Редагування: ${tableName}, ID поле: ${idField}, ID значення: ${idValue}`
    );

    const { data: currentRecord, error: fetchError } = await supabase
      .from(tableName)
      .select("*")
      .eq(idField, idValue)
      .single();

    if (fetchError || !currentRecord) {
      console.error("Помилка при отриманні запису:", fetchError);
      return false;
    }

    let updateData: any = {};

    if (
      tableName === "incomes" ||
      tableName === "receivers" ||
      tableName === "shops" ||
      tableName === "slyusars"
    ) {
      updateData.data = JSON.stringify({ Name: newValue });
    } else if (["works", "details"].includes(tableName)) {
      updateData.data = newValue; // Для works зберігаємо дані безпосередньо
    } else {
      console.error("Невідома таблиця для редагування:", tableName);
      return false;
    }

    const { error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq(idField, idValue);

    if (error) {
      console.error("Помилка при редагуванні:", error);
      return false;
    }

    console.log(
      `Успішно відредаговано: ${tableName}, ID: ${idValue}, нове значення: "${newValue}"`
    );
    return true;
  } catch (error) {
    console.error("Помилка при редагуванні:", error);
    return false;
  }
}

async function handleDelete(tableName: string, data: any): Promise<boolean> {
  try {
    if (!data.record) {
      console.error("Немає знайденого запису для видалення");
      return false;
    }

    const idField = Object.keys(data.record).find(
      (key) => key.includes("_id") || key === "id"
    );

    if (!idField) {
      console.error("Не знайдено ID поле для видалення");
      return false;
    }

    const idValue = data.record[idField];
    console.log(
      `Видалення: ${tableName}, ID поле: ${idField}, ID значення: ${idValue}`
    );

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq(idField, idValue);

    if (error) {
      console.error("Помилка при видаленні:", error);
      return false;
    }

    console.log(`Успішно видалено: ${tableName}, ID: ${idValue}`);
    return true;
  } catch (error) {
    console.error("Помилка при видаленні:", error);
    return false;
  }
}

async function handleAdd(
  tableName: string,
  newValue: string
): Promise<boolean> {
  try {
    console.log(`Додавання до таблиці: ${tableName}, значення: "${newValue}"`);

    let insertData: any = {};
    let newId: number;

    const idFieldMap = {
      incomes: "income_id",
      receivers: "receiver_id",
      shops: "shop_id",
      slyusars: "slyusar_id",
      works: "work_id",
      details: "detail_id",
    } as const;

    type TableName = keyof typeof idFieldMap;

    const idField = idFieldMap[tableName as TableName];

    if (!idField) {
      console.error("Невідома таблиця для отримання ID:", tableName);
      return false;
    }

    // NEW: Get max ID via order
    const { data: maxIdRows, error: maxIdError } = await supabase
      .from(tableName)
      .select(idField)
      .order(idField, { ascending: false })
      .limit(1);

    // 👇 додай перевірку
    if (maxIdError) {
      console.error("Помилка при отриманні максимального ID:", maxIdError);
      return false;
    }

    const firstRow = maxIdRows?.[0] as Record<string, any>; // або типізуй через `{ [key: string]: any }`

    newId = (firstRow?.[idField] ?? 0) + 1;

    // Build insertData
    // Build insertData
    if (["incomes", "receivers", "shops", "slyusars"].includes(tableName)) {
      insertData = {
        [idField]: newId,
        data: JSON.stringify({ Name: newValue }),
      };
    } else if (["works", "details"].includes(tableName)) {
      insertData = {
        [idField]: newId,
        data: newValue,
      };
    } else {
      console.error("Невідома таблиця для додавання:", tableName);
      return false;
    }

    console.log("Дані для вставки:", insertData);

    const { error } = await supabase
      .from(tableName)
      .insert(insertData)
      .select();

    if (error) {
      console.error("Помилка при додаванні:", error);
      return false;
    }

    console.log(`✅ Успішно додано: ${tableName}, значення: "${newValue}"`);
    return true;
  } catch (error) {
    console.error("❌ Помилка при додаванні:", error);
    return false;
  }
}

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

    const showMessage = (message: string, color: string) => {
      const note = document.createElement("div");
      note.textContent = message;
      note.style.position = "fixed";
      note.style.top = "50%";
      note.style.left = "50%";
      note.style.transform = "translateX(-50%)";
      note.style.backgroundColor = color;
      note.style.color = "white";
      note.style.padding = "12px 24px";
      note.style.borderRadius = "8px";
      note.style.zIndex = "10001";
      note.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
      document.body.appendChild(note);

      setTimeout(() => {
        note.remove();
      }, 1500);
    };

    const closeAllModals = () => {
      document
        .querySelectorAll(".modal-overlay-all_other_bases")
        .forEach((m) => m.classList.add("hidden-all_other_bases"));
    };

    const onConfirm = async () => {
      if (!CRUD) {
        cleanup();
        showMessage("❌ Помилка: відсутня змінна CRUD", "#f44336");
        resolve(false);
        return;
      }

      const success = await performCrudOperation();

      cleanup();
      closeAllModals();

      if (success) {
        showMessage("✅ Дані успішно відредаговані", "#4caf50");

        // 🔄 Після збереження очищаємо і перезавантажуємо
        await clearInputAndReloadData();

        resolve(true);
      } else {
        showMessage("❌ Помилка при редагуванні даних", "#f44336");
        resolve(false);
      }
    };

    const onCancel = () => {
      cleanup();
      showMessage("✖ Скасовано користувачем", "#f44336");
      resolve(false);
    };

    confirmBtn.addEventListener("click", onConfirm);
    cancelBtn.addEventListener("click", onCancel);
  });
}

// Експортуємо функцію для використання в інших файлах
export { clearInputAndReloadData };
