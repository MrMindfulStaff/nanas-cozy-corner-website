const header = document.querySelector("[data-header]");
const forms = document.querySelectorAll("form[data-endpoint]");

const updateHeader = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 12);
};

const serializeForm = (form) => Object.fromEntries(new FormData(form).entries());

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

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
