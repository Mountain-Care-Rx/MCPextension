import { showToast } from "../../../phoneUtils";
import { removeAllTags, removeAllAutomations } from '../../../ui/headerBar.js';

let selectedMedication = null;
let selectedCompound = null;
let selectedDosage = null;
let selectedStep = null;

export function createAPIDropdown() {

  // Create the main API bar container
  const apiBar = document.createElement("div");
  apiBar.id = "crm-api-bar";
  apiBar.style.display = "flex";
  apiBar.style.flexDirection = "row";
  apiBar.style.alignItems = "center";
  apiBar.style.gap = "8px";
  apiBar.style.background = "#23272e";
  apiBar.style.borderRadius = "4px";
  apiBar.style.padding = "4px 8px";
  apiBar.style.margin = "0 0 4px 0";
  apiBar.style.minWidth = "0";
  apiBar.style.boxShadow = "0px 4px 8px 0px rgba(0,0,0,0.10)";
  apiBar.style.border = "1px solid rgba(255,255,255,0.06)";

  // --- Medication select ---
  const medicationLabel = document.createElement("label");
  medicationLabel.textContent = "Medication:";
  medicationLabel.style.marginRight = "2px";
  medicationLabel.style.fontSize = "12px";
  medicationLabel.style.color = "#e6e6e6";
  const medicationSelect = document.createElement("select");
  medicationSelect.style.marginRight = "4px";
  medicationSelect.style.background = "#23272e";
  medicationSelect.style.color = "#a0e0ff";
  medicationSelect.style.border = "1px solid #444";
  medicationSelect.style.borderRadius = "2px";
  medicationSelect.style.padding = "2px 6px";
  medicationSelect.style.fontWeight = "bold";
  medicationSelect.style.fontSize = "12px";
  medicationSelect.style.height = "24px";
  medicationSelect.innerHTML = `
    <option value="">Select</option>
    <option value="Tirzepatide">Tirzepatide</option>
    <option value="Semaglutide">Semaglutide</option>
  `;

  // --- Compound select ---
  const compoundLabel = document.createElement("label");
  compoundLabel.textContent = "Compound:";
  compoundLabel.style.marginRight = "2px";
  compoundLabel.style.fontSize = "12px";
  compoundLabel.style.color = "#e6e6e6";
  const compoundSelect = document.createElement("select");
  compoundSelect.style.marginRight = "4px";
  compoundSelect.style.background = "#23272e";
  compoundSelect.style.color = "#a0e0ff";
  compoundSelect.style.border = "1px solid #444";
  compoundSelect.style.borderRadius = "2px";
  compoundSelect.style.padding = "2px 6px";
  compoundSelect.style.fontWeight = "bold";
  compoundSelect.style.fontSize = "12px";
  compoundSelect.style.height = "24px";

  // --- Dosage select ---
  const dosageLabel = document.createElement("label");
  dosageLabel.textContent = "Dosage (ml):";
  dosageLabel.style.marginRight = "2px";
  dosageLabel.style.fontSize = "12px";
  dosageLabel.style.color = "#e6e6e6";
  const dosageSelect = document.createElement("select");
  dosageSelect.style.marginRight = "4px";
  dosageSelect.style.background = "#23272e";
  dosageSelect.style.color = "#a0e0ff";
  dosageSelect.style.border = "1px solid #444";
  dosageSelect.style.borderRadius = "2px";
  dosageSelect.style.padding = "2px 6px";
  dosageSelect.style.fontWeight = "bold";
  dosageSelect.style.fontSize = "12px";
  dosageSelect.style.height = "24px";

  // --- Steps select ---
  const stepLabel = document.createElement("label");
  stepLabel.textContent = "Step:";
  stepLabel.style.marginRight = "2px";
  stepLabel.style.fontSize = "12px";
  stepLabel.style.color = "#e6e6e6";
  const stepSelect = document.createElement("select");
  stepSelect.style.marginRight = "4px";
  stepSelect.style.background = "#23272e";
  stepSelect.style.color = "#a0e0ff";
  stepSelect.style.border = "1px solid #444";
  stepSelect.style.borderRadius = "2px";
  stepSelect.style.padding = "2px 6px";
  stepSelect.style.fontWeight = "bold";
  stepSelect.style.fontSize = "12px";
  stepSelect.style.height = "24px";
  stepSelect.innerHTML = `
    <option value="">Select</option>
    <option value="Step 1: Verify first name">Step 1: Verify first name</option>
    <option value="Step 1.5: Verify first name">Step 1.5: Verify first name</option>
    <option value="Step 2: Verify form">Step 2: Verify form</option>
    <option value="Step 4: Sending payment">Step 4: Sending payment</option>
  `;

  // --- Submit button ---
  const submitBtn = document.createElement("button");
  submitBtn.textContent = "Submit";
  submitBtn.style.marginLeft = "6px";
  submitBtn.style.padding = "2px 12px";
  submitBtn.style.background = "#1e90ff";
  submitBtn.style.color = "#fff";
  submitBtn.style.border = "none";
  submitBtn.style.borderRadius = "3px";
  submitBtn.style.fontWeight = "bold";
  submitBtn.style.fontSize = "12px";
  submitBtn.style.cursor = "pointer";
  submitBtn.style.height = "24px";
  submitBtn.addEventListener("mouseenter", () => submitBtn.style.background = "#0074d9");
  submitBtn.addEventListener("mouseleave", () => submitBtn.style.background = "#1e90ff");

  // --- Populate compound options based on medication ---
  function updateCompoundOptions() {
    const med = medicationSelect.value;
    compoundSelect.innerHTML = `<option value="">Select</option>
      <option value="NAD+ vial">NAD+ vial</option>
      <option value="Lipo vial">Lipo vial</option>
      <option value="B6 vial">B6 vial</option>
      <option value="B12 vial">B12 vial</option>
      ${med === "Tirzepatide" ? '<option value="B6 syringe">B6 syringe</option>' : ''}
      ${med === "Semaglutide" ? '<option value="B12 syringe">B12 syringe</option>' : ''}
    `;
    compoundSelect.value = "";
    updateDosageOptions();
  }

  // --- Populate dosage options based on compound and medication ---
  function updateDosageOptions() {
    const compound = compoundSelect.value;
    const med = medicationSelect.value;
    let options = [];
    if (compound && compound.toLowerCase().includes("syringe")) {
      if (med === "Tirzepatide") {
        options = [
          "QTY: 1 - 0.25",
          "QTY: 2 - 0.5",
          "QTY: 3 - 0.75",
          "QTY: 4 - 1.0",
          "QTY: 5 - 1.25",
          "QTY: 6 - 1.5"];
      } else if (med === "Semaglutide") {
        options = [
          "QTY: 0.5 - 0.125",
          "QTY: 1 - 0.25",
          "QTY: 2 - 0.5",
          "QTY: 3 - 0.75",
          "QTY: 4 - 1.0",
          "QTY: 5 - 1.25",
          "QTY: 6 - 1.5",
          "QTY: 7 - 1.75",
          "QTY: 8 - 2.0"];
      }
    } else if (compound && compound.toLowerCase().includes("vial")) {
      options = ["2.5", "5", "7.5", "10"];
    }
    dosageSelect.innerHTML = `<option value="">Select</option>` + options.map(val => `<option value="${val} ml">${val} ml</option>`).join("");
    dosageSelect.value = "";
  }

  medicationSelect.addEventListener("change", () => {
    selectedMedication = medicationSelect.value;
    updateCompoundOptions();
  });
  compoundSelect.addEventListener("change", () => {
    selectedCompound = compoundSelect.value;
    updateDosageOptions();
  });
  dosageSelect.addEventListener("change", () => {
    selectedDosage = dosageSelect.value;
  });
  stepSelect.addEventListener("change", () => {
    selectedStep = stepSelect.value;
  });

  // Helper to build a unique key from selections
  const buildAutomationKey = (med, compound, step) =>
    [med, compound, step].map(s => (s || "").trim()).join("|");

  const buildDosageKey = (med, compound, dose) =>
    [med, compound, dose].map(s => (s || "").trim()).join("|");

  // Flat map for dosage lookup
  const dosageToString = {
    // Tirzepatide syringes
    "Tirzepatide|B6 syringe|QTY: 1 - 0.25 ml": "api-tirz-b6-0.25ml-syringe",
    "Tirzepatide|B6 syringe|QTY: 2 - 0.5 ml": "api-tirz-b6-0.5ml-syringe",
    "Tirzepatide|B6 syringe|QTY: 3 - 0.75 ml": "api-tirz-b6-0.75ml-syringe",
    "Tirzepatide|B6 syringe|QTY: 4 - 1.0 ml": "api-tirz-b6-1.0ml-syringe",
    "Tirzepatide|B6 syringe|QTY: 5 - 1.25 ml": "api-tirz-b6-1.25ml-syringe",
    "Tirzepatide|B6 syringe|QTY: 6 - 1.5 ml": "api-tirz-b6-1.5ml-syringe",

    // Semaglutide syringes
    "Semaglutide|B12 syringe|QTY: 0.5 - 0.125 ml": "api-sema-b12-0.125ml-syringe",
    "Semaglutide|B12 syringe|QTY: 1 - 0.25 ml": "api-sema-b12-0.25ml-syringe",
    "Semaglutide|B12 syringe|QTY: 2 - 0.5 ml": "api-sema-b12-0.5ml-syringe",
    "Semaglutide|B12 syringe|QTY: 3 - 0.75 ml": "api-sema-b12-0.75ml-syringe",
    "Semaglutide|B12 syringe|QTY: 4 - 1.0 ml": "api-sema-b12-1.0ml-syringe",
    "Semaglutide|B12 syringe|QTY: 5 - 1.25 ml": "api-sema-b12-1.25ml-syringe",
    "Semaglutide|B12 syringe|QTY: 6 - 1.5 ml": "api-sema-b12-1.5ml-syringe",
    "Semaglutide|B12 syringe|QTY: 7 - 1.75 ml": "api-sema-b12-1.75ml-syringe",
    "Semaglutide|B12 syringe|QTY: 8 - 2.0 ml": "api-sema-b12-2.0ml-syringe",

    // Tirzepatide vials
    "Tirzepatide|NAD+ vial|2.5 ml": "api-tirz-nad+-2.5ml-vial",
    "Tirzepatide|NAD+ vial|5 ml": "api-tirz-nad+-5.0ml-vial",
    "Tirzepatide|NAD+ vial|7.5 ml": "api-tirz-nad+-7.5ml-vial",
    "Tirzepatide|NAD+ vial|10 ml": "api-tirz-nad+-10.0ml-vial",

    "Tirzepatide|B6 vial|2.5 ml": "api-tirz-b6-2.5ml-vial",
    "Tirzepatide|B6 vial|5 ml": "api-tirz-b6-5.0ml-vial",
    "Tirzepatide|B6 vial|7.5 ml": "api-tirz-b6-7.5ml-vial",
    "Tirzepatide|B6 vial|10 ml": "api-tirz-b6-10.0ml-vial",

    "Tirzepatide|B12 vial|2.5 ml": "api-tirz-b12-2.5ml-vial",
    "Tirzepatide|B12 vial|5 ml": "api-tirz-b12-5.0ml-vial",
    "Tirzepatide|B12 vial|7.5 ml": "api-tirz-b12-7.5ml-vial",
    "Tirzepatide|B12 vial|10 ml": "api-tirz-b12-10.0ml-vial",

    // Semaglutide vials
    "Semaglutide|NAD+ vial|2.5 ml": "api-sema-nad+-2.5ml-vial",
    "Semaglutide|NAD+ vial|5 ml": "api-sema-nad+-5.0ml-vial",
    "Semaglutide|NAD+ vial|7.5 ml": "api-sema-nad+-7.5ml-vial",
    "Semaglutide|NAD+ vial|10 ml": "api-sema-nad+-10.0ml-vial",

    "Semaglutide|B6 vial|2.5 ml": "api-sema-b6-2.5ml-vial",
    "Semaglutide|B6 vial|5 ml": "api-sema-b6-5.0ml-vial",
    "Semaglutide|B6 vial|7.5 ml": "api-sema-b6-7.5ml-vial",
    "Semaglutide|B6 vial|10 ml": "api-sema-b6-10.0ml-vial",

    "Semaglutide|B12 vial|2.5 ml": "api-sema-b12-2.5ml-vial",
    "Semaglutide|B12 vial|5 ml": "api-sema-b12-5.0ml-vial",
    "Semaglutide|B12 vial|7.5 ml": "api-sema-b12-7.5ml-vial",
    "Semaglutide|B12 vial|10 ml": "api-sema-b12-10.0ml-vial",

    "Semaglutide|Lipo vial|2.5 ml": "api-sema-lipo-2.5ml-vial",
    "Semaglutide|Lipo vial|5 ml": "api-sema-lipo-5.0ml-vial",
    "Semaglutide|Lipo vial|7.5 ml": "api-sema-lipo-7.5ml-vial",
    "Semaglutide|Lipo vial|10 ml": "api-sema-lipo-10.0ml-vial",
  };


  // Flat map for automation lookup
  const selectionToString = {
    // Tirzepatide Step 1
    "Tirzepatide|B6 syringe|Step 1: Verify first name": "api-refill-patient-tirz",
    "Tirzepatide|NAD+ vial|Step 1: Verify first name": "api-refill-patient-tirz",
    "Tirzepatide|Lipo vial|Step 1: Verify first name": "api-refill-patient-tirz",
    "Tirzepatide|B6 vial|Step 1: Verify first name": "api-refill-patient-tirz",
    "Tirzepatide|B12 vial|Step 1: Verify first name": "api-refill-patient-tirz",

    // Tirzepatide Step 1.5
    "Tirzepatide|B6 syringe|Step 1.5: Verify first name": "api-refill-patient-tirz-name",
    "Tirzepatide|NAD+ vial|Step 1.5: Verify first name": "api-refill-patient-tirz-name",
    "Tirzepatide|Lipo vial|Step 1.5: Verify first name": "api-refill-patient-tirz-name",
    "Tirzepatide|B6 vial|Step 1.5: Verify first name": "api-refill-patient-tirz-name",
    "Tirzepatide|B12 vial|Step 1.5: Verify first name": "api-refill-patient-tirz-name",

    // Tirzepatide Step 2
    "Tirzepatide|B6 syringe|Step 2: Verify form": "api-refill-patient-tirz-form",
    "Tirzepatide|NAD+ vial|Step 2: Verify form": "api-refill-patient-tirz-form",
    "Tirzepatide|Lipo vial|Step 2: Verify form": "api-refill-patient-tirz-form",
    "Tirzepatide|B6 vial|Step 2: Verify form": "api-refill-patient-tirz-form",
    "Tirzepatide|B12 vial|Step 2: Verify form": "api-refill-patient-tirz-form",
    // Tirzepatide Step 3
    "Tirzepatide|B6 syringe|Step 3: Waiting on payment": "API - Refill - Tirzepatide Combo - (Step 3 Waiting on Payment)",
    "Tirzepatide|NAD+ vial|Step 3: Waiting on payment": "API - Refill - Tirzepatide Combo - (Step 3 Waiting on Payment)",
    "Tirzepatide|Lipo vial|Step 3: Waiting on payment": "API - Refill - Tirzepatide Combo - (Step 3 Waiting on Payment)",
    "Tirzepatide|B6 vial|Step 3: Waiting on payment": "API - Refill - Tirzepatide Combo - (Step 3 Waiting on Payment)",
    "Tirzepatide|B12 vial|Step 3: Waiting on payment": "API - Refill - Tirzepatide Combo - (Step 3 Waiting on Payment)",
    // Tirzepatide Step 4
    "Tirzepatide|B6 syringe|Step 4: Sending payment": "api-tirz-refill-invoice",
    "Tirzepatide|NAD+ vial|Step 4: Sending payment": "api-tirz-refill-invoice",
    "Tirzepatide|Lipo vial|Step 4: Sending payment": "api-tirz-refill-invoice",
    "Tirzepatide|B6 vial|Step 4: Sending payment": "api-tirz-refill-invoice",
    "Tirzepatide|B12 vial|Step 4: Sending payment": "api-tirz-refill-invoice",
    // Semaglutide Step 1
    "Semaglutide|B12 syringe|Step 1: Verify first name": "api-refill-patient-sema",
    "Semaglutide|NAD+ vial|Step 1: Verify first name": "api-refill-patient-sema",
    "Semaglutide|Lipo vial|Step 1: Verify first name": "api-refill-patient-sema",
    "Semaglutide|B6 vial|Step 1: Verify first name": "api-refill-patient-sema",
    "Semaglutide|B12 vial|Step 1: Verify first name": "api-refill-patient-sema",

    // Semaglutide Step 1.5
    "Semaglutide|B12 syringe|Step 1.5: Verify first name": "api-refill-patient-sema-name",
    "Semaglutide|NAD+ vial|Step 1.5: Verify first name": "api-refill-patient-sema-name",
    "Semaglutide|Lipo vial|Step 1.5: Verify first name": "api-refill-patient-sema-name",
    "Semaglutide|B6 vial|Step 1.5: Verify first name": "api-refill-patient-sema-name",
    "Semaglutide|B12 vial|Step 1.5: Verify first name": "api-refill-patient-sema-name",

    // Semaglutide Step 2
    "Semaglutide|B12 syringe|Step 2: Verify form": "api-refill-patient-sema-form",
    "Semaglutide|NAD+ vial|Step 2: Verify form": "api-refill-patient-sema-form",
    "Semaglutide|Lipo vial|Step 2: Verify form": "api-refill-patient-sema-form",
    "Semaglutide|B6 vial|Step 2: Verify form": "api-refill-patient-sema-form",
    "Semaglutide|B12 vial|Step 2: Verify form": "api-refill-patient-sema-form",
    // Semaglutide Step 3
    "Semaglutide|B12 syringe|Step 3: Waiting on payment": "API - Refill - Semaglutide Combo - (Step 3 Waiting on Payment)",
    "Semaglutide|NAD+ vial|Step 3: Waiting on payment": "API - Refill - Semaglutide Combo - (Step 3 Waiting on Payment)",
    "Semaglutide|Lipo vial|Step 3: Waiting on payment": "API - Refill - Semaglutide Combo - (Step 3 Waiting on Payment)",
    "Semaglutide|B6 vial|Step 3: Waiting on payment": "API - Refill - Semaglutide Combo - (Step 3 Waiting on Payment)",
    "Semaglutide|B12 vial|Step 3: Waiting on payment": "API - Refill - Semaglutide Combo - (Step 3 Waiting on Payment)",
    // Semaglutide Step 4
    "Semaglutide|B12 syringe|Step 4: Sending payment": "api-sema-refill-invoice",
    "Semaglutide|NAD+ vial|Step 4: Sending payment": "api-sema-refill-invoice",
    "Semaglutide|Lipo vial|Step 4: Sending payment": "api-sema-refill-invoice",
    "Semaglutide|B6 vial|Step 4: Sending payment": "api-sema-refill-invoice",
    "Semaglutide|B12 vial|Step 4: Sending payment": "api-sema-refill-invoice",
  };

  submitBtn.addEventListener("click", () => {
    if (!medicationSelect.value || !compoundSelect.value || !dosageSelect.value || !stepSelect.value) {
      showToast("Please select all required options before proceeding.");
      return;
    }
    const key = buildAutomationKey(medicationSelect.value, compoundSelect.value, stepSelect.value);
    const dosageKey = buildDosageKey(medicationSelect.value, compoundSelect.value, dosageSelect.value);

    const stringToFind = selectionToString[key];
    const dosageStringToFind = dosageToString[dosageKey];

    if (!stringToFind) {
      showToast("No automation found for this selection.");
      console.error("No automation found for key:", key);
      return;
    }

    if (!dosageStringToFind) {
      showToast("No dosage found for this selection.");
      console.error("No dosage found for key:", dosageKey);
      return;
    }

    // runConsoleBased(stringToFind);
    cleanupAndSelectTag(stringToFind, dosageStringToFind);

  });

  // Add all controls to the bar
  apiBar.appendChild(medicationLabel);
  apiBar.appendChild(medicationSelect);
  apiBar.appendChild(compoundLabel);
  apiBar.appendChild(compoundSelect);
  apiBar.appendChild(dosageLabel);
  apiBar.appendChild(dosageSelect);
  apiBar.appendChild(stepLabel);
  apiBar.appendChild(stepSelect);
  apiBar.appendChild(submitBtn);

  // Initialize compound/dosage options
  updateCompoundOptions();

  return apiBar;
}

