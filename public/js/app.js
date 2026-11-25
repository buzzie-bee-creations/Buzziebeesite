import { initSafeFoodsSheet } from './safe-foods.js';

const VALID_TABS = [
  'about-buzzie-bee',
  'get-to-know-sam',
  'safe-foods',
  'kitchen-survival-guide',
  'emotogotchi',
];

const siteNav = document.querySelector('.site-nav');
const tabButtons = Array.from(document.querySelectorAll('[role="tab"][data-tab]'));
const tabPanels = Array.from(document.querySelectorAll('[role="tabpanel"]'));
const tabSwitchTriggers = Array.from(document.querySelectorAll('[data-switch-tab]'));
const copyButtons = Array.from(document.querySelectorAll('[data-copy-email]'));

function activateTab(tabId, { updateHash = true, scrollTop = true, focusTab = false } = {}) {
  const targetId = VALID_TABS.includes(tabId) ? tabId : VALID_TABS[0];

  if (siteNav) {
    siteNav.classList.toggle('is-light', targetId === 'about-buzzie-bee');
  }

  tabButtons.forEach((btn) => {
    const isSelected = btn.dataset.tab === targetId;
    btn.classList.toggle('is-active', isSelected);
    btn.setAttribute('aria-selected', String(isSelected));
    btn.setAttribute('tabindex', isSelected ? '0' : '-1');
    if (isSelected) {
      const tabBar = btn.parentElement;
      if (tabBar && tabBar.scrollWidth > tabBar.clientWidth) {
        const targetLeft = btn.offsetLeft - (tabBar.clientWidth - btn.offsetWidth) / 2;
        tabBar.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
      }
      if (focusTab) btn.focus();
    }
  });

  tabPanels.forEach((panel) => {
    const isMatch = panel.id === `panel-${targetId}`;
    panel.classList.toggle('is-active', isMatch);
    panel.hidden = !isMatch;
  });

  if (updateHash && window.location.hash !== `#${targetId}`) {
    history.replaceState(null, '', `#${targetId}`);
  }

  if (scrollTop) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function initTabs() {
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      activateTab(btn.dataset.tab);
    });

    btn.addEventListener('keydown', (event) => {
      const currentIndex = tabButtons.indexOf(btn);
      let nextIndex = null;

      if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabButtons.length;
      else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabButtons.length) % tabButtons.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = tabButtons.length - 1;

      if (nextIndex !== null) {
        event.preventDefault();
        activateTab(tabButtons[nextIndex].dataset.tab, { focusTab: true });
      }
    });
  });

  tabSwitchTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      activateTab(trigger.dataset.switchTab);
    });
  });
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const helper = document.createElement('textarea');
  helper.value = text;
  helper.setAttribute('readonly', '');
  helper.style.position = 'fixed';
  helper.style.opacity = '0';
  document.body.appendChild(helper);
  helper.select();
  const copied = document.execCommand('copy');
  helper.remove();
  if (!copied) throw new Error('Copy failed');
}

function initCopyEmail() {
  copyButtons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const email = btn.dataset.copyEmail;
      if (!email) return;

      const originalLabel = btn.textContent;
      try {
        await copyText(email);
        btn.textContent = 'Email Copied';
      } catch {
        btn.textContent = email;
      }

      window.setTimeout(() => {
        btn.textContent = originalLabel;
      }, 2200);
    });
  });
}

