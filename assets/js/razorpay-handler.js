/**
 * ALCONS Studio - Razorpay Payment Gateway & Order Delivery Integration
 * Handles:
 * 1. Plan PDF Blueprint Purchase & Instant Download (Default ₹499)
 * 2. Plan Customization Intake & Advance Deposit Payment (Default ₹1,499)
 * 3. Firestore & LocalStorage Order Logging
 * 4. Architectural PDF Blueprint Document Generation
 */

(function () {
  // Configuration
  window.ALCONS_PAYMENT_CONFIG = {
    // Replace with your Razorpay Key ID (Test key: rzp_test_... or Live key: rzp_live_...)
    keyId: window.ALCONS_RAZORPAY_KEY || 'rzp_test_1DP5mmOlF5G5ag',
    currency: 'INR',
    downloadPrice: 499, // in INR
    customizePrice: 1499, // in INR
    companyName: 'ALCONS Studio',
    companyLogo: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=128&q=80',
    themeColor: '#0FD8D4'
  };

  /**
   * Ensure Razorpay checkout script is loaded
   */
  function loadRazorpaySDK() {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.warn('[ALCONS] Could not load Razorpay script from CDN.');
        resolve(false);
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Helper to wait for Firebase module
   */
  async function getFirebaseHelper() {
    if (window.AlconsFirebase) return window.AlconsFirebase;
    return new Promise((resolve) => {
      let tries = 0;
      const interval = setInterval(() => {
        tries++;
        if (window.AlconsFirebase || tries > 25) {
          clearInterval(interval);
          resolve(window.AlconsFirebase || null);
        }
      }, 100);
    });
  }

  /**
   * Save order to Firestore and localStorage
   */
  async function persistOrder(orderRecord) {
    // 1. Local backup
    try {
      const orders = JSON.parse(localStorage.getItem('alcons_paid_orders') || '[]');
      orders.unshift(orderRecord);
      localStorage.setItem('alcons_paid_orders', JSON.stringify(orders));
    } catch (e) {
      console.error('[ALCONS] LocalStorage save error:', e);
    }

    // 2. Firebase Firestore
    try {
      const fb = await getFirebaseHelper();
      if (fb && typeof fb.saveOrderToFirestore === 'function') {
        const res = await fb.saveOrderToFirestore(orderRecord);
        if (res?.success) {
          orderRecord.firestoreId = res.id;
        }
      }
    } catch (e) {
      console.warn('[ALCONS] Firestore order persist warning:', e);
    }

    return orderRecord;
  }

  /**
   * Generate & trigger high-resolution architectural blueprint PDF
   */
  async function generateArchitecturalPDF(plan, paymentId, clientInfo) {
    // Check if jsPDF is available, otherwise load dynamically
    if (!window.jspdf) {
      await new Promise((res) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        s.onload = res;
        s.onerror = res;
        document.head.appendChild(s);
      });
    }

    const doc = window.jspdf ? new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) : null;

    if (!doc) {
      // Fallback print/download window if jsPDF fails to load
      generateHTMLPrintReceipt(plan, paymentId, clientInfo);
      return;
    }

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Background Canvas Styling
    doc.setFillColor(15, 23, 42); // Navy / Charcoal
    doc.rect(0, 0, pageWidth, 42, 'F');

    // Header Branding
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(15, 216, 212); // Accent Cyan
    doc.text('ALCONS STUDIO', 18, 20);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text('ARCHITECTURE · INTERIORS · CONSTRUCTION · BALASORE, ODISHA', 18, 27);
    doc.text('Official Verified Blueprint & Typology Package', 18, 33);

    // Verified Stamp Box
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(pageWidth - 68, 10, 52, 24, 2, 2, 'F');
    doc.setTextColor(15, 216, 212);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('STATUS: VERIFIED PURCHASE', pageWidth - 64, 17);
    doc.setTextColor(248, 250, 252);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`ID: ${paymentId.substring(0, 16)}`, pageWidth - 64, 23);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - 64, 29);

    // Plan Title Section
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(plan.title || 'Architectural Floor Plan', 18, 54);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`${plan.type || 'Residential'} · ${plan.facingText || 'Vastu Aligned'} · Plot Dimensions: ${plan.size || 'Custom'}`, 18, 61);

    // Divider Line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(18, 65, pageWidth - 18, 65);

    // Specifications Grid
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(18, 69, pageWidth - 36, 32, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(18, 69, pageWidth - 36, 32, 3, 3, 'S');

    const colW = (pageWidth - 36) / 4;
    const specsData = [
      { label: 'PLOT SIZE', val: plan.size || '30x40' },
      { label: 'BUILT-UP AREA', val: `${(plan.sqft || 1200).toLocaleString()} sqft` },
      { label: 'CONFIG / FLOORS', val: plan.type === 'Residential' ? `${plan.bed}B / ${plan.bath}B · ${plan.floors}F` : `${plan.floors} Floors` },
      { label: 'VASTU ALIGNMENT', val: plan.vastu || '100% Vastu' },
      { label: 'EST. BUILD COST', val: plan.estBudget || '₹32–38 L' },
      { label: 'CAR PARKING', val: `${plan.parking || 1} Vehicle(s)` },
      { label: 'ORIENTATION', val: (plan.orientation || 'North').toUpperCase() },
      { label: 'DELIVERED TO', val: (clientInfo.name || 'Valued Client').substring(0, 15) }
    ];

    specsData.forEach((item, idx) => {
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      const x = 22 + (col * colW);
      const y = 77 + (row * 14);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(item.label, x, y);

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(item.val, x, y + 5);
    });

    // Blueprint / Visual Representation Box
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('ARCHITECTURAL DRAWING & SCHEMATIC VIEW', 18, 111);

    // Blueprint Blueprint Background Box (grid effect)
    const bpY = 115;
    const bpH = 100;
    const bpW = pageWidth - 36;
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(18, bpY, bpW, bpH, 2, 2, 'F');

    // Drawing vector schematic guide on the PDF
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.2);
    for (let x = 18; x <= 18 + bpW; x += 10) doc.line(x, bpY, x, bpY + bpH);
    for (let y = bpY; y <= bpY + bpH; y += 10) doc.line(18, y, 18 + bpW, y);

    // Vector Blueprint Layout Representation
    doc.setDrawColor(15, 216, 212);
    doc.setLineWidth(0.8);
    doc.rect(34, bpY + 14, bpW - 32, bpH - 28, 'S');

    // Internal Rooms Layout
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.line(34 + (bpW - 32) * 0.5, bpY + 14, 34 + (bpW - 32) * 0.5, bpY + bpH - 14); // Centre spine
    doc.line(34, bpY + 14 + (bpH - 28) * 0.55, 34 + (bpW - 32) * 0.5, bpY + 14 + (bpH - 28) * 0.55);
    doc.line(34 + (bpW - 32) * 0.5, bpY + 14 + (bpH - 28) * 0.4, 34 + bpW - 32, bpY + 14 + (bpH - 28) * 0.4);

    // Blueprint Labels
    doc.setFontSize(8);
    doc.setFont('courier', 'bold');
    doc.setTextColor(15, 216, 212);
    doc.text('LIVING / DRAWING HALL', 38, bpY + 34);
    doc.setTextColor(203, 213, 225);
    doc.text('MASTER SUITE (SW)', 38, bpY + 70);
    doc.text('KITCHEN / AGNI CORNER', 34 + (bpW - 32) * 0.54, bpY + 32);
    doc.text('BEDROOM 2 / BALCONY', 34 + (bpW - 32) * 0.54, bpY + 68);

    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`[CAD SCHEMATIC REF: ALC-${(plan.id || 'N1').toUpperCase()}-${(plan.orientation || 'NORTH').toUpperCase()}]`, 38, bpY + bpH - 6);
    doc.text(`* HIGH-RES CAD FILE ACCESS INCLUDED IN CONSULTATION`, bpW - 65, bpY + bpH - 6);

    // Key Features & Architectural Notes
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('ARCHITECTURAL HIGHLIGHTS & VASTU COMPLIANCE', 18, 225);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const featuresList = plan.features && plan.features.length ? plan.features : ['Optimal natural cross-ventilation', 'Vastu compliant entrance & kitchen', 'Zero dead circulation corridor', 'Structure ready for future upper expansions'];
    featuresList.forEach((feat, i) => {
      doc.text(`•  ${feat}`, 20, 232 + (i * 6));
    });

    const noteLines = doc.splitTextToSize(plan.note || 'Engineered by ALCONS Studio with high seismic resistance and daylight optimization.', pageWidth - 36);
    doc.text(noteLines, 18, 260);

    // Footer & License Notice
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(18, 275, pageWidth - 18, 275);

    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('© 2026 ALCONS Studio. Licensed exclusively to purchaser for private construction.', 18, 282);
    doc.text('For structural calculations, 3D interior design & on-site supervision: contact studio@alcons.in | +91 674 400 2210', 18, 287);

    // Save/Download PDF
    const filename = `ALCONS_${(plan.title || 'Architectural_Plan').replace(/[^a-zA-Z0-9]/g, '_')}_Blueprint.pdf`;
    doc.save(filename);
  }

  /**
   * Fallback printer / HTML downloader
   */
  function generateHTMLPrintReceipt(plan, paymentId, clientInfo) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>ALCONS Blueprint - ${plan.title}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #111; background: #fff; }
            .header { border-bottom: 2px solid #0FD8D4; padding-bottom: 20px; margin-bottom: 24px; }
            h1 { margin: 0 0 6px 0; font-size: 26px; }
            .badge { display: inline-block; background: #0F172A; color: #0FD8D4; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .specs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 24px 0; background: #f8fafc; padding: 20px; border-radius: 8px; }
            .spec strong { display: block; font-size: 16px; }
            .spec span { font-size: 12px; color: #64748b; }
            img { max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 16px; }
          </style>
        </head>
        <body>
          <div class="header">
            <span class="badge">VERIFIED PURCHASE · PAYMENT ID: ${paymentId}</span>
            <h1>ALCONS Studio — ${plan.title}</h1>
            <p>${plan.type} · ${plan.facingText} · Plot Size: ${plan.size}</p>
          </div>
          <div class="specs">
            <div class="spec"><strong>${plan.sqft} sqft</strong><span>Built-up Area</span></div>
            <div class="spec"><strong>${plan.vastu}</strong><span>Vastu Alignment</span></div>
            <div class="spec"><strong>${plan.estBudget}</strong><span>Est. Build Cost</span></div>
          </div>
          <h3>Architectural Blueprint Preview</h3>
          <img src="${plan.blueprint || plan.image}" alt="Blueprint">
          <p style="margin-top:24px; font-size:13px; color:#64748b;">Delivered to: ${clientInfo.name} (${clientInfo.email}) on ${new Date().toLocaleString()}</p>
          <script>window.onload = function() { window.print(); }<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  /**
   * INITIATE PLAN DOWNLOAD FLOW
   */
  async function initiatePlanDownloadPayment(plan, clientInfo, callbacks = {}) {
    await loadRazorpaySDK();
    const config = window.ALCONS_PAYMENT_CONFIG;
    const amountInPaise = config.downloadPrice * 100;

    const orderDescription = `Complete Architectural Floor Plan & High-Res Blueprint PDF (${plan.size} · ${plan.sqft} sqft)`;

    // Check if Razorpay is accessible
    if (typeof window.Razorpay !== 'undefined') {
      const options = {
        key: config.keyId,
        amount: amountInPaise,
        currency: config.currency,
        name: config.companyName,
        description: orderDescription,
        image: config.companyLogo,
        prefill: {
          name: clientInfo.name || '',
          email: clientInfo.email || '',
          contact: clientInfo.phone || ''
        },
        notes: {
          order_type: 'plan_pdf_download',
          plan_id: plan.id,
          plan_title: plan.title,
          plan_size: plan.size,
          plan_type: plan.type,
          vastu: plan.vastu
        },
        theme: {
          color: config.themeColor
        },
        handler: async function (response) {
          const paymentId = response.razorpay_payment_id || `pay_${Date.now()}`;
          const orderRecord = {
            order_type: 'plan_pdf_download',
            plan_id: plan.id,
            plan_title: plan.title,
            plan_size: plan.size,
            amount: config.downloadPrice,
            currency: config.currency,
            razorpay_payment_id: paymentId,
            razorpay_order_id: response.razorpay_order_id || '',
            razorpay_signature: response.razorpay_signature || '',
            client_name: clientInfo.name,
            client_email: clientInfo.email,
            client_phone: clientInfo.phone,
            status: 'PAID',
            created_at_iso: new Date().toISOString()
          };

          await persistOrder(orderRecord);
          await generateArchitecturalPDF(plan, paymentId, clientInfo);

          if (typeof callbacks.onSuccess === 'function') {
            callbacks.onSuccess(orderRecord);
          }
        },
        modal: {
          ondismiss: function () {
            if (typeof callbacks.onDismiss === 'function') callbacks.onDismiss();
          }
        }
      };

      try {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          console.error('[ALCONS] Razorpay payment failed:', resp.error);
          if (typeof callbacks.onError === 'function') {
            callbacks.onError(resp.error);
          } else {
            alert(`Payment could not be completed: ${resp.error.description || 'Transaction cancelled.'}`);
          }
        });
        rzp.open();
      } catch (err) {
        console.warn('[ALCONS] Razorpay initialization error, using simulated demo checkout:', err);
        launchTestCheckoutModal('download', plan, clientInfo, {}, callbacks);
      }
    } else {
      launchTestCheckoutModal('download', plan, clientInfo, {}, callbacks);
    }
  }

  /**
   * INITIATE PLAN CUSTOMIZATION FLOW
   */
  async function initiatePlanCustomizationPayment(plan, clientInfo, customizationData, callbacks = {}) {
    await loadRazorpaySDK();
    const config = window.ALCONS_PAYMENT_CONFIG;
    const amountInPaise = config.customizePrice * 100;

    const orderDescription = `Architectural Customization Consultation & Layout Alterations (${plan.size})`;

    if (typeof window.Razorpay !== 'undefined') {
      const options = {
        key: config.keyId,
        amount: amountInPaise,
        currency: config.currency,
        name: config.companyName,
        description: orderDescription,
        image: config.companyLogo,
        prefill: {
          name: clientInfo.name || '',
          email: clientInfo.email || '',
          contact: clientInfo.phone || ''
        },
        notes: {
          order_type: 'plan_customization',
          plan_id: plan.id,
          plan_title: plan.title,
          plot_size_alterations: customizationData.plotDimensions || '',
          requested_changes: (customizationData.notes || '').substring(0, 250),
          vastu_requests: customizationData.vastuPreferences || ''
        },
        theme: {
          color: config.themeColor
        },
        handler: async function (response) {
          const paymentId = response.razorpay_payment_id || `pay_${Date.now()}`;
          const orderRecord = {
            order_type: 'plan_customization',
            plan_id: plan.id,
            plan_title: plan.title,
            plan_size: plan.size,
            amount: config.customizePrice,
            currency: config.currency,
            razorpay_payment_id: paymentId,
            razorpay_order_id: response.razorpay_order_id || '',
            client_name: clientInfo.name,
            client_email: clientInfo.email,
            client_phone: clientInfo.phone,
            customization_data: customizationData,
            status: 'PAID',
            created_at_iso: new Date().toISOString()
          };

          await persistOrder(orderRecord);

          if (typeof callbacks.onSuccess === 'function') {
            callbacks.onSuccess(orderRecord);
          }
        },
        modal: {
          ondismiss: function () {
            if (typeof callbacks.onDismiss === 'function') callbacks.onDismiss();
          }
        }
      };

      try {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          console.error('[ALCONS] Customization payment failed:', resp.error);
          if (typeof callbacks.onError === 'function') {
            callbacks.onError(resp.error);
          } else {
            alert(`Payment could not be completed: ${resp.error.description || 'Transaction cancelled.'}`);
          }
        });
        rzp.open();
      } catch (err) {
        console.warn('[ALCONS] Razorpay initialization error, using simulated demo checkout:', err);
        launchTestCheckoutModal('customize', plan, clientInfo, customizationData, callbacks);
      }
    } else {
      launchTestCheckoutModal('customize', plan, clientInfo, customizationData, callbacks);
    }
  }

  /**
   * Test/Demo Checkout simulator for environments where Razorpay CDN is unreached or test credentials are being previewed
   */
  function launchTestCheckoutModal(type, plan, clientInfo, customizationData, callbacks) {
    const config = window.ALCONS_PAYMENT_CONFIG;
    const isDownload = type === 'download';
    const amount = isDownload ? config.downloadPrice : config.customizePrice;
    const title = isDownload ? `Purchase & Download Blueprint` : `Book Plan Customization`;

    const simId = 'alcons-pay-sim-' + Date.now();
    const simModal = document.createElement('div');
    simModal.id = simId;
    simModal.style.cssText = `
      position: fixed; inset: 0; z-index: 10000; display: flex; align-items: center; justify-content: center;
      background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(12px); padding: 20px; font-family: 'Inter', sans-serif;
    `;

    simModal.innerHTML = `
      <div style="background: #1E293B; border: 1px solid #334155; border-radius: 16px; width: 100%; max-width: 440px; color: #fff; padding: 28px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #334155; padding-bottom: 16px;">
          <div>
            <div style="font-size: 11px; font-weight: 700; color: #0FD8D4; letter-spacing: 0.05em; text-transform: uppercase;">Razorpay Secure Checkout</div>
            <h3 style="font-size: 18px; margin-top: 4px; font-weight: 600;">ALCONS Studio</h3>
          </div>
          <button id="${simId}-close" style="background: none; border: none; color: #94A3B8; font-size: 22px; cursor: pointer;">&times;</button>
        </div>
        <div style="background: #0F172A; border-radius: 12px; padding: 16px; margin-bottom: 20px; border: 1px solid #334155;">
          <div style="font-size: 13px; color: #94A3B8;">${title}</div>
          <div style="font-size: 16px; font-weight: 600; color: #F8FAFC; margin: 4px 0 8px;">${plan.title}</div>
          <div style="display: flex; justify-content: space-between; align-items: baseline; border-top: 1px dashed #334155; padding-top: 10px; margin-top: 8px;">
            <span style="font-size: 13px; color: #94A3B8;">Total Payable:</span>
            <span style="font-size: 22px; font-weight: 700; color: #0FD8D4;">₹${amount}</span>
          </div>
        </div>
        <div style="font-size: 12px; color: #94A3B8; margin-bottom: 20px; line-height: 1.5;">
          Ready to verify payment with Razorpay. Click <strong>Complete Test Payment</strong> to simulate an instant authorized gateway transaction.
        </div>
        <div style="display: flex; gap: 10px;">
          <button id="${simId}-cancel" style="flex: 1; padding: 12px; border-radius: 8px; border: 1px solid #475569; background: transparent; color: #CBD5E1; cursor: pointer; font-weight: 500;">Cancel</button>
          <button id="${simId}-pay" style="flex: 2; padding: 12px; border-radius: 8px; border: none; background: #0FD8D4; color: #0F172A; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
            Complete Test Payment
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(simModal);

    const close = () => {
      simModal.remove();
      if (typeof callbacks.onDismiss === 'function') callbacks.onDismiss();
    };

    document.getElementById(`${simId}-close`).addEventListener('click', close);
    document.getElementById(`${simId}-cancel`).addEventListener('click', close);

    document.getElementById(`${simId}-pay`).addEventListener('click', async () => {
      const payBtn = document.getElementById(`${simId}-pay`);
      payBtn.disabled = true;
      payBtn.textContent = 'Verifying with Gateway...';

      const simulatedPaymentId = 'pay_sim_' + Math.random().toString(36).substring(2, 12).toUpperCase();

      const orderRecord = {
        order_type: isDownload ? 'plan_pdf_download' : 'plan_customization',
        plan_id: plan.id,
        plan_title: plan.title,
        plan_size: plan.size,
        amount: amount,
        currency: config.currency,
        razorpay_payment_id: simulatedPaymentId,
        client_name: clientInfo.name,
        client_email: clientInfo.email,
        client_phone: clientInfo.phone,
        customization_data: customizationData || null,
        status: 'PAID',
        created_at_iso: new Date().toISOString()
      };

      await persistOrder(orderRecord);

      if (isDownload) {
        await generateArchitecturalPDF(plan, simulatedPaymentId, clientInfo);
      }

      simModal.remove();

      if (typeof callbacks.onSuccess === 'function') {
        callbacks.onSuccess(orderRecord);
      }
    });
  }

  // Export to Global Window
  window.AlconsPayment = {
    config: window.ALCONS_PAYMENT_CONFIG,
    initiatePlanDownloadPayment,
    initiatePlanCustomizationPayment,
    generateArchitecturalPDF,
    persistOrder
  };
})();
