import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCVtNJ-7VnZGYFdzje3jlZp459-jlLUNdA",
    authDomain: "kplymamember.firebaseapp.com",
    databaseURL: "https://kplymamember-default-rtdb.firebaseio.com",
    projectId: "kplymamember",
    storageBucket: "kplymamember.firebasestorage.app",
    messagingSenderId: "652933323548",
    appId: "1:652933323548:web:d2f46b7c3bb5dfde52b8d9",
    measurementId: "G-JQCXJPK57C"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const bearersDbRef = ref(db, 'office_bearers');

let currentRole = null;
let allMembersData = {};
let firebaseOfficeBearers = {};

let currentPage = 1;
const recordsPerPage = 10;
let filteredListArray = [];

const currentSystemYear = 2026;
const nextSystemYear = currentSystemYear + 1;

const fallbackBearersData = {
    "2026": [
        { name: "Lalrinawma", role: "President", image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300" },
        { name: "Zosangliana", role: "Vice President", image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300" },
        { name: "Vanlalruati", role: "Secretary", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300" },
        { name: "Lalthazuala", role: "Asst. Secretary", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300" },
        { name: "Raltanpuia", role: "Treasurer", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300" },
        { name: "Lalremruati", role: "Fin. Secretary", image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300" }
    ]
};

const loginSidebar = document.getElementById('loginSidebar');
const drawerOverlay = document.getElementById('drawerOverlay');
const openLoginBtn = document.getElementById('openLoginBtn');
const closeLoginBtn = document.getElementById('closeLoginBtn');
const entryFormSection = document.getElementById('entryFormSection');
const bearerEntrySection = document.getElementById('bearerEntrySection');
const bearersSection = document.getElementById('bearersSection');

const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const roleBadge = document.getElementById('roleBadge');
const logoutBtn = document.getElementById('logoutBtn');
const adminControls = document.getElementById('adminControls');
const thAction = document.getElementById('thAction');
const memberTableBody = document.getElementById('memberTableBody');
const searchInput = document.getElementById('searchName');
const filterSection = document.getElementById('filterSection');
const tableViewStatus = document.getElementById('tableViewStatus');
const paginationButtonsContainer = document.getElementById('paginationButtons');
const pageRangeText = document.getElementById('pageRangeText');
const totalRecordsText = document.getElementById('totalRecordsText');
const bearerYearSelect = document.getElementById('bearerYearSelect');
const bearersGrid = document.getElementById('bearersGrid');

const memberEntryYearSelect = document.getElementById('memberEntryYear');
const memberYearFilter = document.getElementById('memberYearFilter');

const bearerForm = document.getElementById('bearerForm');
const bearerYearFormSelect = document.getElementById('bearerYear');
const editBearerIdInput = document.getElementById('editBearerId');
const bearerSubmitBtn = document.getElementById('bearerSubmitBtn');
const cancelBearerEditBtn = document.getElementById('cancelBearerEditBtn');
const editPhotoNote = document.getElementById('editPhotoNote');
const adminBearerLogsTableBody = document.getElementById('adminBearerLogsTableBody');

// Member Sub-Matrix Dynamic Selectors
const dynamicMembersContainer = document.getElementById('dynamicMembersContainer');
const addMemberRowBtn = document.getElementById('addMemberRowBtn');
const editMemberIdInput = document.getElementById('editMemberId');
const memberSubmitBtn = document.getElementById('memberSubmitBtn');
const cancelMemberEditBtn = document.getElementById('cancelMemberEditBtn');
const extractPdfBtn = document.getElementById('extractPdfBtn');

window.addEventListener('DOMContentLoaded', () => {
    setupDynamicYearDropdowns();
    listenToOfficeBearers();
    listenToMembersDatabase(memberYearFilter.value);
    setupDynamicMatrixListeners();

    const savedRole = localStorage.getItem('yma_user_role');
    if (savedRole) {
        initDashboard(savedRole);
    }
});

function setupDynamicYearDropdowns() {
    bearerYearSelect.innerHTML = "";
    memberYearFilter.innerHTML = "";
    bearerYearFormSelect.innerHTML = "";
    memberEntryYearSelect.innerHTML = "";

    for (let year = nextSystemYear; year >= 2014; year--) {
        const option1 = document.createElement('option');
        const option2 = document.createElement('option');
        const option3 = document.createElement('option');
        const option4 = document.createElement('option');

        option1.value = option2.value = option3.value = option4.value = year;

        if (year === currentSystemYear) {
            option1.textContent = `Current (${year})`;
            option2.textContent = `Kum: ${year} (Current)`;
            option3.textContent = `${year} (Current)`;
            option4.textContent = `${year} (Current)`;
            option1.selected = option2.selected = option3.selected = option4.selected = true;
        } else {
            option1.textContent = year;
            option2.textContent = `Kum: ${year}`;
            option3.textContent = year;
            option4.textContent = year;
        }

        bearerYearSelect.appendChild(option1);
        memberYearFilter.appendChild(option2);
        bearerYearFormSelect.appendChild(option3);
        memberEntryYearSelect.appendChild(option4);
    }
}

// Matrix Management Blocks
function setupDynamicMatrixListeners() {
    addMemberRowBtn.addEventListener('click', () => {
        appendMatrixRow("", "");
    });

    dynamicMembersContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-row-btn')) {
            const rows = dynamicMembersContainer.querySelectorAll('.member-dynamic-row');
            if (rows.length > 1) {
                e.target.closest('.member-dynamic-row').remove();
                updateMatrixDeleteButtonsState();
            }
        }
    });
}

function appendMatrixRow(nameVal = "", dobVal = "", phoneVal = "") {
    const row = document.createElement('div');
    row.className = "grid grid-cols-12 gap-2 items-center member-dynamic-row bg-white p-1.5 rounded border border-slate-100 shadow-2xs";
    row.innerHTML = `
        <div class="col-span-4">
            <input type="text" required value="${nameVal}" placeholder="Member Hming" class="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 member-name-field">
        </div>
        <div class="col-span-3">
            <input type="date" required value="${dobVal}" class="w-full px-1.5 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 member-dob-field">
        </div>
        <div class="col-span-4">
            <input type="text" required value="${phoneVal}" placeholder="Contact No" maxlength="10" inputmode="numeric" 
                class="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 member-phone-field"
                oninput="this.value = this.value.replace(/[^0-9]/g, '')">
        </div>
        <div class="col-span-1 text-center">
            <button type="button" class="text-slate-400 text-sm font-bold remove-row-btn transition cursor-pointer">&times;</button>
        </div>
    `;
    dynamicMembersContainer.appendChild(row);
    updateMatrixDeleteButtonsState();
}

function updateMatrixDeleteButtonsState() {
    const rows = dynamicMembersContainer.querySelectorAll('.member-dynamic-row');
    rows.forEach((row) => {
        const btn = row.querySelector('.remove-row-btn');
        if (rows.length === 1) {
            btn.disabled = true;
            btn.classList.add('text-slate-300', 'cursor-not-allowed');
            btn.classList.remove('text-slate-400', 'cursor-pointer');
        } else {
            btn.disabled = false;
            btn.classList.remove('text-slate-300', 'cursor-not-allowed');
            btn.classList.add('text-slate-400', 'cursor-pointer');
        }
    });
}

function resetMatrixToDefault() {
    dynamicMembersContainer.innerHTML = "";
    appendMatrixRow("", "");
}

openLoginBtn.addEventListener('click', () => toggleLoginDrawer(true));
closeLoginBtn.addEventListener('click', () => toggleLoginDrawer(false));
drawerOverlay.addEventListener('click', () => toggleLoginDrawer(false));

function toggleLoginDrawer(open) {
    if (open) {
        loginSidebar.classList.remove('translate-x-full');
        drawerOverlay.classList.remove('hidden');
    } else {
        loginSidebar.classList.add('translate-x-full');
        drawerOverlay.classList.add('hidden');
    }
}

function listenToOfficeBearers() {
    onValue(bearersDbRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            firebaseOfficeBearers = data;
        } else {
            set(bearersDbRef, fallbackBearersData);
            firebaseOfficeBearers = fallbackBearersData;
        }
        renderOfficeBearers(bearerYearSelect.value);
        renderAdminBearerLogs();
    });
}

function renderOfficeBearers(year) {
    bearersGrid.innerHTML = "";
    let list = [];
    if (firebaseOfficeBearers[year]) {
        list = Object.keys(firebaseOfficeBearers[year]).map(key => ({
            id: key,
            ...firebaseOfficeBearers[year][key]
        }));
    }

    if (list.length === 0) {
        bearersGrid.innerHTML = `<div class="col-span-full text-center p-8 text-slate-400 italic">Kum ${year} tan hian Office Bearer dah luh an la awm lo.</div>`;
        return;
    }

    const roleOrder = {
        "President": 1, "Vice President": 2, "Secretary": 3, "Asst. Secretary": 4, "Treasurer": 5, "Fin. Secretary": 6
    };

    list.sort((a, b) => (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99));

    list.forEach(member => {
        const card = document.createElement('div');
        card.className = "bg-slate-50 border border-slate-200 p-8 rounded-2xl text-center shadow-xs flex flex-col items-center group hover:shadow-lg hover:bg-white transition-all duration-200 relative";
        card.innerHTML = `
            <div class="relative mb-5">
                <img src="${member.image}" alt="${member.name}" class="w-36 h-36 rounded-full object-cover border-4 border-white shadow-lg ring-4 ring-blue-500/10 group-hover:ring-blue-500/20 bg-slate-200 transition-all duration-200">
            </div>
            <h4 class="text-xl font-black text-slate-900 tracking-tight">${member.name}</h4>
            <span class="inline-block bg-blue-50 text-blue-700 text-sm font-bold px-4 py-1.5 rounded-full mt-3 uppercase tracking-wider shadow-2xs">${member.role}</span>
        `;
        bearersGrid.appendChild(card);
    });
}

function renderAdminBearerLogs() {
    adminBearerLogsTableBody.innerHTML = "";
    let allLogs = [];

    Object.keys(firebaseOfficeBearers).forEach(year => {
        if (parseInt(year, 10) >= currentSystemYear) {
            Object.keys(firebaseOfficeBearers[year]).forEach(id => {
                allLogs.push({ id: id, year: year, ...firebaseOfficeBearers[year][id] });
            });
        }
    });

    allLogs.reverse();
    if (allLogs.length === 0) {
        adminBearerLogsTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-slate-400 italic">No recent entry logs found for ${currentSystemYear} or above.</td></tr>`;
        return;
    }

    allLogs.forEach(log => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-100 transition";
        tr.innerHTML = `
            <td class="py-2 px-4 font-bold text-slate-600">${log.year}</td>
            <td class="py-2 px-4"><img src="${log.image}" class="w-8 h-8 rounded-full object-cover border bg-slate-200"></td>
            <td class="py-2 px-4 font-semibold text-slate-900">${log.name}</td>
            <td class="py-2 px-4"><span class="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded">${log.role}</span></td>
            <td class="py-2 px-4 text-right space-x-1">
                <button data-year="${log.year}" data-id="${log.id}" class="edit-log-btn bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium px-2 py-1 rounded transition">Edit</button>
                <button data-year="${log.year}" data-id="${log.id}" class="delete-log-btn bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium px-2 py-1 rounded transition">Delete</button>
            </td>
        `;
        adminBearerLogsTableBody.appendChild(tr);
    });
}