function initSayHelloForm() {
  const formView = document.getElementById('say-hello-form-view');
  const form = document.getElementById('say-hello-form');
  const thanksView = document.getElementById('say-hello-thanks');
  const thanksTitle = document.getElementById('hello-thanks-title');
  const thanksCopy = document.getElementById('hello-thanks-copy');
  const mailtoAgainLink = document.getElementById('hello-mailto-again');
  const copyNoteBtn = document.getElementById('hello-copy-note');
  const sendAnotherBtn = document.getElementById('hello-send-another');
  const errorBanner = document.getElementById('say-hello-error');

  const nameInput = document.getElementById('hello-name');
  const emailInput = document.getElementById('hello-email');
  const messageInput = document.getElementById('hello-message');
  const pillButtons = Array.from(document.querySelectorAll('.hello-pill[data-category]'));

  if (!form || !formView || !thanksView || !nameInput || !emailInput || !messageInput) return;

  const RECIPIENT = 'buzziebeec@gmail.com';
  const PLACEHOLDERS_BY_CATEGORY = {
    'Coaching Inquiry': [
      "Tell me what you're navigating or hoping to explore in coaching...",
      'What kind of support, rhythm, or clarity feels most helpful right now?',
      'Share a bit about your goals or questions for working together...',
    ],
    'Digital Strategies': [
      'Tell me about the web experience, community platform, or digital strategy you are shaping...',
      'Looking to make a digital space calmer, clearer, or more community-based?',
      'Share what your team or project is hoping to simplify or reach online...',
    ],
    'Creative Collab': [
      'Tell me about the project, zine, or community-based tech idea on your workbench...',
      'Got an intergenerational, community, or storytelling spark to riff on?',
      'How do you picture us building or experimenting together?',
    ],
    'Just Saying Hello': [
      "Popping in to say hi from Victoria or beyond — what's on your mind today?",
      'Share a kind note, a favorite recipe, or what brought you to Buzzie Bee...',
      'Always happy to connect with fellow learners, creators, and neighbours...',
    ],
  };

  let selectedCategory = 'Coaching Inquiry';
  let placeholderIndex = 0;
  let placeholderTimer = null;
  let lastPreparedEmail = null;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function applyCurrentPlaceholder() {
    const options = PLACEHOLDERS_BY_CATEGORY[selectedCategory] || PLACEHOLDERS_BY_CATEGORY['Just Saying Hello'];
    messageInput.placeholder = options[placeholderIndex % options.length];
  }

  function startPlaceholderRotation() {
    if (prefersReducedMotion || placeholderTimer !== null) return;
    placeholderTimer = window.setInterval(() => {
      if (!formView.hidden && document.activeElement !== messageInput && messageInput.value.trim() === '') {
        placeholderIndex += 1;
        applyCurrentPlaceholder();
      }
    }, 3600);
  }

  function stopPlaceholderRotation() {
    if (placeholderTimer !== null) {
      window.clearInterval(placeholderTimer);
      placeholderTimer = null;
    }
  }

  pillButtons.forEach((pill) => {
    pill.addEventListener('click', () => {
      selectedCategory = pill.dataset.category || 'Just Saying Hello';
      pillButtons.forEach((other) => {
        const isActive = other === pill;
        other.classList.toggle('is-active', isActive);
        other.setAttribute('aria-pressed', String(isActive));
      });
      placeholderIndex = 0;
      applyCurrentPlaceholder();
    });
  });

  function clearValidationState() {
    [nameInput, emailInput, messageInput].forEach((field) => {
      field.removeAttribute('aria-invalid');
    });
    if (errorBanner) {
      errorBanner.textContent = '';
      errorBanner.hidden = true;
    }
  }

  [nameInput, emailInput, messageInput].forEach((field) => {
    field.addEventListener('input', () => {
      field.removeAttribute('aria-invalid');
      if (errorBanner && !errorBanner.hidden) {
        errorBanner.textContent = '';
        errorBanner.hidden = true;
      }
    });
  });

  function showValidationError(message, invalidField) {
    if (invalidField) {
      invalidField.setAttribute('aria-invalid', 'true');
      invalidField.focus();
    }
    if (errorBanner) {
      errorBanner.textContent = message;
      errorBanner.hidden = false;
    }
  }

  function triggerMailto(mailtoUrl) {
    const tempLink = document.createElement('a');
    tempLink.href = mailtoUrl;
    tempLink.style.display = 'none';
    document.body.appendChild(tempLink);
    tempLink.click();
    tempLink.remove();
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearValidationState();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const message = messageInput.value.trim();

    if (!name) {
      showValidationError('Please share your name so Sam knows who is saying hello.', nameInput);
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailPattern.test(email)) {
      showValidationError('Please enter a valid email address so Sam can reply.', emailInput);
      return;
    }

    if (!message) {
      showValidationError('Please add a quick message before sending your hello.', messageInput);
      return;
    }

    const subject = `[Buzzie Bee · ${selectedCategory}] Hello from ${name}`;
    const body = [
      'Hi Sam!',
      '',
      `Topic: ${selectedCategory}`,
      `From: ${name} (${email})`,
      '',
      message,
    ].join('\n');

    const mailtoUrl = `mailto:${RECIPIENT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    lastPreparedEmail = {
      mailtoUrl,
      plainText: `To: ${RECIPIENT}\nSubject: ${subject}\n\n${body}`,
    };

    triggerMailto(mailtoUrl);

    const firstName = name.split(/\s+/)[0] || name;
    if (thanksTitle) {
      thanksTitle.textContent = `Buzzing with gratitude, ${firstName}!`;
    }
    if (thanksCopy) {
      thanksCopy.textContent = `Your "${selectedCategory}" email draft to ${RECIPIENT} is ready in your mail app.`;
    }
    if (mailtoAgainLink) {
      mailtoAgainLink.href = mailtoUrl;
    }

    stopPlaceholderRotation();
    formView.hidden = true;
    thanksView.hidden = false;
  });

  copyNoteBtn?.addEventListener('click', async () => {
    if (!lastPreparedEmail) return;
    const originalLabel = copyNoteBtn.textContent;
    try {
      await copyText(lastPreparedEmail.plainText);
      copyNoteBtn.textContent = 'Note Copied';
    } catch {
      copyNoteBtn.textContent = RECIPIENT;
    }
    window.setTimeout(() => {
      copyNoteBtn.textContent = originalLabel;
    }, 2200);
  });

  sendAnotherBtn?.addEventListener('click', () => {
    form.reset();
    clearValidationState();
    thanksView.hidden = true;
    formView.hidden = false;
    placeholderIndex = 0;
    applyCurrentPlaceholder();
    startPlaceholderRotation();
    nameInput.focus();
  });

  applyCurrentPlaceholder();
  startPlaceholderRotation();
}

function initNavHelloFocus() {
  const helloNavTriggers = Array.from(document.querySelectorAll('[data-focus-hello]'));
  helloNavTriggers.forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      activateTab('about-buzzie-bee', { scrollTop: false });
      const card = document.getElementById('say-hello-card');
      const nameInput = document.getElementById('hello-name');
      const formView = document.getElementById('say-hello-form-view');
      const sendAnotherBtn = document.getElementById('hello-send-another');

      window.requestAnimationFrame(() => {
        card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (formView && !formView.hidden) {
          nameInput?.focus({ preventScroll: true });
        } else {
          sendAnotherBtn?.focus({ preventScroll: true });
        }
      });
    });
  });
}

function syncFromHash() {
  const rawHash = window.location.hash.replace(/^#/, '');
  const hashAliases = {
    about: 'get-to-know-sam',
    portfolio: 'safe-foods',
  };
  const targetTab = hashAliases[rawHash] || rawHash;
  activateTab(targetTab, { updateHash: false, scrollTop: false });
}

initTabs();
initCopyEmail();
initSafeFoodsSheet();
initSayHelloForm();
initNavHelloFocus();
window.addEventListener('hashchange', syncFromHash);
syncFromHash();
