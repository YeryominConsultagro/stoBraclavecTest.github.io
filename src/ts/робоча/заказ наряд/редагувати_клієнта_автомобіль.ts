import { supabase } from "../../вхід/supabaseClient";
import "../../../scss/main.scss";
import { loadActsTable  } from "../таблиця/таблиця";
import { saveClientAndCarToDatabase } from "./редагувати_клієнта_автомобіль/підтвердження_зберегти_ПІБ_авто";

import {
  createSavePromptModal,
  showSavePromptModal,
  savePromptModalId,
} from "./редагувати_клієнта_автомобіль/підтвердження_зберегти_ПІБ_авто";

//Експорт функцій  client_id та cars_id та фор
export function getModalFormValues() {
  const get = (id: string) =>
    (document.getElementById(id) as HTMLInputElement | null)?.value || "";

  return {
    client_id: selectedClientId,
    cars_id: selectedCarId,
    fullName: get(clientInputId),
    phone: get(phoneInputId),
    carModel: get(carModelInputId),
    carNumber: get(carNumberInputId),
    engine: get(carEngineInputId),
    fuel: get(carFuelInputId),
    vin: get(carVinInputId),
    income: get(carIncomeInputId),
    extra: get(extraInputId),
  };
}

// DOM елементи (кешування)
const modalOverlayId = "custom-modal-create-sakaz_narad";
const modalClass = "modal-content-create-sakaz_narad";
const modalCloseBtnId = "close-create-sakaz_narad";
const btnEditId = "btn-edit-create-sakaz_narad";
const clientInputId = "client-input-create-sakaz_narad";
const clientListId = "client-list-create-sakaz_narad";
const carModelInputId = "car-model-create-sakaz_narad";
const carModelListId = "car-model-list-create-sakaz_narad";
const phoneInputId = "phone-create-sakaz_narad";
const phoneListId = "phone-list-create-sakaz_narad";
const carNumberInputId = "car-number-input-create-sakaz_narad";
const carNumberListId = "car-number-list-create-sakaz_narad";
const carEngineInputId = "car-engine-create-sakaz_narad";
const carEngineListId = "car-engine-list-create-sakaz_narad";
const carFuelInputId = "car-fuel-create-sakaz_narad";
const carVinInputId = "car-vin-create-sakaz_narad";
const carVinListId = "car-vin-list-create-sakaz_narad";
const carIncomeInputId = "car-income-create-sakaz_narad";
const extraInputId = "extra-create-sakaz_narad";
const btnSaveId = "btn-save-create-sakaz_narad";

//Виведення client_id та client_id
let selectedClientId: string | null = null;
let selectedCarId: string | null = null;

// Глобальний стан для відстеження поточних екземплярів автозаповнення
let currentAutocompletes: { [key: string]: any } = {};

//Так або ні
export let userConfirmation: "no" | "yes" | null = null;

// Глобальні дані для автозаповнення в режимі редагування
let allUniqueData: {
  carModels: string[];
  phones: string[];
  carNumbers: string[];
  engines: string[];
  vins: string[];
} = {
  carModels: [],
  phones: [],
  carNumbers: [],
  engines: [],
  vins: [],
};

//Виведення client_id та client_id
function isLocked(): boolean {
  const editButton = document.getElementById(btnEditId);
  return editButton?.getAttribute("data-unlocked") !== "true";
}

function createModalElement(): HTMLDivElement {
  const modalOverlay = document.createElement("div");
  modalOverlay.id = modalOverlayId;
  modalOverlay.className = "modal-overlay-create-sakaz_narad";

  const modal = document.createElement("div");
  modal.className = modalClass;

  modal.innerHTML = `
    <button id="${modalCloseBtnId}" class="modal-close-create-sakaz_narad">&times;</button>
    <div class="modal-header-create-sakaz_narad">
      <h2>🔍 Картка клієнта</h2>
    </div>
    ${createInputFields()}
    <div class="buttons-create-sakaz_narad">
      <button id="${btnEditId}" class="btn-action-create-sakaz_narad btn-edit" title="Заблокувати інші поля">🔒</button>
      <button id="${btnSaveId}" class="btn-action-create-sakaz_narad btn-save" title="Зберегти">💾</button>
      <button class="btn-action-create-sakaz_narad btn-create">Створити</button>
    </div>
  `;
  modalOverlay.appendChild(modal);
  return modalOverlay;
}

