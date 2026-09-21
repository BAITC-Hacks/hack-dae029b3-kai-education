const form = document.querySelector("#form");
const input = document.querySelector("#question");
const send = document.querySelector("#send");
const messages = document.querySelector("#messages");
const conversation = document.querySelector("#conversation");
const status = document.querySelector("#status");
const topics = [...document.querySelectorAll("[data-question]")];
const storageKey = "kai-faq-history-v1";
let history = [];
let controller = null;

function renderMessage(role, text) {
  const row = document.createElement("div");
  row.className = `message ${role}`;
  if (role === "bot") {
    const avatar = document.createElement("span");
    avatar.className = "avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = "k/";
    row.append(avatar);
  }
  const bubble = document.createElement("p");
  bubble.textContent = text;
  row.append(bubble);
  messages.append(row);
}
function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(history.slice(-100)));
  } catch {
    /* Chat works without storage. */
  }
}
function add(role, text) {
  history.push({ role, text });
  renderMessage(role, text);
  save();
  conversation.scrollTop = conversation.scrollHeight;
}
function setBusy(busy) {
  send.disabled = busy || !input.value.trim();
  topics.forEach((button) => {
    button.disabled = busy;
  });
  form.setAttribute("aria-busy", String(busy));
}
async function ask(question) {
  if (controller || !question.trim()) return;
  const request = new AbortController();
  controller = request;
  add("user", question.trim());
  input.value = "";
  setBusy(true);
  status.textContent = "Ищу ответ…";
  const timeout = setTimeout(() => request.abort(), 10000);
  try {
    const response = await fetch(
      `/api/answer?q=${encodeURIComponent(question.trim())}`,
      { signal: request.signal },
    );
    if (!response.ok) throw new Error("Request failed");
    const data = await response.json();
    if (controller !== request) return;
    add("bot", data.answer);
    status.textContent = "Ответы из FAQ команды";
  } catch {
    if (controller !== request) return;
    add(
      "bot",
      "Не удалось получить ответ. Проверьте, что сервер запущен, и отправьте вопрос ещё раз.",
    );
    status.textContent = "Нет связи с помощником";
  } finally {
    clearTimeout(timeout);
    if (controller === request) {
      controller = null;
      setBusy(false);
      input.focus();
    }
  }
}
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
  if (Array.isArray(saved))
    history = saved
      .filter(
        (item) =>
          item &&
          ["user", "bot"].includes(item.role) &&
          typeof item.text === "string",
      )
      .slice(-100);
} catch {
  history = [];
}
history.forEach((item) => renderMessage(item.role, item.text));
conversation.scrollTop = conversation.scrollHeight;
input.addEventListener("input", () => setBusy(Boolean(controller)));
form.addEventListener("submit", (event) => {
  event.preventDefault();
  ask(input.value);
});
topics.forEach((button) =>
  button.addEventListener("click", () => ask(button.dataset.question)),
);
document.querySelector("#reset").addEventListener("click", () => {
  if (controller) {
    controller.abort();
    controller = null;
  }
  history = [];
  messages.replaceChildren();
  save();
  input.value = "";
  status.textContent = "Ответы из FAQ команды";
  setBusy(false);
  input.focus();
});
