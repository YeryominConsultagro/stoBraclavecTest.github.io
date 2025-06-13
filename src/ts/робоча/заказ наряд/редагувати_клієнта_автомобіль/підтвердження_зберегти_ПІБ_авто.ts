export const savePromptModalId = "save-prompt-modal";
import { supabase } from "../../../вхід/supabaseClient";
import {
  getModalFormValues,
  userConfirmation,
} from "../редагувати_клієнта_автомобіль"; // імпортуємо userConfirmation

export function createSavePromptModal(): HTMLDivElement {
  const overlay = document.createElement("div");
  overlay.id = savePromptModalId;
  overlay.className = "modal-overlay-save";
  overlay.style.display = "none";

  const modal = document.createElement("div");
  modal.className = "modal-content-save";

  modal.innerHTML = `
    <p>Зберегти зміни?</p>
    <div class="save-buttons">
      <button id="save-confirm" class="btn-save-confirm">Так</button>
      <button id="save-cancel" class="btn-save-cancel">Ні</button>
    </div>
  `;

  overlay.appendChild(modal);
  return overlay;
}

// Функція для показу модального вікна з обіцянкою
// ✅ Зміни в showSavePromptModal: модальне повідомлення тепер по центру знизу

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
      note.style.bottom = "50%";
      note.style.left = "50%";
      note.style.transform = "translateX(-50%)";
      note.style.backgroundColor = color;
      note.style.color = "white";
      note.style.padding = "12px 24px";
      note.style.borderRadius = "8px";
      note.style.zIndex = "10001";
      note.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
      note.style.fontSize = "16px";
      document.body.appendChild(note);

      setTimeout(() => {
        note.remove();
      }, 2500);
    };

    const closeAllModals = () => {
      document
        .querySelectorAll(".modal-overlay-all_other_bases")
        .forEach((m) => m.classList.add("hidden-all_other_bases"));
    };

    const onConfirm = () => {
      cleanup();
      closeAllModals();
      showMessage("✅ Дані успішно збережено", "#4caf50");
      resolve(true);
    };

    const onCancel = () => {
      cleanup();
      closeAllModals();
      showMessage("✖ Скасовано користувачем", "#f44336");
      resolve(false);
    };

    confirmBtn.addEventListener("click", onConfirm);
    cancelBtn.addEventListener("click", onCancel);
  });
}

// Функція для видалення автомобіля з бази даних
async function deleteCarFromDatabase(carsId: string): Promise<void> {
  const { error } = await supabase.from("cars").delete().eq("cars_id", carsId);

  if (error) {
    console.error("❌ Помилка видалення автомобіля:", error.message);
  } else {
    console.log("✅ Автомобіль успішно видалений");
  }
}

// Функція для додавання нового автомобіля
async function addCarToDatabase(clientId: string, carData: any): Promise<void> {
  const { error } = await supabase.from("cars").insert({
    client_id: clientId,
    data: {
      Авто: carData.carModel,
      "Номер авто": carData.carNumber,
      Обʼєм: carData.engine,
      Пальне: carData.fuel,
      Vincode: carData.vin,
    },
  });

  if (error) {
    console.error("❌ Помилка додавання автомобіля:", error.message);
  } else {
    console.log("✅ Автомобіль успішно додано");
  }
}

export async function saveClientAndCarToDatabase(): Promise<void> {
  const values = getModalFormValues();

  // Перевіряємо userConfirmation для обробки автомобілів
  if (userConfirmation === "no" && values.cars_id) {
    // Видаляємо автомобіль якщо userConfirmation = "no"
    await deleteCarFromDatabase(values.cars_id);
    return;
  }

  if (userConfirmation === "yes" && values.client_id) {
    // Додаємо автомобіль якщо userConfirmation = "yes"
    await addCarToDatabase(values.client_id, {
      carModel: values.carModel,
      carNumber: values.carNumber,
      engine: values.engine,
      fuel: values.fuel,
      vin: values.vin,
    });
    return;
  }

  // Основна логіка збереження (як було раніше)
  if (!values.fullName || !values.phone) {
    console.error("❌ Обов'язкові поля (ПІБ, Телефон) не заповнені");
    return;
  }

  if (!values.client_id) {
    // 👉 Додати нового клієнта
    const { data: insertedClients, error: insertClientError } = await supabase
      .from("clients")
      .insert({
        data: {
          ПІБ: values.fullName,
          Телефон: values.phone,
          Джерело: values.income,
          Додаткові: values.extra,
        },
      })
      .select("client_id") // отримати ID нового клієнта
      .single();

    if (insertClientError) {
      console.error(
        "❌ Не вдалося створити клієнта:",
        insertClientError.message
      );
      return;
    }

    const newClientId = insertedClients?.client_id;
    if (!newClientId) {
      console.error("❌ Відповідь від Supabase не містить client_id");
      return;
    }

    // 👉 Додати новий автомобіль, пов'язаний з клієнтом
    const { error: insertCarError } = await supabase.from("cars").insert({
      client_id: newClientId,
      data: {
        Авто: values.carModel,
        "Номер авто": values.carNumber,
        Обʼєм: values.engine,
        Пальне: values.fuel,
        Vincode: values.vin,
      },
    });

    if (insertCarError) {
      console.error(
        "❌ Не вдалося створити автомобіль:",
        insertCarError.message
      );
    } else {
      console.log("✅ Новий клієнт та авто успішно додані");
    }

    return;
  }

  // 🔄 Якщо client_id існує — звичайне оновлення
  const { error: clientError } = await supabase
    .from("clients")
    .update({
      data: {
        ПІБ: values.fullName,
        Телефон: values.phone,
        Джерело: values.income,
        Додаткові: values.extra,
      },
    })
    .eq("client_id", values.client_id);

  if (clientError) {
    console.error("❌ Помилка оновлення клієнта:", clientError.message);
  } else {
    console.log("✅ Клієнт оновлений");
  }

  const { error: carError } = await supabase
    .from("cars")
    .update({
      data: {
        Авто: values.carModel,
        "Номер авто": values.carNumber,
        Обʼєм: values.engine,
        Пальне: values.fuel,
        Vincode: values.vin,
      },
    })
    .eq("cars_id", values.cars_id);

  if (carError) {
    console.error("❌ Помилка оновлення автомобіля:", carError.message);
  } else {
    console.log("✅ Автомобіль оновлений");
  }
}