adminBearerLogsTableBody.addEventListener('click', (e) => {
    const id = e.target.getAttribute('data-id');
    const year = e.target.getAttribute('data-year');
    if (!id || !year) return;

    if (e.target.classList.contains('delete-log-btn')) {
        if (confirm("He office bearer hi i paih duh chiang maw?")) {
            remove(ref(db, `office_bearers/${year}/${id}`)).catch(err => alert("Error: " + err.message));
        }
    } else if (e.target.classList.contains('edit-log-btn')) {
        const itemToEdit = firebaseOfficeBearers[year][id];
        if (itemToEdit) {
            editBearerIdInput.value = `${year}|${id}`;
            bearerYearFormSelect.value = year;
            document.getElementById('bearerName').value = itemToEdit.name;
            document.getElementById('bearerRole').value = itemToEdit.role;
            document.getElementById('bearerImage').required = false;
            editPhotoNote.classList.remove('hidden');
            cancelBearerEditBtn.classList.remove('hidden');
            bearerSubmitBtn.textContent = "Hruaitu Data Update Rawh";
            document.getElementById('bearerForm').scrollIntoView({ behavior: 'smooth' });
        }
    }
});

cancelBearerEditBtn.addEventListener('click', () => {
    bearerForm.reset();
    editBearerIdInput.value = "";
    document.getElementById('bearerImage').required = true;
    editPhotoNote.classList.add('hidden');
    cancelBearerEditBtn.classList.add('hidden');
    bearerSubmitBtn.textContent = "Office Bearer Submit Rawh";
    setupDynamicYearDropdowns();
});

