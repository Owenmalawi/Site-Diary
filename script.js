const STORAGE_KEY = "dailySiteDiaryRecords_v1";
const DOC_PASSWORD = "Unik2026";

// Activities available for each position
const roleActivities = {
  "Environmental Health and Safety / Social": [
    "Meeting",
    "Training",
    "Other activity"
  ],

  "Foreman": [
    "Roadbed processing",
    "Dump material",
    "Setting out of layers",
    "Other activity"
  ],

  "Lab Technician": [
    "Testing for roadbed",
    "Fill layer testing",
    "Other activity"
  ],

  "Surveyor": [
    "Setting out for roadbed",
    "Setting out after fill layer dumped",
    "Other activity"
  ],

  "Documentation Officer": [
    "Other activity"
  ]
};


// Get HTML elements
const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");

const roleSelect = document.getElementById("role");
const passwordWrap = document.getElementById("passwordWrap");
const passwordInput = document.getElementById("password");

const activitySelect = document.getElementById("activityType");
const layerField = document.getElementById("layerField");
const layerSelect = document.getElementById("layer");

const activityForm = document.getElementById("activityForm");

const locationInput = document.getElementById("location");
const detailsInput = document.getElementById("details");

let currentUser = null;


// AUTOMATIC DATE
function todayISO() {
  const now = new Date();

  const local = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000
  );

  return local.toISOString().slice(0, 10);
}


// Format date
function prettyDate(value) {
  if (!value) return "";

  return new Date(value + "T00:00:00").toLocaleDateString(
    undefined,
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );
}


// GET SAVED RECORDS
function getRecords() {
  try {
    return JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );
  } catch {
    return [];
  }
}


// SAVE RECORDS
function saveRecords(records) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(records)
  );
}


// LOGIN ERROR
function showLoginError(message) {
  document.getElementById("loginError").textContent =
    message || "";
}


// POPULATE SELECT OPTIONS
function populateSelect(select, values, firstLabel) {

  select.innerHTML = "";

  const first = document.createElement("option");

  first.value = "";
  first.textContent = firstLabel;

  select.appendChild(first);

  values.forEach(value => {

    const option = document.createElement("option");

    option.value = value;
    option.textContent = value;

    select.appendChild(option);

  });
}


// REFRESH ACTIVITY OPTIONS
function refreshActivityOptions() {

  const role = currentUser?.role;

  populateSelect(
    activitySelect,
    roleActivities[role] || ["Other activity"],
    "Select activity"
  );

  layerSelect.innerHTML =
    '<option value="">Not applicable</option>';

  layerField.classList.add("hidden");

  detailsInput.placeholder =
    "Add details, quantities, observations, or other work such as lab construction...";
}


// LAYER SELECTION
function updateLayerVisibility() {

  const role = currentUser?.role;

  const activity = activitySelect.value;

  layerField.classList.add("hidden");

  layerSelect.required = false;

  layerSelect.innerHTML =
    '<option value="">Not applicable</option>';

  let max = 0;


  // FOREMAN: LAYER 1 TO 20

  if (
    role === "Foreman" &&
    [
      "Dump material",
      "Setting out of layers"
    ].includes(activity)
  ) {
    max = 20;
  }


  // LAB TECHNICIAN: LAYER 1 TO 30

  if (
    role === "Lab Technician" &&
    activity === "Fill layer testing"
  ) {
    max = 30;
  }


  if (max) {

    layerField.classList.remove("hidden");

    layerSelect.required = true;

    layerSelect.innerHTML =
      '<option value="">Select layer</option>';

    for (let i = 1; i <= max; i++) {

      const option = document.createElement("option");

      option.value = String(i);

      option.textContent = `Layer ${i}`;

      layerSelect.appendChild(option);

    }

  }

}


// OPEN APPLICATION
function enterApp() {

  loginView.classList.add("hidden");

  appView.classList.remove("hidden");


  document.getElementById("roleHeading").textContent =
    currentUser.role === "Documentation Officer"
      ? "Documentation dashboard"
      : `${currentUser.role} activity entry`;


  document.getElementById("signedInAs").textContent =
    `Signed in as ${currentUser.name} • ${currentUser.role}`;


  document.getElementById("formDate").textContent =
    prettyDate(todayISO());


  // Documentation Officer sees all records

  document.getElementById("entryPanel").classList.toggle(
    "hidden",
    currentUser.role === "Documentation Officer"
  );


  document.getElementById("recordsPanel").classList.toggle(
    "hidden",
    currentUser.role !== "Documentation Officer"
  );


  document.getElementById("myRecordsPanel").classList.toggle(
    "hidden",
    currentUser.role === "Documentation Officer"
  );


  refreshActivityOptions();

  renderMyRecords();


  if (currentUser.role === "Documentation Officer") {

    renderAllRecords();

  }

}


