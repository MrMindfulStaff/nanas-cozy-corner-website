const header = document.querySelector("[data-header]");
const forms = document.querySelectorAll("form[data-endpoint]");
const modalOpenButtons = document.querySelectorAll("[data-modal-open]");
const modalCloseButtons = document.querySelectorAll("[data-modal-close]");
let activeModal = null;
let previousFocus = null;

const updateHeader = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 12);
};

const serializeForm = (form) => Object.fromEntries(new FormData(form).entries());

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

const closeModal = () => {
  if (!activeModal) return;

  activeModal.hidden = true;
  document.body.classList.remove("modal-open");

  if (previousFocus) {
    previousFocus.focus();
  }

  activeModal = null;
  previousFocus = null;
};

modalOpenButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const modal = document.getElementById(button.dataset.modalOpen);
    if (!modal) return;

    previousFocus = button;
    activeModal = modal;
    modal.hidden = false;
    document.body.classList.add("modal-open");

    const firstField = modal.querySelector("input, select, textarea, button:not([data-modal-close])");
    if (firstField) firstField.focus();
  });
});

modalCloseButtons.forEach((button) => {
  button.addEventListener("click", closeModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});

forms.forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const endpoint = form.dataset.endpoint;
    const payload = serializeForm(form);
    const note = form.querySelector(".form-note");

    console.info("Nana's Brain-ready payload", {
      endpoint,
      payload,
    });

    form.reset();
    note.textContent = "Thanks, we received your submission. One of our staff members will contact you within 2 business days.";
  });
});