bearerYearSelect.addEventListener('change', (e) => renderOfficeBearers(e.target.value));

// Alert Notification System Helper for Office Bearers Form
function showBearerAlert(message, type = 'success') {
    const alertBox = document.getElementById('bearerAlertBox');
    if (!alertBox) return;

    alertBox.textContent = message;
    alertBox.classList.remove('hidden', 'bg-emerald-50', 'text-emerald-800', 'border-emerald-200', 'bg-rose-50', 'text-rose-800', 'border-rose-200');

    if (type === 'success') {
        alertBox.classList.add('bg-emerald-50', 'text-emerald-800', 'border-emerald-200');
    } else {
        alertBox.classList.add('bg-rose-50', 'text-rose-800', 'border-rose-200');
    }

    // Auto dismiss after 4 seconds
    setTimeout(() => {
        alertBox.classList.add('hidden');
    }, 4000);
}

// Updated Form Handler with Success and Error catch blocks
bearerForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const year = bearerYearFormSelect.value;
    const nameInput = document.getElementById('bearerName').value.trim();
    const roleInput = document.getElementById('bearerRole').value;
    const imageFile = document.getElementById('bearerImage').files[0];
    const editToken = editBearerIdInput.value;

    const processSave = (imageUrl) => {
        const targetData = { name: nameInput, role: roleInput, image: imageUrl };
        if (editToken) {
            const [oldYear, oldId] = editToken.split('|');
            if (oldYear !== year) {
                remove(ref(db, `office_bearers/${oldYear}/${oldId}`))
                    .then(() => push(ref(db, `office_bearers/${year}`), targetData))
                    .then(() => {
                        showBearerAlert("Office Bearer data thar siamrem leh kumsawn hlawhtling takin thlak a ni ta!", "success");
                        cancelBearerEditBtn.click();
                    })
                    .catch((err) => {
                        showBearerAlert("Database update error: " + err.message, "error");
                    });
            } else {
                set(ref(db, `office_bearers/${year}/${oldId}`), targetData)
                    .then(() => {
                        showBearerAlert("Office Bearer hruaitu data siamrem tluang takin i update e.", "success");
                        cancelBearerEditBtn.click();
                    })
                    .catch((err) => {
                        showBearerAlert("Database update error: " + err.message, "error");
                    });
            }
        } else {
            push(ref(db, `office_bearers/${year}`), targetData)
                .then(() => {
                    showBearerAlert(`Kum ${year} tan Hruaitu thar tluang takin i thun lut e.`, "success");
                    bearerForm.reset();
                })
                .catch((err) => {
                    showBearerAlert("Database save error: " + err.message, "error");
                });
        }
    };

    if (imageFile) {
        const reader = new FileReader();
        reader.onloadend = function () { processSave(reader.result); };
        reader.onerror = function () { showBearerAlert("Thlalak thursawnna hian rualrem lohna a nei tlat.", "error"); };
        reader.readAsDataURL(imageFile);
    } else if (editToken) {
        const [oldYear, oldId] = editToken.split('|');
        if (firebaseOfficeBearers[oldYear] && firebaseOfficeBearers[oldYear][oldId]) {
            processSave(firebaseOfficeBearers[oldYear][oldId].image);
        } else {
            showBearerAlert("Zawn hmuh loh hruaitu data hlui a ni.", "error");
        }
    } else {
        showBearerAlert("Khawngaihin hruaitu thlalak tur file thlang rawh.", "error");
    }
});