// LOGOUT
function leaveApp() {

  currentUser = null;

  appView.classList.add("hidden");

  loginView.classList.remove("hidden");

  document.getElementById("loginForm").reset();

  passwordWrap.classList.add("hidden");

  showLoginError("");

}


// SHOW PASSWORD FIELD FOR DOCUMENTATION OFFICER
roleSelect.addEventListener("change", () => {

  const needsPassword =
    roleSelect.value === "Documentation Officer";

  passwordWrap.classList.toggle(
    "hidden",
    !needsPassword
  );

  passwordInput.required = needsPassword;

});


// LOGIN SYSTEM
document.getElementById("loginForm").addEventListener(
  "submit",
  event => {

    event.preventDefault();

    const role = roleSelect.value;

    const name =
      document.getElementById("staffName").value.trim();


    if (!role || !name) {

      return showLoginError(
        "Please select your position and enter your name."
      );

    }


    // DOCUMENTATION OFFICER PASSWORD

    if (
      role === "Documentation Officer" &&
      passwordInput.value !== DOC_PASSWORD
    ) {

      return showLoginError(
        "Incorrect Documentation Officer password."
      );

    }


    currentUser = {
      role: role,
      name: name
    };


    showLoginError("");

    enterApp();

  }
);


// LOGOUT BUTTON
document.getElementById("logoutBtn").addEventListener(
  "click",
  leaveApp
);


// ACTIVITY SELECTION
activitySelect.addEventListener(
  "change",
  updateLayerVisibility
);


