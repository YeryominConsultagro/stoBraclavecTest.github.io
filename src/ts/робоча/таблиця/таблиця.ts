import { supabase } from "../../вхід/supabaseClient";
import {
  createModal,
  showModal,
} from "../вікно_відкриття_заказ_наряду/заказ_наряд";

// =============================================================================
// КОНСТАНТИ ТА ГЛОБАЛЬНІ ЗМІННІ
// =============================================================================

const HEADERS: string[] = [
  "№ акту",
  "Дата",
  "Клієнт 🔽",
  "Автомобіль",
  "Сумма",
];

let actsGlobal: any[] = [];
let clientsGlobal: any[] = [];
let carsGlobal: any[] = [];
let sortByDateStep = 0;

// =============================================================================
// УТИЛІТИ ДЛЯ РОБОТИ З ДАНИМИ
// =============================================================================

/**
 * Безпечне парсування JSON
 */
function safeParseJSON(data: any): any {
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  return data;
}

/**
 * Форматування дати у DD.MM.YYYY
 */
function formatDate(date: Date): string {
  return `${date.getDate().toString().padStart(2, "0")}.${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}.${date.getFullYear()}`;
}

/**
 * Форматування телефону
 */
function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("380")) {
    const code = digits.slice(2, 5);
    const part1 = digits.slice(5, 8);
    const part2 = digits.slice(8, 10);
    const part3 = digits.slice(10, 12);
    return `+38 (${code}) ${part1}-${part2}-${part3}`;
  }

  return phone;
}

/**
 * Валідація формату дати DD.MM.YYYY
 */
function validateDateFormat(dateStr: string): boolean {
  const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;
  if (!dateRegex.test(dateStr)) return false;

  const [d, m, y] = dateStr.split(".");
  const day = parseInt(d);
  const month = parseInt(m);
  const year = parseInt(y);

  return (
    day >= 1 &&
    day <= 31 &&
    month >= 1 &&
    month <= 12 &&
    year >= 2000 &&
    year <= 2100
  );
}

// =============================================================================
// ОБРОБКА ДАНИХ АКТІВ
// =============================================================================

/**
 * Отримання інформації про клієнта
 */
function getClientInfo(act: any, clients: any[]): string {
  const client = clients?.find((c) => c.client_id === act.client_id);
  const clientData = safeParseJSON(client?.data);

  const pib = clientData?.["ПІБ"] || "Невідомо";
  const phone = clientData?.["Телефон"] || "";

  return phone ? `${pib} ${phone}` : pib;
}

/**
 * Отримання інформації про авто
 */
function getCarInfo(act: any, cars: any[]): string {
  const car = cars?.find((c) => c.cars_id === act.cars_id);
  const carData = safeParseJSON(car?.data);

  const номерАвто = carData?.["Номер авто"] || "";
  const назваАвто = carData?.["Авто"] || "";

  return `${номерАвто} ${назваАвто}`.trim();
}

/**
 * Отримання суми з акту
 */
function getActAmount(act: any): string {
  const actData = safeParseJSON(act.info || act.data || act.details);

  const rawAmount =
    actData?.["Загальна сума"] ||
    actData?.["total"] ||
    actData?.["amount"] ||
    act.total ||
    act.amount;

  if (rawAmount === undefined) return "0 грн";

  const num = Number(rawAmount);
  return isNaN(num) ? "0 грн" : `${num.toLocaleString("uk-UA")} грн`;
}

/**
 * Отримання дати з акту
 */