function createInputFields(): string {
  return `
    <div class="field-create-sakaz_narad">
      <label for="${clientInputId}">ПІБ</label>
      <input type="text" id="${clientInputId}" class="input-create-sakaz_narad" placeholder="Введіть ПІБ" autocomplete="off" />
      <ul id="${clientListId}" class="suggestions-list-create-sakaz_narad"></ul>
    </div>
    <div class="field-create-sakaz_narad car-field-wrapper">
        <label for="${carModelInputId}">Автомобіль</label>
    <div class="car-field-inline">
    <input type="text" id="${carModelInputId}" class="input-create-sakaz_narad" placeholder="Автомобіль" />
    <div id="car-confirm-icons" class="car-confirm-icons" style="display: flex;">
       <button id="confirm-toggle" class="confirm-button yes" title="Підтвердження">✔️</button>
    </div>
    </div>
       <ul id="${carModelListId}" class="suggestions-list-create-sakaz_narad"></ul>
    </div>
    <div class="field-create-sakaz_narad">
      <label for="${phoneInputId}">Номер телефону</label>
      <input type="text" id="${phoneInputId}" class="input-create-sakaz_narad" placeholder="Введіть номер телефону" autocomplete="off" />
      <ul id="${phoneListId}" class="suggestions-list-create-sakaz_narad"></ul>
    </div>
    <div class="field-row-create-sakaz_narad">
      <div class="field-create-sakaz_narad">
        <label for="${carNumberInputId}">Номер авто</label>
        <input type="text" id="${carNumberInputId}" class="input-create-sakaz_narad" placeholder="Номер авто" autocomplete="off" />
        <ul id="${carNumberListId}" class="suggestions-list-create-sakaz_narad"></ul>
      </div>
      <div class="field-create-sakaz_narad">
        <label for="${carEngineInputId}">Обʼєм</label>
        <input type="text" id="${carEngineInputId}" class="input-create-sakaz_narad" readonly />
        <ul id="${carEngineListId}" class="suggestions-list-create-sakaz_narad"></ul>
      </div>
      <div class="field-create-sakaz_narad">
        <label for="${carFuelInputId}">Пальне</label>
        <input type="text" id="${carFuelInputId}" class="input-create-sakaz_narad" readonly />
      </div>
    </div>
    <div class="field-row-create-sakaz_narad">
      <div class="field-create-sakaz_narad">
        <label for="${carVinInputId}">VIN-код</label>
        <input type="text" id="${carVinInputId}" class="input-create-sakaz_narad" readonly />
        <ul id="${carVinListId}" class="suggestions-list-create-sakaz_narad"></ul>
      </div>
      <div class="field-create-sakaz_narad">
        <label for="${carIncomeInputId}">Джерело</label>
        <input type="text" id="${carIncomeInputId}" class="input-create-sakaz_narad" readonly />
      </div>
    </div>
    <div class="field-create-sakaz_narad">
      <label for="${extraInputId}">Додатково</label>
      <input type="text" id="${extraInputId}" class="input-create-sakaz_narad" readonly />
    </div>
  `;
}