// SAVE DAILY SITE ACTIVITY
activityForm.addEventListener("submit", event => {

  event.preventDefault();

  if (!currentUser) return;


  const activity = activitySelect.value;

  const location = locationInput.value.trim();


  if (!activity || !location) return;


  const record = {

    id: (window.crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`,

    date: todayISO(),

    submittedAt: new Date().toISOString(),

    staffName: currentUser.name,

    position: currentUser.role,

    activity: activity,

    layer: layerSelect.value || "",

    location: location,

    details: detailsInput.value.trim()

  };


  const records = getRecords();

  records.push(record);

  saveRecords(records);


  // CLEAR FORM AFTER SAVING

  activityForm.reset();

  updateLayerVisibility();


  document.getElementById("formDate").textContent =
    prettyDate(todayISO());


  document.getElementById("saveMessage").textContent =
    "Activity saved successfully on this device.";


  renderMyRecords();


  setTimeout(() => {

    document.getElementById("saveMessage").textContent = "";

  }, 4500);

});


// PREVENT HTML INJECTION
function escapeHTML(value) {

  return String(value ?? "").replace(/[&<>"']/g, char => ({

    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"

  }[char]));

}


// DISPLAY MY RECENT RECORDS
function renderMyRecords() {

  const target = document.getElementById("myRecords");


  const mine = getRecords()

    .filter(record =>

      record.staffName === currentUser.name &&
      record.position === currentUser.role

    )

    .sort((a, b) =>

      (b.submittedAt || "").localeCompare(
        a.submittedAt || ""
      )

    )

    .slice(0, 6);


  if (!mine.length) {

    target.innerHTML =
      '<div class="empty-state">You have not submitted any activities yet.</div>';

    return;

  }


  target.innerHTML = mine.map(record => `

    <article class="record-item">

      <div>

        <strong>

          ${escapeHTML(record.activity)}

          ${record.layer
            ? ` • Layer ${escapeHTML(record.layer)}`
            : ""}

        </strong>

        <p>

          ${escapeHTML(record.location)}

          ${record.details
            ? ` — ${escapeHTML(record.details)}`
            : ""}

        </p>

      </div>

      <time>

        ${escapeHTML(prettyDate(record.date))}

      </time>

    </article>

  `).join("");

}


// DOCUMENTATION OFFICER: DISPLAY ALL RECORDS
function renderAllRecords() {

  const all = getRecords().sort((a, b) => {

    const dateCompare =
      (b.date || "").localeCompare(a.date || "");

    return dateCompare ||
      (b.submittedAt || "").localeCompare(
        a.submittedAt || ""
      );

  });


  const query =
    document.getElementById("searchRecords")
      .value.trim().toLowerCase();


  const date =
    document.getElementById("filterDate").value;


  const filtered = all.filter(record => {

    const text = [

      record.staffName,
      record.position,
      record.activity,
      record.location,
      record.details,
      record.layer

    ].join(" ").toLowerCase();


    return (

      (!query || text.includes(query)) &&
      (!date || record.date === date)

    );

  });


  document.getElementById("recordCount").textContent =

    `${filtered.length} record${filtered.length === 1 ? "" : "s"}`;


  document.getElementById("emptyRecords").classList.toggle(
    "hidden",
    filtered.length !== 0
  );


  document.getElementById("recordsBody").innerHTML =
    filtered.map(record => `

      <tr>

        <td>${escapeHTML(prettyDate(record.date))}</td>

        <td>${escapeHTML(record.staffName)}</td>

        <td>${escapeHTML(record.position)}</td>

        <td>${escapeHTML(record.activity)}</td>

        <td>
          ${record.layer
            ? `Layer ${escapeHTML(record.layer)}`
            : "—"}
        </td>

        <td>${escapeHTML(record.location)}</td>

        <td>${escapeHTML(record.details || "—")}</td>

      </tr>

    `).join("");

}


// SEARCH RECORDS
document.getElementById("searchRecords").addEventListener(
  "input",
  renderAllRecords
);


// FILTER BY DATE
document.getElementById("filterDate").addEventListener(
  "change",
  renderAllRecords
);


// CLEAR FILTERS
document.getElementById("clearFilter").addEventListener(
  "click",
  () => {

    document.getElementById("searchRecords").value = "";

    document.getElementById("filterDate").value = "";

    renderAllRecords();

  }
);


// DOWNLOAD FILE
function downloadFile(filename, content, type) {

  const blob = new Blob(
    [content],
    { type: type }
  );


  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  link.download = filename;

  document.body.appendChild(link);

  link.click();

  link.remove();

  URL.revokeObjectURL(url);

}


// CSV EXPORT
function csvCell(value) {

  return `"${String(value ?? "").replace(/"/g, '""')}"`;

}


document.getElementById("exportCsv").addEventListener(
  "click",
  () => {

    const records = getRecords();


    const columns = [

      "date",
      "staffName",
      "position",
      "activity",
      "layer",
      "location",
      "details",
      "submittedAt"

    ];


    const lines = [

      columns.join(","),

      ...records.map(record =>

        columns.map(key =>

          csvCell(record[key])

        ).join(",")

      )

    ];


    downloadFile(

      `daily-site-diary-${todayISO()}.csv`,

      "\uFEFF" + lines.join("\r\n"),

      "text/csv;charset=utf-8"

    );

  }
);


// JSON BACKUP
document.getElementById("exportJson").addEventListener(
  "click",
  () => {

    downloadFile(

      `daily-site-diary-backup-${todayISO()}.json`,

      JSON.stringify(getRecords(), null, 2),

      "application/json"

    );

  }
);


// IMPORT JSON BACKUP
document.getElementById("importFile").addEventListener(
  "change",
  async event => {

    const file = event.target.files[0];

    if (!file) return;


    try {

      const imported = JSON.parse(await file.text());


      if (!Array.isArray(imported)) {

        throw new Error(
          "Backup must contain a list of records."
        );

      }


      const valid = imported.filter(item =>

        item &&
        item.date &&
        item.staffName &&
        item.position &&
        item.activity &&
        item.location

      );


      const existing = getRecords();

      const ids = new Set(

        existing.map(item => item.id).filter(Boolean)

      );


      const additions = valid

        .filter(item => !item.id || !ids.has(item.id))

        .map(item => ({

          ...item,

          id: item.id ||
            `${Date.now()}-${Math.random().toString(16).slice(2)}`

        }));


      saveRecords(existing.concat(additions));

      renderAllRecords();


      alert(
        `${additions.length} record(s) imported successfully.`
      );


    } catch (error) {

      alert(
        `Could not import backup: ${error.message}`
      );

    } finally {

      event.target.value = "";

    }

  }
);


// AUTOMATIC DATE DISPLAY
document.getElementById("todayLabel").textContent =

  new Date().toLocaleDateString(

    undefined,

    {

      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric"

    }

  );


document.getElementById("formDate").textContent =

  prettyDate(todayISO());