function getActDate(act: any): string {
  if (!act.date_on) return "-";

  const d = new Date(act.date_on);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

/**
 * Перевірка чи акт закритий
 */
function isActClosed(act: any): boolean {
  return act.date_off && !isNaN(Date.parse(act.date_off));
}

// =============================================================================
// РЕНДЕРИНГ ТАБЛИЦІ
// =============================================================================

/**
 * Створення комірки з клієнтом
 */
function createClientCell(clientInfo: string): HTMLTableCellElement {
  const td = document.createElement("td");

  const phones = [...clientInfo.matchAll(/\+380\d{9}/g)].map((m) => m[0]);
  let pibOnly = clientInfo;
  phones.forEach((p) => {
    pibOnly = pibOnly.replace(p, "").trim();
  });

  td.innerHTML = `<div>${pibOnly}</div>`;

  phones.forEach((p) => {
    const formatted = formatPhone(p);
    td.innerHTML += `<div class="phone-blue-italic">${formatted}</div>`;
  });

  td.addEventListener("click", () => showModal());
  return td;
}

/**
 * Створення комірки з авто
 */
function createCarCell(carInfo: string): HTMLTableCellElement {
  const td = document.createElement("td");

  const parts = carInfo.split(" ");
  const номер = parts[0] || "";
  const назва = parts.slice(1).join(" ") || "";

  td.innerHTML = `<div>${номер}</div>${
    назва ? `<div><span class="car-red-bold">${назва}</span></div>` : ""
  }`;

  td.addEventListener("dblclick", () => showModal());
  return td;
}

/**
 * Створення стандартної комірки
 */
function createStandardCell(content: string): HTMLTableCellElement {
  const td = document.createElement("td");
  td.textContent = content;
  td.addEventListener("dblclick", () => showModal());
  return td;
}

/**
 * Рендеринг рядків таблиці
 */
function renderActsRows(
  acts: any[],
  clients: any[],
  cars: any[],
  tbody: HTMLTableSectionElement
): void {
  tbody.innerHTML = "";

  acts.forEach((act) => {
    const isClosed = isActClosed(act);
    const lockIcon = isClosed ? "🔒" : "🗝️";

    const cellsData = [
      `${lockIcon} ${act.act_id?.toString() || "N/A"}`,
      getActDate(act),
      getClientInfo(act, clients),
      getCarInfo(act, cars),
      getActAmount(act),
    ];

    const row = document.createElement("tr");
    row.classList.add(isClosed ? "row-closed" : "row-open");

    cellsData.forEach((cellData, i) => {
      let td: HTMLTableCellElement;

      if (HEADERS[i].includes("Клієнт")) {
        td = createClientCell(cellData);
      } else if (HEADERS[i] === "Автомобіль") {
        td = createCarCell(cellData);
      } else {
        td = createStandardCell(cellData);
      }

      row.appendChild(td);
    });

    tbody.appendChild(row);
  });
}

// =============================================================================
// СОРТУВАННЯ
// =============================================================================

/**
 * Сортування актів
 */
function sortActs(): void {
  if (sortByDateStep === 0) {
    // Сортування за статусом (відкриті зверху)
    actsGlobal.sort((a, b) => {
      const aOpen = !isActClosed(a);
      const bOpen = !isActClosed(b);
      if (aOpen && !bOpen) return -1;
      if (!aOpen && bOpen) return 1;
      return 0;
    });
    sortByDateStep = 1;
  } else {
    // Сортування за датою (новіші зверху)
    actsGlobal.sort(
      (a, b) => new Date(b.date_on).getTime() - new Date(a.date_on).getTime()
    );
    sortByDateStep = 0;
  }
}

// =============================================================================
// РОБОТА З ДАТАМИ
// =============================================================================

/**
 * Отримання діапазону дат за замовчуванням (останній місяць)
 */
function getDefaultDateRange(): string {
  const today = new Date();
  const lastMonth = new Date(
    today.getFullYear(),
    today.getMonth() - 1,
    today.getDate()
  );

  return `${formatDate(lastMonth)} - ${formatDate(today)}`;
}

/**
 * Валідація та отримання діапазону дат
 */
function getDateRange(): { dateFrom: string; dateTo: string } | null {
  const input = document.getElementById("dateRangePicker") as HTMLInputElement;
  const dateRangeValue = input?.value?.trim();

  // Встановлення значення за замовчуванням
  if (!dateRangeValue) {
    console.warn(
      "⚠️ Діапазон дат порожній. Завантажуємо всі акти за останній місяць."
    );
    input.value = getDefaultDateRange();
  }

  const currentValue = input.value.trim();

  // Перевірка формату діапазону
  if (!currentValue.includes(" - ")) {
    console.error(
      "❌ Невірний формат діапазону. Очікується: DD.MM.YYYY - DD.MM.YYYY"
    );
    alert(
      "Невірний формат дати. Використовуйте формат: DD.MM.YYYY - DD.MM.YYYY"
    );
    return null;
  }

  const [startStr, endStr] = currentValue.split(" - ");

  // Валідація формату дат
  if (!validateDateFormat(startStr) || !validateDateFormat(endStr)) {
    console.error("❌ Невірний формат дати. Використовуйте DD.MM.YYYY");
    alert("Невірний формат дати. Використовуйте DD.MM.YYYY");
    return null;
  }

  // Конвертація у формат YYYY-MM-DD HH:mm:ss
  try {
    const [dateFrom, dateTo] = [startStr, endStr].map((str, i) => {
      const [d, m, y] = str.split(".");
      const full = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
      return i === 0 ? `${full} 00:00:00` : `${full} 23:59:59`;
    });

    return { dateFrom, dateTo };
  } catch (error) {
    console.error("❌ Помилка конвертації дати:", error);
    alert(
      `Невірна дата: ${
        error instanceof Error ? error.message : "Невідома помилка"
      }`
    );
    return null;
  }
}

// =============================================================================
// ЗАВАНТАЖЕННЯ ДАНИХ
// =============================================================================

/**
 * Завантаження актів з бази даних
 */
async function loadActsFromDB(
  dateFrom: string,
  dateTo: string
): Promise<any[] | null> {
  const { data: acts, error: actsError } = await supabase
    .from("acts")
    .select("*")
    .gte("date_on", dateFrom)
    .lte("date_on", dateTo)
    .order("act_id", { ascending: false });

  if (actsError) {
    console.error("❌ Помилка при отриманні актів:", actsError);
    alert(`Помилка завантаження актів: ${actsError.message}`);
    return null;
  }

  return acts || [];
}

/**
 * Завантаження клієнтів з бази даних
 */
async function loadClientsFromDB(): Promise<any[] | null> {
  const { data: clients, error: clientError } = await supabase
    .from("clients")
    .select("client_id, data");

  if (clientError) {
    console.error("❌ Помилка при отриманні клієнтів:", clientError);
    alert(`Помилка завантаження клієнтів: ${clientError.message}`);
    return null;
  }

  return clients || [];
}

/**
 * Завантаження авто з бази даних
 */
async function loadCarsFromDB(): Promise<any[] | null> {
  const { data: cars, error: carsError } = await supabase
    .from("cars")
    .select("cars_id, data");

  if (carsError) {
    console.error("❌ Помилка при отриманні авто:", carsError);
    alert(`Помилка завантаження авто: ${carsError.message}`);
    return null;
  }

  return cars || [];
}

// =============================================================================
// СТВОРЕННЯ ТАБЛИЦІ
// =============================================================================

/**
 * Створення заголовку таблиці
 */
function createTableHeader(): HTMLTableSectionElement {
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  HEADERS.forEach((header) => {
    const th = document.createElement("th");
    th.textContent = header;

    th.addEventListener("click", () => {
      if (header === "Клієнт 🔽") {
        sortActs();
        updateTableBody();
      }
    });

    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  return thead;
}

/**
 * Оновлення тіла таблиці
 */
function updateTableBody(): void {
  const table = document.querySelector(
    "#table-container-modal-sakaz_narad table"
  );
  if (!table) return;

  const newTbody = document.createElement("tbody");
  renderActsRows(actsGlobal, clientsGlobal, carsGlobal, newTbody);

  const oldTbody = table.querySelector("tbody");
  if (oldTbody) oldTbody.replaceWith(newTbody);
}

/**
 * Створення повної таблиці
 */
function createTable(): HTMLTableElement {
  const table = document.createElement("table");
  table.style.width = "100%";
  table.style.borderCollapse = "collapse";

  const thead = createTableHeader();
  const tbody = document.createElement("tbody");

  renderActsRows(actsGlobal, clientsGlobal, carsGlobal, tbody);

  table.appendChild(thead);
  table.appendChild(tbody);

  return table;
}

/**
 * Відображення повідомлення про відсутність даних
 */
function showNoDataMessage(dateRange: string): void {
  const container = document.getElementById(
    "table-container-modal-sakaz_narad"
  );
  if (container) {
    container.innerHTML = `<div style="text-align: center; padding: 20px; color: #666;">
      Немає актів у діапазоні дат: ${dateRange}
    </div>`;
  }
}

// =============================================================================
// ОСНОВНІ ФУНКЦІЇ
// =============================================================================

/**
 * Завантаження та відображення таблиці актів
 */
export async function loadActsTable(): Promise<void> {
  try {
    // 1. Отримання діапазону дат
    const dateRange = getDateRange();
    if (!dateRange) return;

    const { dateFrom, dateTo } = dateRange;

    // 2. Завантаження даних з бази
    const [acts, clients, cars] = await Promise.all([
      loadActsFromDB(dateFrom, dateTo),
      loadClientsFromDB(),
      loadCarsFromDB(),
    ]);

    if (acts === null || clients === null || cars === null) {
      return; // Помилки вже оброблені у відповідних функціях
    }

    // 3. Збереження даних глобально
    actsGlobal = acts;
    clientsGlobal = clients;
    carsGlobal = cars;

    // 4. Перевірка наявності актів
    if (actsGlobal.length === 0) {
      console.warn("⚠️ Немає актів у вказаному діапазоні дат");
      const input = document.getElementById(
        "dateRangePicker"
      ) as HTMLInputElement;
      showNoDataMessage(input?.value || "невідомий");
      return;
    }

    // 5. Створення та відображення таблиці
    const table = createTable();
    const container = document.getElementById(
      "table-container-modal-sakaz_narad"
    );

    if (container) {
      container.innerHTML = "";
      container.appendChild(table);
    } else {
      console.error(
        "❌ Контейнер table-container-modal-sakaz_narad не знайдено."
      );
    }
  } catch (error) {
    console.error("💥 Критична помилка:", error);
    alert(
      `Критична помилка: ${
        error instanceof Error ? error.message : "Невідома помилка"
      }`
    );
  }
}

/**
 * Примусове оновлення таблиці
 */
export function refreshActsTable(): void {
  loadActsTable();
}

// =============================================================================
// ВІДСТЕЖЕННЯ ЗМІН
// =============================================================================

/**
 * Відстеження змін у dateRangePicker
 */
function watchDateRangeChanges(): void {
  const dateRangePicker = document.getElementById(
    "dateRangePicker"
  ) as HTMLInputElement;
  if (!dateRangePicker) return;

  let lastValue = dateRangePicker.value;

  const checkInterval = setInterval(() => {
    const currentValue = dateRangePicker.value;

    if (currentValue !== lastValue) {
      lastValue = currentValue;

      setTimeout(() => {
        if (dateRangePicker.value === currentValue) {
          loadActsTable();
        }
      }, 300);
    }
  }, 500);

  window.addEventListener("beforeunload", () => {
    clearInterval(checkInterval);
  });
}

// =============================================================================
// ІНІЦІАЛІЗАЦІЯ
// =============================================================================

/**
 * Ініціалізація модулю таблиці актів
 */
export function initializeActsTable(): void {
  createModal(); // Створити модальне вікно одразу
  loadActsTable(); // Завантажити таблицю при ініціалізації
  watchDateRangeChanges(); // Запустити відстеження змін дати
}

// Викликати ініціалізацію при завантаженні модулю
initializeActsTable();
