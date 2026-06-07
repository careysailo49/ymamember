import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// !!! PASTE YOUR UNIQUE FIREBASE CONFIGURATION HERE !!!
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
const dbRef = ref(db, 'yma_members');

let currentRole = null; 
let allMembersData = {}; 

// Pagination State tracking configurations
let currentPage = 1;
const recordsPerPage = 10; // Changed from 15 to 10 for better mobile responsiveness
let filteredListArray = []; 

// DOM Elements Tracking
const loginPage = document.getElementById('loginPage');
const dashboardPage = document.getElementById('dashboardPage');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const roleBadge = document.getElementById('roleBadge');
const adminControls = document.getElementById('adminControls');
const thAction = document.getElementById('thAction');
const memberTableBody = document.getElementById('memberTableBody');
const searchInput = document.getElementById('searchName');
const filterSection = document.getElementById('filterSection');
const tableViewStatus = document.getElementById('tableViewStatus');
const paginationButtonsContainer = document.getElementById('paginationButtons');
const pageRangeText = document.getElementById('pageRangeText');
const totalRecordsText = document.getElementById('totalRecordsText');

// Check Session on page load (Prevents redirecting to login on refresh)
window.addEventListener('DOMContentLoaded', () => {
    const savedRole = localStorage.getItem('yma_user_role');
    if (savedRole) {
        initDashboard(savedRole);
    }
});

// Handle Logins
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value;

    if (u === 'user' && p === 'abc@1') {
        localStorage.setItem('yma_user_role', 'user');
        initDashboard('user');
    } else if (u === 'admin' && p === 'def@1') {
        localStorage.setItem('yma_user_role', 'admin');
        initDashboard('admin');
    } else {
        loginError.textContent = "Invalid credentials. Please try again.";
        loginError.classList.remove('hidden');
    }
});

function initDashboard(role) {
    currentRole = role;
    loginPage.classList.add('hidden');
    dashboardPage.classList.remove('hidden');
    loginForm.reset();
    loginError.classList.add('hidden');

    if (role === 'admin') {
        roleBadge.textContent = 'ADMIN CONSOLE';
        roleBadge.className = 'text-xs font-semibold px-2.5 py-0.5 rounded-full mt-1 inline-block bg-rose-100 text-rose-800';
        adminControls.classList.remove('hidden');
        thAction.classList.remove('hidden');
    } else {
        roleBadge.textContent = 'USER ACCESS';
        roleBadge.className = 'text-xs font-semibold px-2.5 py-0.5 rounded-full mt-1 inline-block bg-blue-100 text-blue-800';
        adminControls.classList.add('hidden');
        thAction.classList.add('hidden');
    }
    listenToDatabase();
}

// Logout routing
document.getElementById('logoutBtn').addEventListener('click', () => {
    currentRole = null;
    localStorage.removeItem('yma_user_role'); // Clear stored session
    dashboardPage.classList.add('hidden');
    loginPage.classList.remove('hidden');
});

// Handle Database Submissions with Regex Alpha-Validation
document.getElementById('dataEntryForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const hmingValue = document.getElementById('hming').value.trim();
    const chhungteValue = document.getElementById('chhungte').value.trim();

    // Regular Expression: Allows English alphabets (a-z, A-Z) and spaces only
    const alphaSpaceRegex = /^[A-Za-z\s]+$/;

    if (!alphaSpaceRegex.test(hmingValue)) {
        alert("FIMKHUR FIMKHUR!!! 'HMING' i chhu dik lo. Alphabet leh Space chiah a phal aw.");
        document.getElementById('hming').focus();
        return;
    }

    if (!alphaSpaceRegex.test(chhungteValue)) {
        alert("FIMKHUR FIMKHUR!!! 'CHHUNGTE' i chhu dik lo. Alphabet leh Space chiah a phal aw.");
        document.getElementById('chhungte').focus();
        return;
    }
    
    const record = {
        section: document.getElementById('section').value,
        hming: hmingValue,
        relationType: document.getElementById('relation').value,
        chhungte: chhungteValue,
        pianKum: document.getElementById('pianKum').value,
        memberFee: document.getElementById('memberFee').value,
        endowmentFund: document.getElementById('endowmentFund').value,
        timestamp: Date.now() // Newest entries sorted chronologically
    };

    push(dbRef, record)
        .then(() => {
            alert("Member i ziaklut dik thlap e.");
            document.getElementById('dataEntryForm').reset();
        })
        .catch((error) => alert("Member i ziaklut dik lo tlat: " + error.message));
});

function listenToDatabase() {
    onValue(dbRef, (snapshot) => {
        allMembersData = snapshot.val() || {};
        processAndRenderData();
    });
}