function setupAutocomplete(
  input: HTMLInputElement,
  list: HTMLUListElement,
  items: any[],
  labelFn: (i: any) => string,
  onSelect: (i: any) => void,
  showOnFocus: boolean = false,
  key?: string
) {
  // Видалити попередні обробники подій якщо існують
  if (key && currentAutocompletes[key]) {
    const oldData = currentAutocompletes[key];
    input.removeEventListener("input", oldData.inputHandler);
    input.removeEventListener("focus", oldData.focusHandler);
    input.removeEventListener("blur", oldData.blurHandler);
  }

  const inputHandler = () => render();
  const focusHandler = () => {
    if (showOnFocus) {
      renderAll();
    } else {
      render();
    }
  };
  const blurHandler = () => setTimeout(() => (list.innerHTML = ""), 150);

  input.addEventListener("input", inputHandler);
  input.addEventListener("focus", focusHandler);
  input.addEventListener("blur", blurHandler);

  // Зберегти обробники для очищення
  if (key) {
    currentAutocompletes[key] = {
      inputHandler,
      focusHandler,
      blurHandler,
    };
  }

  function render() {
    list.innerHTML = "";
    const val = input.value.toLowerCase();
    if (val.length === 0 && !showOnFocus) return;

    const filtered = items.filter((i) =>
      labelFn(i).toLowerCase().includes(val)
    );
    filtered.slice(0, 10).forEach((i) => {
      const li = document.createElement("li");
      li.textContent = labelFn(i);
      li.addEventListener("click", () => {
        input.value = labelFn(i);
        list.innerHTML = "";
        onSelect(i);
      });
      list.appendChild(li);
    });
  }

  function renderAll() {
    list.innerHTML = "";
    items.slice(0, 10).forEach((i) => {
      const li = document.createElement("li");
      li.textContent = labelFn(i);
      li.addEventListener("click", () => {
        input.value = labelFn(i);
        list.innerHTML = "";
        onSelect(i);
      });
      list.appendChild(li);
    });
  }
}

// Функція для налаштування автозаповнення для простих рядків
function setupSimpleAutocomplete(
  input: HTMLInputElement,
  list: HTMLUListElement,
  items: string[],
  onSelect?: (item: string) => void,
  key?: string
) {
  setupAutocomplete(
    input,
    list,
    items,
    (item) => item,
    (item) => {
      if (onSelect) onSelect(item);
    },
    true,
    key
  );
}

function fillCarFields(car: any) {
  (document.getElementById(carEngineInputId) as HTMLInputElement).value =
    car["Обʼєм"] || "";
  (document.getElementById(carFuelInputId) as HTMLInputElement).value =
    car["Пальне"] || "";
  (document.getElementById(carVinInputId) as HTMLInputElement).value =
    car["Vincode"] || "";
  (document.getElementById(carNumberInputId) as HTMLInputElement).value =
    car["Номер авто"] || "";
  (document.getElementById(carModelInputId) as HTMLInputElement).value =
    car["Авто"] || "";
}

async function fetchClientData(clientId: string) {
  const { data: clientData } = await supabase
    .from("clients")
    .select("data")
    .eq("client_id", clientId)
    .single();
  return clientData?.data || null;
}

async function fillClientInfo(clientId: string) {
  const clientData = await fetchClientData(clientId);
  if (clientData) {
    (document.getElementById(clientInputId) as HTMLInputElement).value =
      clientData["ПІБ"] || "";
    (document.getElementById(phoneInputId) as HTMLInputElement).value =
      clientData["Телефон"] || "";
    (document.getElementById(extraInputId) as HTMLInputElement).value =
      clientData["Додаткові"] || "";
    (document.getElementById(carIncomeInputId) as HTMLInputElement).value =
      clientData["Джерело"] || "Не вказано";
    return clientData;
  }
  return null;
}

// Функція для завантаження унікальних даних з бази
async function loadUniqueData() {
  const { data: allCars } = await supabase.from("cars").select("data");

  const { data: allClients } = await supabase.from("clients").select("data");

  if (allCars) {
    // Унікальні моделі авто
    const carModels = [
      ...new Set(
        allCars
          .map((car) => car.data?.["Авто"])
          .filter((model) => model && typeof model === "string" && model.trim())
          .map((model) => model.toString().trim())
      ),
    ].sort();

    // Унікальні номери авто
    const carNumbers = [
      ...new Set(
        allCars
          .map((car) => car.data?.["Номер авто"])
          .filter((num) => num && typeof num === "string" && num.trim())
          .map((num) => num.toString().trim())
      ),
    ].sort();

    // Унікальні об'єми двигунів
    const engines = [
      ...new Set(
        allCars
          .map((car) => car.data?.["Обʼєм"])
          .filter((eng) => eng && typeof eng === "string" && eng.trim())
          .map((eng) => eng.toString().trim())
      ),
    ].sort();

    // Унікальні VIN-коди
    const vins = [
      ...new Set(
        allCars
          .map((car) => car.data?.["Vincode"])
          .filter((vin) => vin && typeof vin === "string" && vin.trim())
          .map((vin) => vin.toString().trim())
      ),
    ].sort();

    allUniqueData.carModels = carModels;
    allUniqueData.carNumbers = carNumbers;
    allUniqueData.engines = engines;
    allUniqueData.vins = vins;
  }

  if (allClients) {
    // Унікальні телефони
    const phones = [
      ...new Set(
        allClients
          .map((client) => client.data?.["Телефон"])
          .filter(
            (phone): phone is string => typeof phone === "string" && !!phone
          )
          .flatMap((phone: string) =>
            phone
              .split(/[,;]/)
              .map((p: string) => p.trim())
              .filter((p: string) => p.length > 0)
          )
      ),
    ].sort();

    allUniqueData.phones = phones;
  }
}

