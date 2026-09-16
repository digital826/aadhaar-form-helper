// ==UserScript==
// @name         Aadhaar Form Helper - Error Removal (v2.3.4)
// @namespace    http://aadhaar-form-helper.tampermonkey
// @version      2.3.4
// @description  Remove form validation errors while preserving button functionality
// @match        https://*.uidai.gov.in/*
// @match        https://myaadhaar.uidai.gov.in/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // ════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ════════════════════════════════════════════════════════════
    const CONFIG = {
        debug: false, // Set to true for verbose logging
        cleanupInterval: 200, // ms between cleanup cycles
        mutationDelay: 50, // ms delay for mutation observer
        targetInputs: ['houseEn', 'nameEn', 'addressEn'], // Fields to monitor
        errorPatterns: [
            "'/o' is not allowed",
            "'care of' is not allowed",
            "The use of '/o'",
            "The use of 'care of'",
            "is not allowed"
        ],
        errorColors: ['#B7131A', '#ba131a', 'rgb(186, 19, 26)']
    };

    // ════════════════════════════════════════════════════════════
    // LOGGING UTILITY
    // ════════════════════════════════════════════════════════════
    const log = {
        success: (msg) => CONFIG.debug && console.log(`%c[✅ AFH] ${msg}`, 'color:#00e676;font-weight:bold'),
        error: (msg) => console.log(`%c[❌ AFH] ${msg}`, 'color:#ff1744;font-weight:bold'),
        info: (msg) => CONFIG.debug && console.log(`%c[ℹ️ AFH] ${msg}`, 'color:#2196F3'),
        warn: (msg) => console.log(`%c[⚠️ AFH] ${msg}`, 'color:#ffc400')
    };

    // ════════════════════════════════════════════════════════════
    // PART 1 — ERROR ATTRIBUTE REMOVAL
    // ════════════════════════════════════════════════════════════
    function removeErrorAttributes() {
        try {
            // Process target input fields
            CONFIG.targetInputs.forEach(fieldName => {
                const input = document.querySelector(`input[name="${fieldName}"]`);
                if (input && input.isConnected) {
                    if (input.hasAttribute('error')) {
                        const errorMsg = input.getAttribute('error');
                        input.removeAttribute('error');
                        log.success(`Removed error from ${fieldName}: "${errorMsg}"`);
                    }
                    if (input.hasAttribute('aria-invalid')) {
                        input.removeAttribute('aria-invalid');
                    }
                }
            });
        } catch (e) {
            log.error(`removeErrorAttributes: ${e.message}`);
        }
    }

    // ════════════════════════════════════════════════════════════
    // PART 2 — HIDE ERROR MESSAGES & ICONS (BUTTON SAFE)
    // ════════════════════════════════════════════════════════════
    function hideErrorElements() {
        try {
            // Hide error message divs
            document.querySelectorAll('div').forEach(div => {
                if (!div.isConnected) return;
                
                // Skip button containers
                if (div.querySelector('button') || div.tagName === 'BUTTON') return;
                
                const text = div.innerText || '';
                const isErrorMsg = CONFIG.errorPatterns.some(pattern => text.includes(pattern));
                
                if (isErrorMsg && text.length < 200 && !text.includes('Confirm') && !text.includes('Address')) {
                    hideElement(div);
                    log.success(`Hidden error message div`);
                }
            });

            // Hide error SVG icons (red validation icons)
            document.querySelectorAll('svg').forEach(svg => {
                if (!svg.isConnected || svg.closest('button')) return;
                
                const path = svg.querySelector('path');
                const fill = path?.getAttribute('fill');
                
                if (CONFIG.errorColors.includes(fill)) {
                    const parent = svg.parentElement;
                    if (parent && !parent.querySelector('button')) {
                        hideElement(parent);
                        log.success(`Hidden error icon`);
                    }
                }
            });
        } catch (e) {
            log.error(`hideErrorElements: ${e.message}`);
        }
    }

    // ════════════════════════════════════════════════════════════
    // PART 3 — REMOVE ERROR STYLING & CLASSES
    // ════════════════════════════════════════════════════════════
    function removeErrorStyling() {
        try {
            document.querySelectorAll('input, div, span').forEach(el => {
                if (!el.isConnected || el.tagName === 'BUTTON' || el.closest('button')) return;

                // Remove error attributes
                if (el.hasAttribute('error')) el.removeAttribute('error');
                if (el.hasAttribute('aria-invalid')) el.removeAttribute('aria-invalid');

                // Remove red border styling
                if (CONFIG.errorColors.includes(el.style.borderColor)) {
                    el.style.borderColor = '';
                    el.style.boxShadow = '';
                }

                // Hide error text elements
                const txt = el.innerText || '';
                if (CONFIG.errorPatterns.some(p => txt.includes(p)) && 
                    !txt.includes('Confirm') && !txt.includes('Address')) {
                    hideElement(el);
                }
            });
        } catch (e) {
            log.error(`removeErrorStyling: ${e.message}`);
        }
    }

    // ════════════════════════════════════════════════════════════
    // UTILITY: Hide Element Safely
    // ════════════════════════════════════════════════════════════
    function hideElement(el) {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
        el.style.height = '0';
        el.style.margin = '0';
        el.style.padding = '0';
    }

    // ════════════════════════════════════════════════════════════
    // PART 4 — HOOK INPUT FIELDS FOR REAL-TIME CLEANUP
    // ════════════════════════════════════════════════════════════
    function hookInputFields() {
        try {
            CONFIG.targetInputs.forEach(fieldName => {
                const input = document.querySelector(`input[name="${fieldName}"]`);
                if (!input || input.dataset.afhHooked) return;

                input.dataset.afhHooked = 'true';

                ['input', 'blur', 'change'].forEach(event => {
                    input.addEventListener(event, () => {
                        removeErrorAttributes();
                        removeErrorStyling();
                        hideErrorElements();
                    }, false);
                });

                log.success(`Hooked input field: ${fieldName}`);
            });
        } catch (e) {
            log.error(`hookInputFields: ${e.message}`);
        }
    }

    // ════════════════════════════════════════════════════════════
    // PART 5 — MAIN CLEANUP ORCHESTRATOR
    // ════════════════════════════════════════════════════════════
    function mainCleanup() {
        removeErrorAttributes();
        removeErrorStyling();
        hideErrorElements();
        hookInputFields();
    }

    // ════════════════════════════════════════════════════════════
    // PART 6 — MUTATION OBSERVER FOR DOM CHANGES
    // ════════════════════════════════════════════════════════════
    let observerTimeout;
    const observer = new MutationObserver(() => {
        clearTimeout(observerTimeout);
        observerTimeout = setTimeout(() => {
            try { mainCleanup(); } catch (e) { log.error(`Observer cleanup: ${e.message}`); }
        }, CONFIG.mutationDelay);
    });

    function startObserver() {
        if (!document.body) {
            setTimeout(startObserver, 100);
            return;
        }
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['error', 'aria-invalid', 'class', 'style']
        });
        mainCleanup();
    }

    // ════════════════════════════════════════════════════════════
    // PART 7 — BLOCK FORM VALIDATION METHODS
    // ════════════════════════════════════════════════════════════
    Object.defineProperty(HTMLInputElement.prototype, 'setCustomValidity', {
        value: function() {
            log.info('setCustomValidity blocked');
            return;
        }
    });

    // ════════════════════════════════════════════════════════════
    // PART 8 — INJECT GLOBAL STYLES
    // ════════════════════════════════════════════════════════════
    function injectStyles() {
        if (document.getElementById('afh-style')) return;
        
        const style = document.createElement('style');
        style.id = 'afh-style';
        style.textContent = `
            /* Remove error indicators */
            [error]:not(button) { border-color: transparent !important; }
            [aria-invalid="true"]:not(button) { border-color: transparent !important; }
            .ng-invalid:not(button) { border-color: transparent !important; }
            
            /* Hide error container class */
            .PpFkLoZRATYyYnVv8HFt { 
                display: none !important; 
                visibility: hidden !important; 
                opacity: 0 !important; 
            }
            
            /* Preserve button visibility */
            button, [role="button"] { 
                display: inline-block !important; 
                visibility: visible !important; 
                opacity: 1 !important;
                pointer-events: auto !important;
            }
            
            /* Status indicator */
            #afh-status {
                position: fixed;
                bottom: 16px;
                right: 16px;
                z-index: 2147483647;
                font-family: 'Courier New', monospace;
                background: #0a0f1e;
                border: 2px solid #00e676;
                color: #00e676;
                padding: 10px 16px;
                border-radius: 50px;
                font-size: 11px;
                font-weight: 600;
                box-shadow: 0 2px 12px rgba(0, 230, 118, 0.4);
                letter-spacing: 0.5px;
            }
        `;
        document.head.appendChild(style);
    }

    // ════════════════════════════════════════════════════════════
    // PART 9 — STATUS INDICATOR
    // ════════════════════════════════════════════════════════════
    function showStatus() {
        if (document.getElementById('afh-status')) return;
        
        const status = document.createElement('div');
        status.id = 'afh-status';
        status.innerHTML = '✅ AFH v2.3.4 - Active';
        document.body.appendChild(status);
    }

    // ════════════════════════════════════════════════════════════
    // PART 10 — INITIALIZATION
    // ════════════════════════════════════════════════════════════
    document.addEventListener('DOMContentLoaded', () => {
        injectStyles();
        showStatus();
        mainCleanup();
        hookInputFields();
    });

    window.addEventListener('load', () => {
        setTimeout(() => {
            injectStyles();
            showStatus();
            mainCleanup();
        }, 1000);
    });

    // Start observer and cleanup loop
    startObserver();
    setInterval(mainCleanup, CONFIG.cleanupInterval);

    // ════════════════════════════════════════════════════════════
    // CONSOLE BRANDING
    // ════════════════════════════════════════════════════════════
    console.log(
        '%c ✅ AADHAAR FORM HELPER v2.3.4 LOADED ✅ ',
        'background:#0a0f1e;color:#00e676;font-size:14px;font-weight:bold;padding:8px 16px;border-radius:6px;border:2px solid #00e676;'
    );
    console.log(
        '%c ✓ Error Removal ✓ Button Preserved ✓ C/O Works ✓ Real-time Cleanup ✓ ',
        'color:#00e676;font-family:monospace;font-size:12px;font-weight:600;'
    );
})();