// Logic processing engine for mapping filters over database states
function processAndRenderData() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const sectionTerm = filterSection.value;

    let membersList = Object.keys(allMembersData).map(key => ({
        id: key,
        ...allMembersData[key]
    }));

    // Sort descending based on entry timestamp (newest creations show up first)
    membersList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    // Filter by Search Name and Section Dropdown
    filteredListArray = membersList.filter(item => {
        const matchesSearch = item.hming.toLowerCase().includes(searchTerm);
        const matchesSection = sectionTerm === "" || item.section === sectionTerm;
        return matchesSearch && matchesSection;
    });

    const totalRecords = filteredListArray.length;
    const totalPages = Math.ceil(totalRecords / recordsPerPage) || 1;

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    if (searchTerm !== "" || sectionTerm !== "") {
        tableViewStatus.textContent = `Filtering database: found ${totalRecords} matching entry/entries`;
    } else {
        tableViewStatus.textContent = "YMA Members Ziahluh Tawh Ho";
    }

    // Split page slices out (Now slices 10 records at a time)
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    const visiblePageItems = filteredListArray.slice(startIndex, endIndex);

    totalRecordsText.textContent = totalRecords;
    pageRangeText.textContent = totalRecords === 0 ? "0-0" : `${startIndex + 1}-${Math.min(endIndex, totalRecords)}`;

    renderTableRows(visiblePageItems);
    buildPaginationControls(totalPages);
}

// UI display generation engine
function renderTableRows(list) {
    memberTableBody.innerHTML = "";

    list.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 transition duration-150";
        
        const dob = item.pianKum ? new Date(item.pianKum).toLocaleDateString('en-GB') : 'N/A';

        let actionHtml = '';
        if (currentRole === 'admin') {
            actionHtml = `<td class="py-3 px-6 text-right"><button data-id="${item.id}" class="delete-btn text-xs font-medium text-rose-600 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded transition cursor-pointer">Delete</button></td>`;
        }

        tr.innerHTML = `
            <td class="py-3 px-6 font-medium text-slate-900">${item.section}</td>
            <td class="py-3 px-6">${item.hming}</td>
            <td class="py-3 px-6 text-slate-500"><span class="text-xs font-semibold bg-slate-100 px-1.5 py-0.5 rounded mr-1">${item.relationType}</span> ${item.chhungte}</td>
            <td class="py-3 px-6">${dob}</td>
            <td class="py-3 px-6"><span class="px-2 py-0.5 text-xs font-semibold rounded-full ${item.memberFee === 'Pe' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${item.memberFee}</span></td>
            <td class="py-3 px-6"><span class="px-2 py-0.5 text-xs font-semibold rounded-full ${item.endowmentFund === 'Pe' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${item.endowmentFund}</span></td>
            ${actionHtml}
        `;
        memberTableBody.appendChild(tr);
    });

    if (list.length === 0) {
        memberTableBody.innerHTML = `<tr><td colspan="${currentRole === 'admin' ? 7 : 6}" class="text-center py-8 text-slate-400">No records found</td></tr>`;
    }
}

// Engine to build pagination buttons (1, 2, 3...) based on current state parameters
function buildPaginationControls(totalPages) {
    paginationButtonsContainer.innerHTML = "";

    if (totalPages <= 1) return;

    // Previous Button
    const prevBtn = document.createElement('button');
    prevBtn.className = `page-btn border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 ${currentPage === 1 ? 'opacity-40 cursor-not-allowed' : ''}`;
    prevBtn.textContent = "Prev";
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            processAndRenderData();
        }
    });
    paginationButtonsContainer.appendChild(prevBtn);

    // Number Buttons
    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.className = "page-btn";
        
        if (i === currentPage) {
            button.className += " bg-blue-600 text-white shadow-xs font-semibold";
        } else {
            button.className += " border border-slate-200 bg-white text-slate-600 hover:bg-slate-50";
        }
        
        button.textContent = i;
        button.addEventListener('click', () => {
            currentPage = i;
            processAndRenderData();
        });
        paginationButtonsContainer.appendChild(button);
    }

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.className = `page-btn border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 ${currentPage === totalPages ? 'opacity-40 cursor-not-allowed' : ''}`;
    nextBtn.textContent = "Next";
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            processAndRenderData();
        }
    });
    paginationButtonsContainer.appendChild(nextBtn);
}

memberTableBody.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
        const targetId = e.target.getAttribute('data-id');
        if (confirm("He Member hi i paih duh chiang maw???")) {
            remove(ref(db, `yma_members/${targetId}`))
                .then(() => alert("YMA Member atangin i paih ta e!"))
                .catch(err => alert("Deletion Error: " + err.message));
        }
    }
});

function handleFilteringInput() {
    currentPage = 1; 
    processAndRenderData();
}

searchInput.addEventListener('input', handleFilteringInput);
filterSection.addEventListener('change', handleFilteringInput);

// Admin functionality: Extract Table Data to structural PDF Layout
document.getElementById('extractPdfBtn').addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text("Khuangpuilam YMA Members Te", 14, 15);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

    // Pulls all records matching active filters, regardless of what page you are viewing
    const exportRows = filteredListArray.map(item => [
        item.section,
        item.hming,
        `${item.relationType} ${item.chhungte}`,
        item.pianKum ? new Date(item.pianKum).toLocaleDateString('en-GB') : 'N/A',
        item.memberFee,
        item.endowmentFund
    ]);

    if(exportRows.length === 0){
        alert("No data available matching your current filter set to export.");
        return;
    }

    doc.autoTable({
        startY: 28,
        head: [['Section', 'Hming (Name)', 'Chhungte', 'Pian Kum (DOB)', 'Member Fee', 'Endowment Fund']],
        body: exportRows,
        theme: 'striped',
        headStyles: { fillColor: [29, 78, 216] }
    });

    doc.save(`Khuangpuilam_YMA_Report_${Date.now()}.pdf`);
});