// Функція для налаштування автозаповнення в режимі редагування
function setupEditingAutocompletes() {
  const carModelInput = document.getElementById(
    carModelInputId
  ) as HTMLInputElement;
  const carModelList = document.getElementById(
    carModelListId
  ) as HTMLUListElement;
  const phoneInput = document.getElementById(phoneInputId) as HTMLInputElement;
  const phoneList = document.getElementById(phoneListId) as HTMLUListElement;
  const carNumberInput = document.getElementById(
    carNumberInputId
  ) as HTMLInputElement;
  const carNumberList = document.getElementById(
    carNumberListId
  ) as HTMLUListElement;
  const carEngineInput = document.getElementById(
    carEngineInputId
  ) as HTMLInputElement;
  const carEngineList = document.getElementById(
    carEngineListId
  ) as HTMLUListElement;
  const carVinInput = document.getElementById(
    carVinInputId
  ) as HTMLInputElement;
  const carVinList = document.getElementById(carVinListId) as HTMLUListElement;

  // Налаштування автозаповнення для всіх полів
  setupSimpleAutocomplete(
    carModelInput,
    carModelList,
    allUniqueData.carModels,
    undefined,
    "carModelEdit"
  );
  setupSimpleAutocomplete(
    phoneInput,
    phoneList,
    allUniqueData.phones,
    undefined,
    "phoneEdit"
  );
  setupSimpleAutocomplete(
    carNumberInput,
    carNumberList,
    allUniqueData.carNumbers,
    undefined,
    "carNumberEdit"
  );
  setupSimpleAutocomplete(
    carEngineInput,
    carEngineList,
    allUniqueData.engines,
    undefined,
    "carEngineEdit"
  );
  setupSimpleAutocomplete(
    carVinInput,
    carVinList,
    allUniqueData.vins,
    undefined,
    "carVinEdit"
  );

  document.getElementById("car-confirm-icons")!.style.display = "flex";
}