// Admin and User Authentication Logic
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value;

    if (u === 'user' && p === 'abc@1') {
        localStorage.setItem('yma_user_role', 'user');
        initDashboard('user');
        toggleLoginDrawer(false);
    } else if (u === 'admin' && p === 'def@1') {
        localStorage.setItem('yma_user_role', 'admin');
        initDashboard('admin');
        toggleLoginDrawer(false);
    } else {
        loginError.textContent = "Invalid credentials.";
        loginError.classList.remove('hidden');
    }
});

function initDashboard(role) {
    currentRole = role;
    loginForm.reset();
    loginError.classList.add('hidden');
    openLoginBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    entryFormSection.classList.remove('hidden');
    bearersSection.classList.add('hidden');

    if (role === 'admin') {
        roleBadge.textContent = 'ADMIN CONSOLE';
        roleBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800';
        adminControls.classList.remove('hidden');
        thAction.classList.remove('hidden');
        bearerEntrySection.classList.remove('hidden');
    } else {
        roleBadge.textContent = 'USER ACCESS';
        roleBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800';
        adminControls.classList.add('hidden');
        thAction.classList.add('hidden');
        bearerEntrySection.classList.add('hidden');
    }
    processAndRenderData();
}

logoutBtn.addEventListener('click', () => {
    currentRole = null;
    localStorage.removeItem('yma_user_role');
    openLoginBtn.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    entryFormSection.classList.add('hidden');
    bearerEntrySection.classList.add('hidden');
    bearersSection.classList.remove('hidden');
    roleBadge.textContent = 'PUBLIC VIEW';
    roleBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600';
    adminControls.classList.add('hidden');
    thAction.classList.add('hidden');
    resetMemberFormState();
    processAndRenderData();
});