function runConsoleBased(finalTextToFind) {
  try {
    console.log(`[CRM Extension] Starting workflow for "${finalTextToFind}"`);
    showToast(`Starting workflow for "${finalTextToFind}"`);

    // Step 1: Use the console method to open the automation dialog
    const addButton = Array.from(document.querySelectorAll('button.btn.btn-light2.btn-xs'))
      .find(btn => btn.textContent.trim().includes("Add"));

    if (!addButton) {
      console.error("[CRM Extension] Add Automation button not found");
      showToast("Add Automation button not found");
      return;
    }

    console.log("[CRM Extension] Found Add button, clicking it");
    addButton.click();

    // Step 2: After dialog opens, find and populate the search field
    setTimeout(() => {
      const searchInput = document.querySelector('input[placeholder="Type to search"]');
      if (!searchInput) {
        console.error("[CRM Extension] Search input not found");
        showToast("Search input not found");
        return;
      }

      let searchStep = null;

      if (finalTextToFind.includes("Step 1")) {
        searchStep = "step 1";
      } else if (finalTextToFind.includes("Step 2")) {
        searchStep = "step 2";
      } else if (finalTextToFind.includes("Step 3")) {
        searchStep = "step 3";
      } else if (finalTextToFind.includes("Step 4")) {
        searchStep = "step 4";
      } else {
        console.error("[CRM Extension] Invalid step selected");
        showToast("Invalid step selected");
        return;
      }
      console.log(`[CRM Extension] Selected step: ${searchStep}`);

      console.log(`[CRM Extension] Found search input, entering '${searchStep}'`);
      searchInput.focus();
      searchInput.value = searchStep;
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));

      // Step 3: Wait for initial options to load, then use scroll wheel simulation
      setTimeout(() => {
        // Find the dropdown container
        const containerSelectors = [
          '.v-list', '.dropdown-menu', '.v-select-list', '.vs__dropdown-menu',
          '[role="listbox"]', 'ul', '.v-menu__content'
        ];

        let container = null;
        for (const selector of containerSelectors) {
          const element = document.querySelector(selector);

          for (let index = 0; index <= 10; index++) {
            if (
            element &&
            element.querySelector('li, .v-list-item, .dropdown-item') &&
            element.scrollHeight > element.clientHeight
          ) {
            container = element;
            console.log(`[CRM Extension] Found scrollable dropdown container: ${selector}`);
            break;
          }
        }
        }

        // Fallback: Find any scrollable element in the dialog
        if (!container) {
          const dialog = document.querySelector('.modal, dialog, [role="dialog"]');
          if (dialog) {
            const scrollables = Array.from(dialog.querySelectorAll('*')).filter(el => {
              return el.scrollHeight > el.clientHeight && el.clientHeight > 50;
            });
            if (scrollables.length > 0) {
              container = scrollables[0];
              console.log('[CRM Extension] Found scrollable element via fallback method');
            }
          }
        }

        if (!container) {
          console.error("[CRM Extension] Could not find scrollable container");
          showToast("Could not find dropdown container");
          return;
        }

        console.log("[CRM Extension] Starting scroll wheel simulation");
        console.log(`[CRM Extension] Container dimensions: ${container.scrollHeight}x${container.clientHeight}`);

        let scrollAttempts = 0;
        const maxScrollAttempts = 20;
        let foundMatch = false;

        function simulateScroll() {
          if (foundMatch || scrollAttempts >= maxScrollAttempts) {
            if (!foundMatch) {
              console.error("[CRM Extension] Max scroll attempts reached without finding match");
              showToast("Option not found after scrolling");
            }
            return;
          }

          scrollAttempts++;
          console.log(`[CRM Extension] Scroll attempt ${scrollAttempts}/${maxScrollAttempts}`);

          // Simulate wheel event
          const wheelEvent = new WheelEvent('wheel', {
            deltaY: 100,
            bubbles: true
          });
          container.dispatchEvent(wheelEvent);

          // Also update scrollTop directly
          container.scrollTop += 100;
          console.log(`[CRM Extension] Scrolled to position: ${container.scrollTop}/${container.scrollHeight}`);

          // After scrolling, check visible options
          setTimeout(() => {
            // Get all visible options
            const options = container.querySelectorAll('li, .v-list-item, .dropdown-item, [role="option"]');
            console.log(`[CRM Extension] Found ${options.length} options after scrolling`);

            for (const option of options) {
              if (!option.textContent) continue;

              const text = option.textContent.trim();
              // Exact match check
              if (
                text === finalTextToFind &&
                !text.includes("Provider Paid") &&
                !text.includes("New Patient")
              ) {
                console.log(`[CRM Extension] Found exact matching option: "${text}"`);

                // Click the option
                try {
                  option.scrollIntoView({ block: "center" });
                  setTimeout(() => {
                    option.click();
                    foundMatch = true;

                    // After selection, find and click the Add button
                    setTimeout(() => {
                      const addDialogButton = Array.from(document.querySelectorAll('button'))
                        .find(btn => btn.textContent.trim() === "Add");

                      if (addDialogButton) {
                        console.log("[CRM Extension] Clicking Add button in dialog");
                        addDialogButton.click();
                        showToast(`Added "${finalTextToFind}" workflow`);
                      } else {
                        console.error("[CRM Extension] Add button in dialog not found");
                        showToast("Add button in dialog not found");
                      }
                    }, 1000);
                  }, 300);
                } catch (e) {
                  console.error("[CRM Extension] Error clicking option:", e);
                }
                break; // Stop checking once we found a match
              }
            }

            // If we still haven't found it, continue scrolling or quit if at bottom
            if (!foundMatch) {
              const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 20;
              if (isAtBottom) {
                console.log("[CRM Extension] Reached bottom of dropdown without finding match");
                showToast(`Reached end without finding "${finalTextToFind}"`);
                return;
              }

              setTimeout(simulateScroll, 500);
            }
          }, 500);
        }

        // Start the scrolling process
        simulateScroll();

      }, 1500); // Wait for initial dropdown to load
    }, 1000);   // Wait for dialog to open
  } catch (error) {
    console.error(`[CRM Extension] Error in workflow:`, error);
    showToast(`Error in workflow: ${error.message}`);
  }
}
async function cleanupAndSelectTag(tagText, doseText) {
  try {
    // Run tag and automation removal in parallel for speed
    const [tagResult, automationResult] = await Promise.all([
      removeAllTags(),
      removeAllAutomations()
    ]);

    console.log('[CRM Extension] Cleanup completed:');
    console.log(`- Tags: ${tagResult.removed}/${tagResult.total} removed`);
    console.log(`- Automations: ${automationResult.removed}/${automationResult.total} removed`);

    // Now proceed with selecting the new tag
    // selectTagOption(doseText);
    await selectTagOptionAsync(doseText);
    await selectTagOptionAsync(tagText);
    // setTimeout(() => {
    //   selectTagOption(tagText);
    // }, 1000); // Wait a bit before selecting the tag
  } catch (error) {
    console.error('[CRM Extension] Error during cleanup:', error);
    showToast('Error during cleanup. Please try again.');
  }
}