async function showModalCreateSakazNarad() {
  // Додати підтвердження, якщо ще не вставлено
  if (!document.getElementById(savePromptModalId)) {
    document.body.appendChild(createSavePromptModal());
  }

  if (document.getElementById(modalOverlayId)) return;

  const modal = createModalElement();
  document.body.appendChild(modal);

  // 🔰 Ініціалізація confirm-toggle - приховати при завантаженні
  userConfirmation = "yes";
  const confirmToggle = document.getElementById(
    "confirm-toggle"
  ) as HTMLButtonElement;

  // Приховати іконки підтвердження при завантаженні
  document.getElementById("car-confirm-icons")!.style.display = "none";

  // Початково userConfirmation = null
  userConfirmation = null;

  if (confirmToggle) {
    confirmToggle.textContent = "🔁"; // початкова нейтральна іконка
    confirmToggle.classList.remove("yes", "no");

    confirmToggle.addEventListener("click", () => {
      if (userConfirmation === null || userConfirmation === "no") {
        // Вмикаємо "yes"
        userConfirmation = "yes";
        confirmToggle.textContent = "➕";
        confirmToggle.classList.add("yes");
        confirmToggle.classList.remove("no");
      } else {
        // Вмикаємо "no"
        userConfirmation = "no";
        confirmToggle.textContent = "❌";
        confirmToggle.classList.add("no");
        confirmToggle.classList.remove("yes");
      }

      console.log("userConfirmation:", userConfirmation);
    });
  }

  // Завантажити унікальні дані
  await loadUniqueData();

  // Кешування елементів модального вікна
  const btnSave = document.getElementById(btnSaveId)!;
  const modalElement = document.getElementById(modalOverlayId)!;
  const closeBtn = document.getElementById(modalCloseBtnId)!;
  const btnEdit = document.getElementById(btnEditId)!;
  const clientInput = document.getElementById(
    clientInputId
  ) as HTMLInputElement;
  const clientList = document.getElementById(clientListId) as HTMLUListElement;
  const carNumberInput = document.getElementById(
    carNumberInputId
  ) as HTMLInputElement;
  const carNumberList = document.getElementById(
    carNumberListId
  ) as HTMLUListElement;
  const carModelInput = document.getElementById(
    carModelInputId
  ) as HTMLInputElement;
  const carModelList = document.getElementById(
    carModelListId
  ) as HTMLUListElement;
  const carIncomeInput = document.getElementById(
    carIncomeInputId
  ) as HTMLInputElement;
  const phoneInput = document.getElementById(phoneInputId) as HTMLInputElement;
  const phoneList = document.getElementById(phoneListId) as HTMLUListElement;
  const extraInput = document.getElementById(extraInputId) as HTMLInputElement;

  const editableFieldsInitially = [
    clientInput,
    carModelInput,
    carNumberInput,
    phoneInput,
  ];

  // Увімкнути необхідні поля
  editableFieldsInitially.forEach((el) => el.removeAttribute("readonly"));

  btnEdit.addEventListener("click", async () => {
    const isUnlocked = btnEdit.dataset.unlocked === "true";
    btnEdit.dataset.unlocked = (!isUnlocked).toString();
    btnEdit.textContent = isUnlocked ? "🔒" : "🔓";
    btnEdit.title = isUnlocked ? "Розблокувати поля?" : "Заблокувати поля?";

    // Зміна кольору кнопки
    if (!isUnlocked) {
      btnEdit.style.backgroundColor = "red";
      btnEdit.style.color = "white";
    } else {
      btnEdit.style.backgroundColor = "";
      btnEdit.style.color = "";
    }

    const fuelContainer =
      document.getElementById(carFuelInputId)?.parentElement;
    const fuelInput = document.getElementById(carFuelInputId);
    const incomeContainer =
      document.getElementById(carIncomeInputId)?.parentElement;
    const incomeInput = document.getElementById(carIncomeInputId);

    if (!fuelContainer || !fuelInput || !incomeContainer || !incomeInput)
      return;

    if (!isUnlocked) {
      // 🔓 Редагування УВІМКНЕНО

      // Розблокувати поля
      document.getElementById(carEngineInputId)?.removeAttribute("readonly");
      document.getElementById(carVinInputId)?.removeAttribute("readonly");
      document.getElementById(extraInputId)?.removeAttribute("readonly");

      // Налаштувати автозаповнення для всіх полів з унікальними даними
      setupEditingAutocompletes();

      // 🔁 ПАЛЬНЕ → SELECT
      if (!(fuelInput instanceof HTMLSelectElement)) {
        const currentFuel = (fuelInput as HTMLInputElement).value;
        const fuelOptions = ["Бензин", "Дизель", "Газ", "Гібрид", "Електро"];
        const fuelSelect = document.createElement("select");
        const defaultOption = document.createElement("option");
        defaultOption.value = "Невказано";
        defaultOption.textContent = "Невказано";
        fuelSelect.id = carFuelInputId;
        fuelSelect.className = "input-create-sakaz_narad";

        fuelOptions.forEach((fuel) => {
          const option = document.createElement("option");
          option.value = fuel;
          option.textContent = fuel;
          fuelSelect.appendChild(option);
        });

        fuelSelect.value = currentFuel;
        fuelContainer.replaceChild(fuelSelect, fuelInput);
      }

      // 🔁 ДЖЕРЕЛО → SELECT
      if (!(incomeInput instanceof HTMLSelectElement)) {
        try {
          const { data: incomeRows, error } = await supabase
            .from("incomes")
            .select("data");

          if (error) {
            console.error("❌ Помилка при запиті до income:", error.message);
            return;
          }

          const sources = [
            ...new Set(
              incomeRows
                .map((row: any) => row?.data?.Name)
                .filter(
                  (name: any) => typeof name === "string" && name.trim() !== ""
                )
            ),
          ];

          console.log("🔄 Джерела з Supabase:", sources);

          const incomeSelect = document.createElement("select");
          incomeSelect.id = carIncomeInputId;
          incomeSelect.className = "input-create-sakaz_narad";

          // Додай дефолтний варіант
          const defaultOption = document.createElement("option");
          defaultOption.value = "Невказано";
          defaultOption.textContent = "Невказано";
          incomeSelect.appendChild(defaultOption);

          sources.forEach((src) => {
            const option = document.createElement("option");
            option.value = src;
            option.textContent = src;
            incomeSelect.appendChild(option);
          });

          // Поточне значення в input → виставляємо у select
          const currentValue = (incomeInput as HTMLInputElement).value.trim();
          if (sources.includes(currentValue)) {
            incomeSelect.value = currentValue;
          }

          incomeContainer.replaceChild(incomeSelect, incomeInput);
        } catch (e) {
          console.error("💥 Виняток при завантаженні джерел:", e);
        }
      }
    } else {
      // 🔒 Редагування ВИМКНЕНО

      // Приховати іконки підтвердження при закритому замку
      const confirmIcons = document.getElementById("car-confirm-icons");
      if (confirmIcons) confirmIcons.style.display = "none";

      // Повернути readonly до текстових полів
      document
        .getElementById(carEngineInputId)
        ?.setAttribute("readonly", "true");
      document.getElementById(carVinInputId)?.setAttribute("readonly", "true");
      document.getElementById(extraInputId)?.setAttribute("readonly", "true");

      // Очистити автозаповнення редагування
      const editKeys = [
        "carModelEdit",
        "phoneEdit",
        "carNumberEdit",
        "carEngineEdit",
        "carVinEdit",
      ];
      editKeys.forEach((key) => {
        if (currentAutocompletes[key]) {
          const data = currentAutocompletes[key];
          const input = key.includes("carModel")
            ? carModelInput
            : key.includes("phone")
            ? phoneInput
            : key.includes("carNumber")
            ? carNumberInput
            : key.includes("carEngine")
            ? (document.getElementById(carEngineInputId) as HTMLInputElement)
            : (document.getElementById(carVinInputId) as HTMLInputElement);

          if (input && data) {
            input.removeEventListener("input", data.inputHandler);
            input.removeEventListener("focus", data.focusHandler);
            input.removeEventListener("blur", data.blurHandler);
          }
        }
      });

      // 🔁 ПАЛЬНЕ → INPUT
      if (fuelInput instanceof HTMLSelectElement) {
        const selectedValue = fuelInput.value;
        const newInput = document.createElement("input");
        newInput.id = carFuelInputId;
        newInput.className = "input-create-sakaz_narad";
        newInput.type = "text";
        newInput.readOnly = true;
        newInput.value = selectedValue;
        fuelContainer.replaceChild(newInput, fuelInput);
      }

      // 🔁 ДЖЕРЕЛО → INPUT
      if (incomeInput instanceof HTMLSelectElement) {
        const selectedValue = incomeInput.value;
        const newInput = document.createElement("input");
        newInput.id = carIncomeInputId;
        newInput.className = "input-create-sakaz_narad";
        newInput.type = "text";
        newInput.readOnly = true;
        newInput.value = selectedValue;
        incomeContainer.replaceChild(newInput, incomeInput);
      }

      // Повернути звичайне автозаповнення
      setupNormalAutocompletes();
    }
  });

  closeBtn.addEventListener("click", () => modalElement.remove());

  // Завантажити всіх клієнтів
  const { data: allClients } = await supabase
    .from("clients")
    .select("client_id, data");

  const clientOptions =
    allClients
      ?.map((c) => ({
        id: c.client_id,
        fullName: c.data?.["ПІБ"] || "",
        phone: c.data?.["Телефон"] || "",
        data: c.data || {},
      }))
      .filter((c) => c.fullName)
      .sort((a, b) => a.fullName.localeCompare(b.fullName)) || [];

  // Завантажити всі автомобілі
  const { data: allCars } = await supabase
    .from("cars")
    .select("cars_id, client_id, data");

  const allCarItems =
    allCars
      ?.map((c) => ({
        ...(c.data || {}),
        id: c.cars_id,
        client_id: c.client_id,
      }))
      .filter((c) => c["Номер авто"] || c["Авто"])
      .sort((a, b) =>
        (a["Авто"] || "").toString().localeCompare((b["Авто"] || "").toString())
      ) || [];

  // Функція для отримання автомобілів конкретного клієнта
  const getCarsForClient = (clientId: string) => {
    return allCarItems.filter((cars) => cars.client_id === clientId);
  };

  // Функція для отримання телефонів конкретного клієнта - повертає всі телефони як окремі варіанти
  const getPhonesForClient = (clientId: string) => {
    const client = clientOptions.find((c) => c.id === clientId);
    if (!client || !client.data || !client.data["Телефон"]) return [];

    const phoneData = client.data["Телефон"];
    if (typeof phoneData !== "string") return [];

    // Розділити телефони за комою/крапкою з комою та створити окремі варіанти для кожного
    const phones = phoneData
      .split(/[,;]/)
      .map((phone) => phone.trim())
      .filter((phone) => phone);
    return phones.map((phone) => ({
      ...client,
      phone: phone,
      displayPhone: phone,
    }));
  };

  //Кнопка закриття вікна так або ні при зберігання
  btnSave.addEventListener("click", async () => {
    const isEditUnlocked = btnEdit.dataset.unlocked === "true";

    if (!isEditUnlocked) {
      showLockToggleMessage(
        false,
        "🔓 Спочатку розблокуйте форму для редагування"
      );
      return;
    }

    const confirmed = await showSavePromptModal();
    if (!confirmed) {
      console.log("❌ Збереження скасовано");
      const confirmOverlay = document.getElementById(savePromptModalId);
      if (confirmOverlay) confirmOverlay.classList.remove("active");
      return;
    }

    console.log("📋 Дані з форми:", getModalFormValues());
    await saveClientAndCarToDatabase(); // ⬅️ зберегти
    await loadActsTable (); // оновити таблицю
    document.getElementById(modalOverlayId)?.remove();

    const confirmOverlay = document.getElementById(savePromptModalId);
    if (confirmOverlay) confirmOverlay.classList.remove("active");
  });

  // Функція для налаштування автозаповнень автомобілів з відфільтрованими даними
  const setupCarAutocompletes = (carItems: any[], selectedCar?: any) => {
    // Якщо обрано конкретний автомобіль, відфільтрувати номери авто тільки для цього авто
    const carNumberItems = selectedCar ? [selectedCar] : carItems;

    // Налаштування автозаповнення номера авто - тільки для обраної моделі авто
    setupAutocomplete(
      carNumberInput,
      carNumberList,
      carNumberItems,
      (c) => c["Номер авто"] || "",
      handleCarSelection,
      true,
      "carNumber"
    );

    // Налаштування автозаповнення моделі авто - всі авто для клієнта
    setupAutocomplete(
      carModelInput,
      carModelList,
      carItems,
      (c) => (c["Авто"] || "").toString().trim(),
      (selectedCarFromModel) => {
        handleCarSelection(selectedCarFromModel);
        // Оновити автозаповнення номера авто, щоб показувати тільки номер цього авто
        setupAutocomplete(
          carNumberInput,
          carNumberList,
          [selectedCarFromModel],
          (c) => c["Номер авто"] || "",
          handleCarSelection,
          true,
          "carNumber"
        );
      },
      true,
      "carModel"
    );
  };

  // Функція для налаштування автозаповнення телефонів з відфільтрованими даними
  const setupPhoneAutocomplete = (phoneItems: any[]) => {
    setupAutocomplete(
      phoneInput,
      phoneList,
      phoneItems,
      (c) => c.displayPhone || c.phone || "",
      async (selectedClient) => {
        // Заповнити інформацію про клієнта
        await fillClientInfo(selectedClient.id);
        // Оновити автозаповнення авто тільки для цього клієнта
        const clientCars = getCarsForClient(selectedClient.id);

        // Автоматично заповнити перший автомобіль якщо доступний
        let selectedCar = null;
        if (clientCars.length > 0) {
          selectedCar = clientCars[0];
          fillCarFields(selectedCar);
        }

        setupCarAutocompletes(clientCars, selectedCar);
      },
      true,
      "phone"
    );
  };

  // Функція для обробки вибору автомобіля
  const handleCarSelection = async (car: any) => {
    fillCarFields(car);
    const ownerData = await fetchClientData(car.client_id);
    if (ownerData) {
      clientInput.value = ownerData["ПІБ"] || "";
      phoneInput.value = ownerData["Телефон"] || "";
      extraInput.value = ownerData["Додаткові"] || "";
      carIncomeInput.value = ownerData["Джерело"] || "";

      //Вивести client_id та  car.id
      if (isLocked()) {
        if (car.id) selectedCarId = car.id;
        if (car.client_id) selectedClientId = car.client_id;
      } else {
        console.log("🔓 Замок відкритий — ID не збережено");
      }

      // Оновити автозаповнення, щоб показувати тільки дані цього клієнта
      const clientCars = getCarsForClient(car.client_id);
      const clientPhones = getPhonesForClient(car.client_id);

      // Передати обраний автомобіль, щоб обмежити варіанти номерів авто цим конкретним авто
      setupCarAutocompletes(clientCars, car);
      setupPhoneAutocomplete(clientPhones);
    }
  };

  // Функція для налаштування звичайних автозаповнень
  const setupNormalAutocompletes = () => {
    // 1. При виборі власника за іменем (ПІБ)
    setupAutocomplete(
      clientInput,
      clientList,
      clientOptions,
      (c) => c.fullName || "",
      async (selectedClient) => {
        const isEditUnlocked = btnEdit.dataset.unlocked === "true";

        if (isEditUnlocked) {
          // ❌ Якщо замок відкритий — підставляємо тільки ПІБ, але нічого не записуємо в client_id
          clientInput.value = selectedClient.fullName;
          console.log("🔓 Відкрито: дані не підтягуються автоматично");
          return;
        }

        // 🔒 Якщо замок закритий — виконуємо звичайне автозаповнення
        await fillClientInfo(selectedClient.id);
        selectedClientId = selectedClient.id;

        const clientCars = getCarsForClient(selectedClient.id);
        let selectedCar = null;
        if (clientCars.length > 0) {
          selectedCar = clientCars[0];
          fillCarFields(selectedCar);

          if (selectedCar?.id && selectedCar?.client_id) {
            selectedCarId = selectedCar.id;
            selectedClientId = selectedCar.client_id;
          }
        }

        const clientPhones = getPhonesForClient(selectedClient.id);
        setupCarAutocompletes(clientCars, selectedCar);
        setupPhoneAutocomplete(clientPhones);
      },
      true,
      "client"
    );

    // Початкове налаштування - показати всі дані
    setupCarAutocompletes(allCarItems);
    setupPhoneAutocomplete(clientOptions);
  };

  // Початкове налаштування звичайних автозаповнень
  setupNormalAutocompletes();
}

// Виклик для відкриття модального вікна
document.addEventListener("DOMContentLoaded", () => {
  document
    .querySelector('[data-action="openHome"]')
    ?.addEventListener("click", (e) => {
      e.preventDefault();
      showModalCreateSakazNarad();
    });
});

// ✅ Повідомлення для редагування
export function showLockToggleMessage(
  isUnlocked: boolean,
  customText?: string
) {
  const note = document.createElement("div");
  note.textContent =
    customText ||
    (isUnlocked
      ? "🔓 Розблоковано для редагування"
      : "🔒 Заблоковано редагування");

  note.style.position = "fixed";
  note.style.left = "50%";
  note.style.bottom = "50%";
  note.style.transform = "translateX(-50%)";
  note.style.backgroundColor = isUnlocked ? "#4caf50" : "#f44336";
  note.style.color = "white";
  note.style.padding = "12px 24px";
  note.style.borderRadius = "8px";
  note.style.zIndex = "10001";
  note.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
  note.style.fontSize = "16px";
  document.body.appendChild(note);

  setTimeout(() => {
    note.remove();
  }, 1500);
}
