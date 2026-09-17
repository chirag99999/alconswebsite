/**
 * Alcons Website - Contact & Inquiry Form Handler
 * Integration: Validation + Local Backup + Firebase Firestore + Email API
 */
document.addEventListener('DOMContentLoaded', () => {
  const formPanels = document.querySelectorAll('.form-panel');

  formPanels.forEach((panel) => {
    // Convert div.form-panel to proper form if not already
    let form = panel.closest('form');
    if (!form) {
      form = document.createElement('form');
      form.className = 'contact-form-element';
      form.setAttribute('novalidate', 'true');
      panel.parentNode.insertBefore(form, panel);
      form.appendChild(panel);
    }

    // Assign input field names
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach((input) => {
      const labelText = input.nextElementSibling?.textContent?.trim()?.toLowerCase() || '';
      if (labelText.includes('full name') || labelText.includes('name')) input.setAttribute('name', 'full_name');
      else if (labelText.includes('email')) input.setAttribute('name', 'email');
      else if (labelText.includes('phone')) input.setAttribute('name', 'phone');
      else if (labelText.includes('project type')) input.setAttribute('name', 'project_type');
      else if (labelText.includes('tell us') || input.tagName === 'TEXTAREA') input.setAttribute('name', 'message');
    });

    const submitBtn = form.querySelector('button');
    if (submitBtn) {
      submitBtn.setAttribute('type', 'submit');
    }

    // Status message container
    const statusMsg = document.createElement('div');
    statusMsg.className = 'form-status-message';
    statusMsg.style.cssText = 'display:none; margin-top:16px; padding:12px 16px; border-radius:6px; font-size:14px; transition:all 0.3s ease;';
    form.appendChild(statusMsg);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const data = {
        full_name: formData.get('full_name')?.toString().trim() || '',
        email: formData.get('email')?.toString().trim() || '',
        phone: formData.get('phone')?.toString().trim() || '',
        project_type: formData.get('project_type')?.toString().trim() || '',
        message: formData.get('message')?.toString().trim() || '',
        submitted_at: new Date().toISOString()
      };

      // Validation
      if (!data.full_name || !isValidEmail(data.email)) {
        showStatus('Please enter your full name and a valid email address.', 'error');
        return;
      }

      // Loading state
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.origText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Sending... <span class="spinner" style="display:inline-block;width:12px;height:12px;border:2px solid currentColor;border-top-color:transparent;border-radius:50%;animation:spin 0.6s linear infinite;"></span>';
      }

      try {
        // 1. Save lead to localStorage backup
        const existingLeads = JSON.parse(localStorage.getItem('alcons_leads') || '[]');
        existingLeads.push(data);
        localStorage.setItem('alcons_leads', JSON.stringify(existingLeads));

        // 2. Save lead directly to Firebase Firestore if Firebase helper loaded
        const firebaseReady = await waitForFirebase();
        let savedRemotely = false;

        if (firebaseReady && typeof window.AlconsFirebase.saveLeadToFirestore === 'function') {
          const result = await window.AlconsFirebase.saveLeadToFirestore(data);
          savedRemotely = Boolean(result?.success);
        }

        // 3. Email Notification API (Web3Forms / Resend API)
        const endpoint = window.ALCONS_FORM_ENDPOINT || 'https://api.web3forms.com/submit';
        const apiKey = window.ALCONS_FORM_KEY || '';

        if (apiKey) {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
              access_key: apiKey,
              subject: `New Lead Enquiry from ${data.full_name} (${data.project_type || 'General'})`,
              from_name: 'Alcons Website Lead',
              ...data
            })
          });
          savedRemotely = savedRemotely || response.ok;
        }

        if (!savedRemotely) {
          throw new Error('Remote lead submission failed.');
        }

        showStatus('Thank you! Your enquiry has been received. Our team will contact you shortly.', 'success');
        form.reset();
      } catch (err) {
        console.warn('Form submission failed:', err);
        showStatus('We could not send your enquiry right now. Please call or email us directly, or try again in a moment.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = submitBtn.dataset.origText || 'Send Enquiry';
        }
      }
    });

    function showStatus(msg, type) {
      statusMsg.textContent = msg;
      statusMsg.style.display = 'block';
      if (type === 'error') {
        statusMsg.style.background = 'rgba(239, 68, 68, 0.1)';
        statusMsg.style.color = '#dc2626';
        statusMsg.style.border = '1px solid rgba(239, 68, 68, 0.2)';
      } else {
        statusMsg.style.background = 'rgba(16, 185, 129, 0.1)';
        statusMsg.style.color = '#059669';
        statusMsg.style.border = '1px solid rgba(16, 185, 129, 0.2)';
      }
    }

    function isValidEmail(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    function waitForFirebase(timeout = 5000) {
      if (window.AlconsFirebase) return Promise.resolve(true);

      return new Promise((resolve) => {
        const startedAt = Date.now();
        const timer = setInterval(() => {
          if (window.AlconsFirebase) {
            clearInterval(timer);
            resolve(true);
          } else if (Date.now() - startedAt >= timeout) {
            clearInterval(timer);
            resolve(false);
          }
        }, 100);
      });
    }
  });
});

if (!document.getElementById('form-spinner-style')) {
  const style = document.createElement('style');
  style.id = 'form-spinner-style';
  style.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}