// Member Registry Form Actions
document.getElementById('dataEntryForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const selectedEntryYear = memberEntryYearSelect.value;
    const headOfFamilyValue = document.getElementById('headOfFamily').value.trim();
    const headContactNoValue = document.getElementById('headContactNo').value.trim();
    const chhungteValue = document.getElementById('chhungte').value.trim();
    const editMemberId = editMemberIdInput.value;
    const alphaSpaceRegex = /^[A-Za-z\s]+$/;

    if (!alphaSpaceRegex.test(headOfFamilyValue) || !alphaSpaceRegex.test(chhungteValue)) {
        alert("FIMKHUR FIMKHUR!!! Alphabet leh Space chiah hman a phal e.");
        return;
    }

    if (headContactNoValue.length !== 10) {
        alert("Head of Family contact number hi digit 10 a ni tur a ni.");
        return;
    }

    const memberRows = dynamicMembersContainer.querySelectorAll('.member-dynamic-row');
    const ymaMembersArray = [];
    let matrixValid = true;
    let phoneValid = true;

    memberRows.forEach(row => {
        const nameVal = row.querySelector('.member-name-field').value.trim();
        const dobVal = row.querySelector('.member-dob-field').value;
        const phoneVal = row.querySelector('.member-phone-field').value.trim();

        if (nameVal && !alphaSpaceRegex.test(nameVal)) {
            matrixValid = false;
        }
        if (phoneVal && phoneVal.length !== 10) {
            phoneValid = false;
        }

        if (nameVal && dobVal && phoneVal) {
            ymaMembersArray.push({ hming: nameVal, pianKum: dobVal, contactNo: phoneVal });
        }
    });

    if (!matrixValid) {
        alert("YMA Member hming ziahnaah hian Alphabet leh Space chiah hman phal a ni.");
        return;
    }
    if (!phoneValid) {
        alert("YMA Member contact number te hi digit 10 thlap chhuah luh vek tur a ni.");
        return;
    }

    if (ymaMembersArray.length === 0) {
        alert("Khawngaihin YMA Member tling pakhat tal ziak lut rawh.");
        return;
    }

    const record = {
        section: document.getElementById('section').value,
        headOfFamily: headOfFamilyValue,
        headContactNo: headContactNoValue,
        relationType: document.getElementById('relation').value,
        chhungte: chhungteValue,
        ymaMembers: ymaMembersArray,
        memberFee: document.getElementById('memberFee').value,
        endowmentFund: document.getElementById('endowmentFund').value,
        chhiatniFund: document.getElementById('chhiatniFund').value,
        tlangauHlawh: document.getElementById('tlangauHlawh').value,
        daifimMan: document.getElementById('daifimMan').value,
        timestamp: editMemberId ? (allMembersData[editMemberId]?.timestamp || Date.now()) : Date.now()
    };

    if (editMemberId) {
        const oldYear = memberYearFilter.value;
        if (oldYear !== selectedEntryYear) {
            remove(ref(db, `yma_members/${oldYear}/${editMemberId}`)).then(() => {
                push(ref(db, `yma_members/${selectedEntryYear}`), record).then(() => {
                    alert("Member data siamrem leh kumsawn a ni ta e.");
                    resetMemberFormState();
                });
            });
        } else {
            set(ref(db, `yma_members/${selectedEntryYear}/${editMemberId}`), record).then(() => {
                alert("Member data siamrem a ni ta e.");
                resetMemberFormState();
            });
        }
    } else {
        push(ref(db, `yma_members/${selectedEntryYear}`), record)
            .then(() => {
                alert(`Kum ${selectedEntryYear} tan Head of Family node tluang takin i thun lut e.`);
                resetMemberFormState();
                if (memberYearFilter.value !== selectedEntryYear) {
                    memberYearFilter.value = selectedEntryYear;
                    listenToMembersDatabase(selectedEntryYear);
                }
            })
            .catch((error) => alert("Error saving record: " + error.message));
    }
});