/**
 * Selects a tag option from the dropdown
 *
 * @param {string} tagText - The text of the tag to select
 */
function selectTagOption(tagText) {
  // Find the Tags input field with expanded selectors
  let tagInput = findTagInput();

  if (tagInput) {
    // Focus on the input field to open the dropdown
    tagInput.focus();

    // Try to find the tag in the list of options
    // Wait a moment for the dropdown to appear
    setTimeout(() => {
      // Type the text to filter the dropdown
      tagInput.value = tagText;
      tagInput.dispatchEvent(new Event('input', { bubbles: true }));

      // Wait for the filtered dropdown to update
      setTimeout(() => {
        // Look for the option in the dropdown that contains our text
        const options = document.querySelectorAll('.v-list-item, .dropdown-item, .select-option, li');
        let found = false;

        for (const option of options) {
          if (option.textContent.toLowerCase().includes(tagText)) {
            // Click the option to select it
            option.click();
            found = true;
            showToast(`Selected tag: ${tagText}`);
            break;
          }
        }

        // If we can't find the exact option, try alternative approaches
        if (!found) {
          // Try looking for a more generic class that might contain dropdown options
          const allElements = document.querySelectorAll('*');
          for (const elem of allElements) {
            if (elem.textContent.trim().toLowerCase() === tagText) {
              // If we find text content that matches exactly, try clicking it
              elem.click();
              found = true;
              showToast(`Selected tag: ${tagText}`);
              break;
            }
          }

          // If still not found, try keyboard navigation - press Enter key
          if (!found) {
            // Press Enter key to attempt to select the filtered option
            tagInput.dispatchEvent(new KeyboardEvent('keydown', {
              key: 'Enter',
              code: 'Enter',
              keyCode: 13,
              which: 13,
              bubbles: true
            }));
          }
        }
      }, 300); // Wait for dropdown to filter
    }, 300); // Wait for dropdown to appear
  } else {
    showToast("Tags field not found");
  }
}

