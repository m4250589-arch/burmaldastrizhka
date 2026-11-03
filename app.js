'use strict';

const services = {
  haircut: { name: 'Мужская стрижка', price: 1800, duration: 60 },
  beard: { name: 'Борода и усы', price: 1000, duration: 30 },
  combo: { name: 'Стрижка + борода', price: 2500, duration: 90 },
  clipper: { name: 'Под машинку', price: 800, duration: 30 }
};
const masters = { any: 'Любой мастер', max: 'Макс', sanya: 'Саня', dan: 'Дэн' };
const dialog = document.querySelector('#booking-dialog');
const demoDialog = document.querySelector('#demo-dialog');
const form = document.querySelector('#booking-form');
const serviceInput = document.querySelector('#service');
const masterInput = document.querySelector('#master');
const dateInput = document.querySelector('#date');
const slotsContainer = document.querySelector('#time-slots');
const error = document.querySelector('#booking-error');
const bookingMain = document.querySelector('#booking-main');
const success = document.querySelector('#booking-success');
const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('#mobile-menu');
let selectedTime = '';
let lastTrigger = null;

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function money(value) { return `${new Intl.NumberFormat('ru-RU').format(value)} ₽`; }
function setDateBounds() {
  const now = new Date();
  dateInput.min = dateKey(now);
  const lastDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30);
  dateInput.max = dateKey(lastDay);
  if (!dateInput.value || dateInput.value < dateInput.min || dateInput.value > dateInput.max) {
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    dateInput.value = dateKey(tomorrow);
  }
}
function timeIsAvailable(time) {
  if (!dateInput.value || dateInput.value < dateInput.min || dateInput.value > dateInput.max || !dateInput.validity.valid) return false;
  const [hours, minutes] = time.split(':').map(Number);
  const service = services[serviceInput.value];
  const startMinutes = hours * 60 + minutes;
  return startMinutes >= 600 && startMinutes + service.duration <= 1260 && new Date(`${dateInput.value}T${time}:00`).getTime() > Date.now();
}
function renderSlots() {
  selectedTime = '';
  slotsContainer.replaceChildren();
  error.hidden = true;
  const service = services[serviceInput.value];
  document.querySelector('#duration-summary').textContent = `${service.duration} минут`;
  document.querySelector('#price-summary').textContent = money(service.price);
  if (!dateInput.value || !dateInput.validity.valid) {
    const note = document.createElement('p');
    note.className = 'no-slots';
    note.textContent = 'Выбери дату в пределах ближайших 30 дней.';
    slotsContainer.append(note);
    return;
  }
  let availableCount = 0;
  for (let minutes = 600; minutes + service.duration <= 1260; minutes += 60) {
    const time = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'time-slot';
    button.textContent = time;
    button.disabled = !timeIsAvailable(time);
    button.setAttribute('aria-label', `${time}${button.disabled ? ' — время уже прошло' : ''}`);
    button.setAttribute('aria-pressed', 'false');
    if (!button.disabled) availableCount++;
    button.addEventListener('click', () => {
      selectedTime = time;
      for (const slot of slotsContainer.querySelectorAll('button')) slot.setAttribute('aria-pressed', String(slot === button));
      error.hidden = true;
    });
    slotsContainer.append(button);
  }
  if (!availableCount) {
    const note = document.createElement('p');
    note.className = 'no-slots';
    note.textContent = 'На эту дату время уже прошло. Выбери другой день.';
    slotsContainer.append(note);
  }
}
function closeMenu() {
  mobileMenu.hidden = true;
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Открыть меню');
}
function showDialog(target, trigger) {
  closeMenu();
  lastTrigger = trigger;
  target.showModal();
  document.body.classList.add('modal-open');
}
function openBooking(trigger) {
  if (trigger.dataset.service && services[trigger.dataset.service]) serviceInput.value = trigger.dataset.service;
  if (trigger.dataset.master && masters[trigger.dataset.master]) masterInput.value = trigger.dataset.master;
  bookingMain.hidden = false;
  success.hidden = true;
  dialog.setAttribute('aria-labelledby', 'booking-title');
  setDateBounds();
  renderSlots();
  showDialog(dialog, trigger);
}
document.querySelectorAll('[data-book]').forEach(button => button.addEventListener('click', () => openBooking(button)));
document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
for (const target of [dialog, demoDialog]) {
  target.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    lastTrigger?.focus();
  });
  target.addEventListener('click', event => {
    if (event.target !== target) return;
    const box = target.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) target.close();
  });
}
document.querySelector('#about-demo').addEventListener('click', event => showDialog(demoDialog, event.currentTarget));
serviceInput.addEventListener('change', renderSlots);
masterInput.addEventListener('change', renderSlots);
dateInput.addEventListener('change', renderSlots);
form.addEventListener('submit', event => {
  event.preventDefault();
  const today = dateKey(new Date());
  if (dateInput.min !== today) { setDateBounds(); renderSlots(); }
  if (!selectedTime || !timeIsAvailable(selectedTime)) {
    error.textContent = selectedTime ? 'Это время уже недоступно. Выбери другой день или время.' : 'Выбери удобное время.';
    error.hidden = false;
    slotsContainer.querySelector('button:not(:disabled)')?.focus();
    return;
  }
  const service = services[serviceInput.value];
  const formattedDate = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' }).format(new Date(`${dateInput.value}T12:00:00`));
  const details = document.querySelector('#booking-details');
  details.replaceChildren();
  for (const [label, value] of [['Услуга', service.name], ['Мастер', masters[masterInput.value]], ['Дата и время', `${formattedDate}, ${selectedTime}`], ['Продолжительность', `${service.duration} минут`], ['Стоимость', money(service.price)]]) {
    const row = document.createElement('div');
    const term = document.createElement('dt');
    const description = document.createElement('dd');
    term.textContent = label;
    description.textContent = value;
    row.append(term, description);
    details.append(row);
  }
  bookingMain.hidden = true;
  success.hidden = false;
  dialog.setAttribute('aria-labelledby', 'success-title');
  dialog.scrollTop = 0;
  document.querySelector('#restart-booking').focus();
});
document.querySelector('#restart-booking').addEventListener('click', () => {
  success.hidden = true;
  bookingMain.hidden = false;
  dialog.setAttribute('aria-labelledby', 'booking-title');
  setDateBounds();
  renderSlots();
  serviceInput.focus();
});
menuToggle.addEventListener('click', () => {
  const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
  mobileMenu.hidden = expanded;
  menuToggle.setAttribute('aria-expanded', String(!expanded));
  menuToggle.setAttribute('aria-label', expanded ? 'Открыть меню' : 'Закрыть меню');
});
mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
window.matchMedia('(min-width: 761px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
document.querySelector('#year').textContent = new Date().getFullYear();