function resetMemberFormState() {
    document.getElementById('dataEntryForm').reset();
    editMemberIdInput.value = "";
    cancelMemberEditBtn.classList.add('hidden');
    memberSubmitBtn.textContent = "Submit Member Entry";
    memberSubmitBtn.className = "bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition duration-150 shadow-sm cursor-pointer text-sm";
    document.getElementById('memberFormTitleNode').className = "w-2.5 h-2.5 rounded-full bg-blue-600";
    resetMatrixToDefault();
    setupDynamicYearDropdowns();
}

cancelMemberEditBtn.addEventListener('click', resetMemberFormState);

function listenToMembersDatabase(year) {
    tableViewStatus.textContent = `Members te lak mek ani e... ${year}...`;
    const currentYearDbRef = ref(db, `yma_members/${year}`);
    onValue(currentYearDbRef, (snapshot) => {
        allMembersData = snapshot.val() || {};
        tableViewStatus.textContent = `(Year: ${year})`;
        processAndRenderData();
    });
}

memberYearFilter.addEventListener('change', (e) => {
    currentPage = 1;
    listenToMembersDatabase(e.target.value);
});

function processAndRenderData() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const sectionTerm = filterSection.value;

    let membersList = Object.keys(allMembersData).map(key => ({
        id: key,
        ...allMembersData[key]
    }));

    membersList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    // Locate this block inside processAndRenderData() in script.js and update it:

filteredListArray = membersList.filter(item => {
    // Check if the search term matches the Head of Family
    const matchHead = item.headOfFamily ? item.headOfFamily.toLowerCase().includes(searchTerm) : false;
    
    // Check if the search term matches any member name in the sub-array
    const matchMembers = item.ymaMembers && Array.isArray(item.ymaMembers)
        ? item.ymaMembers.some(m => m.hming && m.hming.toLowerCase().includes(searchTerm))
        : false;

    // Return true if either the Head or any Member matches, and the section matches the filter
    return (matchHead || matchMembers) && (sectionTerm === "" || item.section === sectionTerm);
});

    const totalRecords = filteredListArray.length;
    const totalPages = Math.ceil(totalRecords / recordsPerPage) || 1;
    const startIndex = (currentPage - 1) * recordsPerPage;
    const visiblePageItems = filteredListArray.slice(startIndex, startIndex + recordsPerPage);

    totalRecordsText.textContent = totalRecords;
    pageRangeText.textContent = totalRecords === 0 ? "0-0" : `${startIndex + 1}-${Math.min(startIndex + recordsPerPage, totalRecords)}`;

    renderTableRows(visiblePageItems);
    buildPaginationControls(totalPages);
}