/**
 * Enhanced function to find the tag input field with multiple strategies
 * @returns {HTMLElement|null} The found tag input element or null
 */
function findTagInput() {
  // Try several strategies to find the tag input field

  // Strategy 1: Original selector - looking for "Add Tags" placeholder
  let tagInput = document.querySelector('input[placeholder="Add Tags"]');
  if (tagInput) return tagInput;

  // Strategy 2: Broader placeholder pattern - any input with "tag" in placeholder
  const tagInputs = Array.from(document.querySelectorAll('input[placeholder]')).filter(input => {
    return input.placeholder.toLowerCase().includes('tag');
  });
  if (tagInputs.length > 0) return tagInputs[0];

  // Strategy 3: Input within element with tag-related class
  const tagContainers = document.querySelectorAll('.tag-input, .tags-input, .tag-container');
  for (const container of tagContainers) {
    const input = container.querySelector('input');
    if (input) return input;
  }

  // Strategy 4: Looking for smartList.bulkTags placeholder (from your example)
  tagInput = document.querySelector('input[placeholder="smartList.bulkTags.addTags"]');
  if (tagInput) return tagInput;

  // Strategy 5: Generic attribute search - looking for any input that might be for tags
  const possibleTagInputs = document.querySelectorAll('.hl-text-input');
  if (possibleTagInputs.length > 0) {
    return possibleTagInputs[0]; // Return the first one as best guess
  }

  // If no tag input found with any strategy
  console.error('[CRM Extension] Could not find tag input field with any strategy');

  // One last attempt - log all inputs to help diagnose
  const allInputs = document.querySelectorAll('input');
  console.log('[CRM Extension] All inputs on page:', allInputs);

  return null;
}

// Promise-based version of selectTagOption
function selectTagOptionAsync(tagText) {
  return new Promise((resolve) => {
    let tagInput = findTagInput();

    if (tagInput) {
      tagInput.focus();

      setTimeout(() => {
        tagInput.value = tagText;
        tagInput.dispatchEvent(new Event('input', { bubbles: true }));

        setTimeout(() => {
          const options = document.querySelectorAll('.v-list-item, .dropdown-item, .select-option, li');
          let found = false;

          for (const option of options) {
            if (option.textContent.toLowerCase().includes(tagText)) {
              option.click();
              found = true;
              showToast(`Selected tag: ${tagText}`);
              break;
            }
          }

          if (!found) {
            const allElements = document.querySelectorAll('*');
            for (const elem of allElements) {
              if (elem.textContent.trim().toLowerCase() === tagText) {
                elem.click();
                found = true;
                showToast(`Selected tag: ${tagText}`);
                break;
              }
            }
            if (!found) {
              tagInput.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true
              }));
            }
          }
          // Wait a bit to ensure UI updates before resolving
          setTimeout(resolve, 400);
        }, 300);
      }, 300);
    } else {
      showToast("Tags field not found");
      resolve();
    }
  });
}
