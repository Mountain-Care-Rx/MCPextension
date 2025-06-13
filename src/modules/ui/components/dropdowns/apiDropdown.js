import { showToast } from "../../../phoneUtils";
import { removeAllTags, removeAllAutomations } from '../../../ui/headerBar.js';

let selectedMedication = null;
let selectedCompound = null;
let selectedDosage = null;

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
  compoundLabel.style.display = "none";
  compoundSelect.style.display = "none";

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
  dosageLabel.style.display = "none";
  dosageSelect.style.display = "none";

  // --- Submit button ---
  const submitBtn = document.createElement("button");
  submitBtn.textContent = "Step 1";
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

  // --- Name Step button ---
  const nameBtn = document.createElement("button");
  nameBtn.textContent = "Name";
  nameBtn.style.marginLeft = "6px";
  nameBtn.style.padding = "2px 12px";
  nameBtn.style.background = "#6c63ff";
  nameBtn.style.color = "#fff";
  nameBtn.style.border = "none";
  nameBtn.style.borderRadius = "3px";
  nameBtn.style.fontWeight = "bold";
  nameBtn.style.fontSize = "12px";
  nameBtn.style.cursor = "pointer";
  nameBtn.style.height = "24px";
  nameBtn.style.display = "none";
  nameBtn.addEventListener("mouseenter", () => nameBtn.style.background = "#4b47b7");
  nameBtn.addEventListener("mouseleave", () => nameBtn.style.background = "#6c63ff");

  // Show/hide Name button based on state
  function updateNameBtnVisibility() {
    if (medicationSelect.value && submitBtn.textContent === "Step 1") {
      nameBtn.style.display = "inline-block";
    } else {
      nameBtn.style.display = "none";
    }
  }

  medicationSelect.addEventListener("change", updateNameBtnVisibility);
  compoundSelect.addEventListener("change", updateNameBtnVisibility);
  dosageSelect.addEventListener("change", updateNameBtnVisibility);
  submitBtn.addEventListener("click", updateNameBtnVisibility);

  // Name button click handler
  nameBtn.addEventListener("click", async () => {
    // Step 1.5: Verify first name
    let tag = null;
    if (medicationSelect.value === "Tirzepatide") {
      tag = "api-refill-patient-tirz-name";
    } else if (medicationSelect.value === "Semaglutide") {
      tag = "api-refill-patient-sema-name";
    }
    if (tag) {
      await cleanupAndSelectTag(tag);
    } else {
      showToast("Please select a medication.");
    }
  });

  // --- Show/hide dropdowns and update button label based on selection ---
  medicationSelect.addEventListener("change", () => {
    selectedMedication = medicationSelect.value;
    if (selectedMedication) {
      compoundLabel.style.display = "inline-block";
      compoundSelect.style.display = "inline-block";
      submitBtn.textContent = "Step 1";
    } else {
      compoundLabel.style.display = "none";
      compoundSelect.style.display = "none";
      dosageLabel.style.display = "none";
      dosageSelect.style.display = "none";
      submitBtn.textContent = "Step 1";
    }
    updateCompoundOptions();
  });

  compoundSelect.addEventListener("change", () => {
    selectedCompound = compoundSelect.value;
    if (selectedCompound) {
      dosageLabel.style.display = "inline-block";
      dosageSelect.style.display = "inline-block";
      submitBtn.textContent = "Step 2";
    } else {
      dosageLabel.style.display = "none";
      dosageSelect.style.display = "none";
      submitBtn.textContent = "Step 1";
    }
    updateDosageOptions();
  });

  dosageSelect.addEventListener("change", () => {
    selectedDosage = dosageSelect.value;
    if (selectedDosage) {
      submitBtn.textContent = "Step 4";
    } else {
      submitBtn.textContent = "Step 2";
    }
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
    "Tirzepatide|B6 syringe|Step 1: Start Refill": "api-refill-patient-tirz",
    "Tirzepatide|NAD+ vial|Step 1: Start Refill": "api-refill-patient-tirz",
    "Tirzepatide|Lipo vial|Step 1: Start Refill": "api-refill-patient-tirz",
    "Tirzepatide|B6 vial|Step 1: Start Refill": "api-refill-patient-tirz",
    "Tirzepatide|B12 vial|Step 1: Start Refill": "api-refill-patient-tirz",

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
    "Semaglutide|B12 syringe|Step 1: Start Refill": "api-refill-patient-sema",
    "Semaglutide|NAD+ vial|Step 1: Start Refill": "api-refill-patient-sema",
    "Semaglutide|Lipo vial|Step 1: Start Refill": "api-refill-patient-sema",
    "Semaglutide|B6 vial|Step 1: Start Refill": "api-refill-patient-sema",
    "Semaglutide|B12 vial|Step 1: Start Refill": "api-refill-patient-sema",

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

  submitBtn.addEventListener("click", async () => {
    // if (!medicationSelect.value || !compoundSelect.value || !dosageSelect.value) {
    //   showToast("Please select all required options before proceeding.");
    //   return;
    // }
    // Determine step from button label
    let stepValue = null;
    if (submitBtn.textContent === "Step 1") {
      stepValue = "Step 1: Start Refill";
      if (medicationSelect.value === "Tirzepatide") {
        cleanupAndSelectTag("api-refill-patient-tirz");
        return;
      } else if (medicationSelect.value === "Semaglutide") {
        cleanupAndSelectTag("api-refill-patient-sema");
        return;
      }
    } else if (submitBtn.textContent === "Step 2") {
      stepValue = "Step 2: Verify form";
      if (medicationSelect.value === "Tirzepatide") {
        cleanupAndSelectTag("api-refill-patient-tirz-form");
        return;
      } else if (medicationSelect.value === "Semaglutide") {
        cleanupAndSelectTag("api-refill-patient-sema-form");
        return;
      }
    } else if (submitBtn.textContent === "Step 4") {
      stepValue = "Step 4: Sending payment";
    } else {
      showToast("Unknown step. Please check your selections.");
      return;
    }
    const key = buildAutomationKey(medicationSelect.value, compoundSelect.value, stepValue);
    const dosageKey = buildDosageKey(medicationSelect.value, compoundSelect.value, dosageSelect.value);

    const stringToFind = selectionToString[key];
    const dosageStringToFind = dosageToString[dosageKey];

    if (!stringToFind) {
      showToast("No tag found for this selection.");
      console.error("No tag found for key:", key);
      return;
    }

    if (submitBtn.textContent === "Step 4") {
      if (!dosageStringToFind) {
        showToast("No dosage found for this selection.");
        console.error("No dosage found for key:", dosageKey);
        return;
      }
      await cleanupAndSelectTag(stringToFind, dosageStringToFind);
    } else {
      await cleanupAndSelectTag(stringToFind);
    }
  });

  // Add all controls to the bar
  apiBar.appendChild(medicationLabel);
  apiBar.appendChild(medicationSelect);
  apiBar.appendChild(compoundLabel);
  apiBar.appendChild(compoundSelect);
  apiBar.appendChild(dosageLabel);
  apiBar.appendChild(dosageSelect);
  apiBar.appendChild(submitBtn);
  apiBar.appendChild(nameBtn);

  // Initialize compound/dosage options
  updateCompoundOptions();

  // Set initial visibility: only show medication select and submit button
  compoundLabel.style.display = "none";
  compoundSelect.style.display = "none";
  dosageLabel.style.display = "none";
  dosageSelect.style.display = "none";
  submitBtn.style.display = "inline-block";

  // Helper to update compound options based on selected medication
  function updateCompoundOptions() {
    compoundSelect.innerHTML = '<option value="">Select</option>';
    dosageSelect.innerHTML = '<option value="">Select</option>';

    if (medicationSelect.value === 'Tirzepatide') {
      compoundSelect.innerHTML += `
        <option value="B6 syringe">B6 syringe</option>
        <option value="NAD+ vial">NAD+ vial</option>
        <option value="Lipo vial">Lipo vial</option>
        <option value="B6 vial">B6 vial</option>
        <option value="B12 vial">B12 vial</option>
      `;
    } else if (medicationSelect.value === 'Semaglutide') {
      compoundSelect.innerHTML += `
        <option value="B12 syringe">B12 syringe</option>
        <option value="NAD+ vial">NAD+ vial</option>
        <option value="Lipo vial">Lipo vial</option>
        <option value="B6 vial">B6 vial</option>
        <option value="B12 vial">B12 vial</option>
      `;
    }
  }

  // Helper to update dosage options based on selected medication and compound
  function updateDosageOptions() {
    dosageSelect.innerHTML = '<option value="">Select</option>';

    if (medicationSelect.value === 'Tirzepatide' && compoundSelect.value === 'B6 syringe') {
      dosageSelect.innerHTML += `
        <option value="QTY: 1 - 0.25 ml">QTY: 1 - 0.25 ml</option>
        <option value="QTY: 2 - 0.5 ml">QTY: 2 - 0.5 ml</option>
        <option value="QTY: 3 - 0.75 ml">QTY: 3 - 0.75 ml</option>
        <option value="QTY: 4 - 1.0 ml">QTY: 4 - 1.0 ml</option>
        <option value="QTY: 5 - 1.25 ml">QTY: 5 - 1.25 ml</option>
        <option value="QTY: 6 - 1.5 ml">QTY: 6 - 1.5 ml</option>
      `;
    } else if (medicationSelect.value === 'Semaglutide' && compoundSelect.value === 'B12 syringe') {
      dosageSelect.innerHTML += `
        <option value="QTY: 0.5 - 0.125 ml">QTY: 0.5 - 0.125 ml</option>
        <option value="QTY: 1 - 0.25 ml">QTY: 1 - 0.25 ml</option>
        <option value="QTY: 2 - 0.5 ml">QTY: 2 - 0.5 ml</option>
        <option value="QTY: 3 - 0.75 ml">QTY: 3 - 0.75 ml</option>
        <option value="QTY: 4 - 1.0 ml">QTY: 4 - 1.0 ml</option>
        <option value="QTY: 5 - 1.25 ml">QTY: 5 - 1.25 ml</option>
        <option value="QTY: 6 - 1.5 ml">QTY: 6 - 1.5 ml</option>
        <option value="QTY: 7 - 1.75 ml">QTY: 7 - 1.75 ml</option>
        <option value="QTY: 8 - 2.0 ml">QTY: 8 - 2.0 ml</option>
      `;
    } else if (compoundSelect.value.endsWith('vial')) {
      dosageSelect.innerHTML += `
        <option value="2.5 ml">2.5 ml</option>
        <option value="5 ml">5 ml</option>
        <option value="7.5 ml">7.5 ml</option>
        <option value="10 ml">10 ml</option>
      `;
    }
  }

  return apiBar;
}
async function cleanupAndSelectTag(tagText, doseText) {
  try {
    // Always remove all tags before selecting new ones
    const tagResult = await removeAllTags();
    console.log('[CRM Extension] Cleanup completed:');
    console.log(`- Tags: ${tagResult.removed}/${tagResult.total} removed`);

    if (doseText) {
      // For Step 4: select both dosage and main tag, in order
      await selectTagOptionAsync(doseText);
      await selectTagOptionAsync(tagText);
    } else {
      // For Step 1/2: select only the main tag
      await selectTagOptionAsync(tagText);
    }
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