function renderTableRows(list) {
    memberTableBody.innerHTML = "";
    if (list.length === 0) {
        memberTableBody.innerHTML = `<tr><td colspan="10" class="text-center py-8 text-slate-400 italic">No historical entries match this query index.</td></tr>`;
        return;
    }

    list.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 text-[11px] transition duration-150";

        let actionHtml = '';
        if (currentRole === 'admin') {
            actionHtml = `
                <td class="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                    <button data-id="${item.id}" class="edit-btn text-[10px] text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded transition cursor-pointer">Edit</button>
                    <button data-id="${item.id}" class="delete-btn text-[10px] text-rose-600 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded transition cursor-pointer">Delete</button>
                </td>`;
        }

        let membersInlineList = "";
        if (item.ymaMembers && Array.isArray(item.ymaMembers)) {
            membersInlineList = item.ymaMembers.map(m => {
                const innerDob = m.pianKum ? m.pianKum.split('-').reverse().join('/') : '';
                return `<div class="bg-slate-100/80 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200/50 inline-block m-0.5">${m.hming} <span class="text-slate-400 font-normal">(${innerDob})</span> <span class="text-blue-600 font-semibold">[ph: ${m.contactNo || 'N/A'}]</span></div>`;
            }).join(' ');
        }

        tr.innerHTML = `
            <td class="py-3 px-4 font-bold text-slate-900">${item.section}</td>
            <td class="py-3 px-4 font-semibold text-slate-800">${item.headOfFamily || 'N/A'} <br/><span class="text-slate-400 font-normal text-[10px]">${item.headContactNo || ''}</span></td>
            <td class="py-3 px-4 text-slate-500"><span class="text-[10px] font-bold bg-slate-200 px-1 py-0.2 rounded mr-1">${item.relationType || ''}</span>${item.chhungte || ''}</td>
            <td class="py-3 px-4 max-w-xs">${membersInlineList || '<span class="italic text-slate-400">No members listed</span>'}</td>
            <td class="py-3 px-2 text-center"><span class="px-1.5 py-0.5 font-bold rounded ${item.memberFee === 'Pe' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}">${item.memberFee || 'Pe Lo'}</span></td>
            <td class="py-3 px-2 text-center"><span class="px-1.5 py-0.5 font-bold rounded ${item.endowmentFund === 'Pe' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}">${item.endowmentFund || 'Pe Lo'}</span></td>
            <td class="py-3 px-2 text-center"><span class="px-1.5 py-0.5 font-bold rounded ${item.chhiatniFund === 'Pe' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}">${item.chhiatniFund || 'Pe Lo'}</span></td>
            <td class="py-3 px-2 text-center"><span class="px-1.5 py-0.5 font-bold rounded ${item.tlangauHlawh === 'Pe' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}">${item.tlangauHlawh || 'Pe Lo'}</span></td>
            <td class="py-3 px-2 text-center"><span class="px-1.5 py-0.5 font-bold rounded ${item.daifimMan === 'Pe' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}">${item.daifimMan || 'Pe Lo'}</span></td>
            ${actionHtml}
        `;
        memberTableBody.appendChild(tr);
    });
}

function buildPaginationControls(totalPages) {
    paginationButtonsContainer.innerHTML = "";
    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.className = i === currentPage ? "page-btn bg-blue-600 text-white font-semibold" : "page-btn border border-slate-200 bg-white text-slate-600";
        button.textContent = i;
        button.addEventListener('click', () => { currentPage = i; processAndRenderData(); });
        paginationButtonsContainer.appendChild(button);
    }
}

