(() => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('site-nav');
  if (toggle && nav) {
    document.body.classList.add('menu-ready');
    const closeMenu = () => { nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); };
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    });
    nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) { closeMenu(); toggle.focus(); }
    });
  }
  // A future measurement service can subscribe. These events contain no form
  // values; emitting one does not mean it has been recorded by analytics.
  const track = (name, kind) => window.dispatchEvent(new CustomEvent('nana:interaction', {
    detail: { name, kind, page: window.location.pathname }
  }));
  document.querySelectorAll('a[href^="tel:"]').forEach(link => link.addEventListener('click', () => track('call_click', 'phone')));
  const form = document.querySelector('form[data-inquiry]');
  if (!form) return;
  const panel = form.closest('.form-card');
  const status = form.querySelector('.form-status');
  const submit = form.querySelector('[data-submit]');
  const delivery = panel.querySelector('[data-delivery-message]');
  const draft = panel.querySelector('.email-draft');
  const draftText = draft.querySelector('[data-draft]');
  const mailLink = draft.querySelector('[data-email-link]');
  const kind = form.dataset.inquiry;
  const titles = { availability:'Childcare availability', tour:'Tour request', ehs:'Early Head Start question', contact:'Website inquiry', referral:'Referral question' };
  const labels = { parent_name:'Name', contact:'Reply by phone or email', child_age:'Child’s age', start_timing:'Start timing', schedule:'Days and hours needed', transportation:'Transportation', message:'Message', zip_code:'ZIP code', preferred_date:'Preferred tour date', preferred_time:'Preferred time of day', reason:'Question about', referrer_type:'Connection to Nana’s' };
  let online = false, widgetId = null, sending = false, started = false;
  let requestId = crypto.randomUUID();
  const contact = form.elements.namedItem('contact');
  const setStatus = (message, state = '') => { status.textContent = message; status.className = `form-status ${state}`; };
  const emailMode = () => {
    online = false;
    submit.innerHTML = 'Review email <span aria-hidden="true">→</span>';
    delivery.textContent = 'Share a few details below to prepare an email. You’ll review and send it from your email app.';
  };
  const dataFromForm = () => Object.fromEntries([...new FormData(form)].filter(([key]) => key !== 'cf-turnstile-response'));
  const showDraft = data => {
    const lines = ['Hello Nana’s Cozy Corner,', '', titles[kind], '', ...Object.entries(labels).filter(([key]) => data[key]?.trim()).map(([key,label]) => `${label}: ${data[key].trim()}`), '', `Sent from the ${kind} page at www.nanascozycorner.com.`];
    draftText.value = lines.join('\n');
    mailLink.href = `mailto:Info@nanascozycorner.com?subject=${encodeURIComponent(`Nana’s Cozy Corner — ${titles[kind]}`)}&body=${encodeURIComponent(draftText.value)}`;
    draft.hidden = false;
    setStatus('Your message is prepared, but has not been sent. Use the email options below.');
    draft.scrollIntoView({ block:'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    mailLink.focus({ preventScroll:true });
    track('email_draft_prepared',kind);
  };
  const dateParts = new Intl.DateTimeFormat('en-US', { timeZone:'America/Chicago', year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(new Date());
  const datePart = name => dateParts.find(part => part.type === name).value;
  const dateInput = form.elements.namedItem('preferred_date');
  if (dateInput) dateInput.min = `${datePart('year')}-${datePart('month')}-${datePart('day')}`;
  form.addEventListener('input', () => {
    contact.setCustomValidity('');
    if (!started) { track('form_start',kind); started = true; }
    requestId = crypto.randomUUID();
    draft.hidden = true;
    setStatus('');
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending) return;
    const data = dataFromForm();
    const contactValue = (data.contact || '').trim();
    const validContact = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactValue) || (/^[+()\d\s.\-]+$/.test(contactValue) && contactValue.replace(/\D/g,'').length >= 10 && contactValue.replace(/\D/g,'').length <= 15);
    if (!validContact) { contact.setCustomValidity('Enter a valid email address or a phone number with area code.'); contact.reportValidity(); return; }
    if (!form.reportValidity()) return;
    if (data.website) { setStatus('Please call 414-442-6262 for help with this request.','error'); return; }
    if (!online) { showDraft(data); return; }
    const token = window.turnstile?.getResponse(widgetId);
    if (!token) { setStatus('Please complete the security check before sending.','error'); status.focus(); return; }
    sending = true;
    submit.disabled = true;
    setStatus('Sending your request…');
    try {
      const response = await fetch('/api/inquiries', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ ...data, request_id:requestId, turnstile_token:token }), signal:AbortSignal.timeout(20000) });
      const result = await response.json();
      if (!response.ok || result.ok !== true || !result.id) throw new Error('DELIVERY_NOT_CONFIRMED');
      setStatus(`Your request has been accepted for email delivery to Nana’s team. ${kind === 'tour' ? 'Your tour is not booked until the team confirms it.' : 'Our team will follow up to discuss the next step.'}`, 'success');
      track('inquiry_accepted',kind);
      submit.textContent = 'Request sent';
      form.querySelectorAll('input,select,textarea').forEach(field => { field.disabled = true; });
      status.focus();
    } catch {
      showDraft(data);
      setStatus('We could not confirm delivery. Your details are still here. You can retry or send the prepared email below.','error');
      window.turnstile?.reset(widgetId);
      submit.disabled = false;
      track('inquiry_delivery_unconfirmed',kind);
    } finally { sending = false; }
  });
  mailLink.addEventListener('click', () => track('email_open',kind));
  draft.querySelector('[data-copy]').addEventListener('click', async () => {
    const copyStatus = draft.querySelector('[data-copy-status]');
    try { await navigator.clipboard.writeText(draftText.value); copyStatus.textContent = 'Message copied. Paste it into an email to Info@nanascozycorner.com.'; }
    catch { draftText.focus(); draftText.select(); copyStatus.textContent = 'Select and copy the message above, then paste it into your email.'; }
  });
  // If configuration, network, or the challenge is unavailable, email/call
  // remains available and the website never reports a fictitious receipt.
  fetch('/api/inquiries', { headers:{ Accept:'application/json' }, signal:AbortSignal.timeout(5000) })
    .then(response => response.ok ? response.json() : null)
    .then(config => {
      if (!config?.ready || !config.siteKey) return;
      window.nanaTurnstileReady = () => {
        widgetId = window.turnstile.render(form.querySelector('[data-challenge]'), {
          sitekey:config.siteKey, action:'website_inquiry', theme:'light',
          callback:() => {
            if (sending) return;
            online = true;
            submit.innerHTML = 'Send request <span aria-hidden="true">→</span>';
            delivery.textContent = 'Send your request securely to Nana’s team. We’ll follow up using the contact detail you provide.';
          },
          'error-callback':emailMode,
          'expired-callback':emailMode
        });
      };
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=nanaTurnstileReady&render=explicit';
      script.async = true;
      script.onerror = emailMode;
      document.head.append(script);
    }).catch(emailMode);
})();