// Global Event Monitoring Matrix Row Click Handler
memberTableBody.addEventListener('click', (e) => {
    const targetId = e.target.getAttribute('data-id');
    if (!targetId) return;

    if (e.target.classList.contains('delete-btn')) {
        if (confirm("He Family Node leh sub-member data awm zawng zawng hi i paih hlen duh chiang maw?")) {
            remove(ref(db, `yma_members/${memberYearFilter.value}/${targetId}`));
        }
    } else if (e.target.classList.contains('edit-btn')) {
        const record = allMembersData[targetId];
        if (record) {
            editMemberIdInput.value = targetId;
            memberEntryYearSelect.value = memberYearFilter.value;
            document.getElementById('section').value = record.section || "";
            document.getElementById('headOfFamily').value = record.headOfFamily || "";
            document.getElementById('headContactNo').value = record.headContactNo || "";
            document.getElementById('relation').value = record.relationType || "S/o";
            document.getElementById('chhungte').value = record.chhungte || "";
            document.getElementById('memberFee').value = record.memberFee || "Pe Lo";
            document.getElementById('endowmentFund').value = record.endowmentFund || "Pe Lo";
            document.getElementById('chhiatniFund').value = record.chhiatniFund || "Pe Lo";
            document.getElementById('tlangauHlawh').value = record.tlangauHlawh || "Pe Lo";
            document.getElementById('daifimMan').value = record.daifimMan || "Pe Lo";

            dynamicMembersContainer.innerHTML = "";
            if (record.ymaMembers && Array.isArray(record.ymaMembers)) {
                record.ymaMembers.forEach(m => {
                    appendMatrixRow(m.hming, m.pianKum, m.contactNo || "");
                });
            } else {
                resetMatrixToDefault();
            }

            cancelMemberEditBtn.classList.remove('hidden');
            memberSubmitBtn.textContent = "Update Member Entry";
            memberSubmitBtn.className = "bg-amber-600 hover:bg-amber-700 text-white font-medium px-6 py-2 rounded-lg transition duration-150 shadow-sm cursor-pointer text-sm";
            document.getElementById('memberFormTitleNode').className = "w-2.5 h-2.5 rounded-full bg-amber-500";

            document.getElementById('entryFormSection').scrollIntoView({ behavior: 'smooth' });
        }
    }
});

// PDF Extraction Module Implementation
extractPdfBtn.addEventListener('click', () => {
    if (filteredListArray.length === 0) {
        alert("Extract tur data a awm lo.");
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

        const yearHeader = memberYearFilter.value;
        let sectionHeader = filterSection.value || "Zawng Zawng";

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(16);
        doc.text("KHUANGPUILAM YMA MEMBER DIRECTORY", 14, 15);

        doc.setFontSize(10);
        doc.setFont("Helvetica", "normal");
        doc.text(`Kum: ${yearHeader}  |  Section: ${sectionHeader}  |  Total Records: ${filteredListArray.length}`, 14, 21);

        const tableBodyData = filteredListArray.map(item => {
            let nestedMembersStr = "";
            if (item.ymaMembers && Array.isArray(item.ymaMembers)) {
                nestedMembersStr = item.ymaMembers.map(m => {
                    const cleanDob = m.pianKum ? m.pianKum.split('-').reverse().join('/') : '';
                    return `${m.hming} (${cleanDob}) [ph: ${m.contactNo || 'N/A'}]`;
                }).join('\n');
            }

            return [
                item.section || '',
                `${item.headOfFamily || ''} ${item.headContactNo ? '\n(' + item.headContactNo + ')' : ''}`,
                `(${item.relationType || ''}) ${item.chhungte || ''}`,
                nestedMembersStr,
                item.memberFee || 'Pe Lo',
                item.endowmentFund || 'Pe Lo',
                item.chhiatniFund || 'Pe Lo',
                item.tlangauHlawh || 'Pe Lo',
                item.daifimMan || 'Pe Lo'
            ];
        });

        doc.autoTable({
            startY: 25,
            head: [['Section', 'Head of Family', 'Chhungte Context', 'YMA Member Te (Pian Kum)', 'Fee', 'Endow.', 'Chhiatni', 'Tlangau', 'Daifim']],
            body: tableBodyData,
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59], fontSize: 9, fontStyle: 'bold', halign: 'left' },
            bodyStyles: { fontSize: 8, textcolor: [51, 65, 85], valign: 'top' },
            columnStyles: {
                3: { cellWidth: 75 }, // Give the sub-members collection wider layout space
                4: { halign: 'center' },
                5: { halign: 'center' },
                6: { halign: 'center' },
                7: { halign: 'center' },
                8: { halign: 'center' }
            },
            margin: { left: 14, right: 14 },
            styles: { overflow: 'linebreak', font: 'Helvetica' }
        });

        doc.save(`KPL_YMA_Members_${yearHeader}_${sectionHeader.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
        alert("PDF structural processing failed: " + err.message);
    }
});

searchInput.addEventListener('input', () => { currentPage = 1; processAndRenderData(); });
filterSection.addEventListener('change', () => { currentPage = 1; processAndRenderData(); });