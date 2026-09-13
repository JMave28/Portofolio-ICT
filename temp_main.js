
// ================================
//  HELPER FUNCTIONS
// ================================
function createJmlSvgUri(text) {
    if (text === void 0) text = 'JML';
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">' +
        '<defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">' +
        '<stop offset="0%" style="stop-color:#1e3a8a;stop-opacity:1" />' +
        '<stop offset="50%" style="stop-color:#2563eb;stop-opacity:1" />' +
        '<stop offset="100%" style="stop-color:#4f46e5;stop-opacity:1" />' +
        '</linearGradient></defs>' +
        '<rect width="100%" height="100%" fill="url(#grad)"/>' +
        '<circle cx="300" cy="200" r="140" fill="rgba(255,255,255,0.06)" />' +
        '<text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Inter, sans-serif" font-weight="900" font-size="80" fill="#ffffff" letter-spacing="6">' + text +
        '</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

window.createJmlSvgUri = createJmlSvgUri;

window.handleImageError = function (img, text) {
    if (!img) return;
    if (text === void 0 || !text) text = 'JML';
    img.onerror = null;
    img.src = createJmlSvgUri(text);
};

function handleImageError(img, text) {
    window.handleImageError(img, text);
}

function showToast(title, message) {
    var toast = document.getElementById('toastNotification');
    document.getElementById('toastTitle').textContent = title;
    document.getElementById('toastMessage').textContent = message;
    toast.classList.remove('translate-y-20', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
    setTimeout(function () {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3500);
}

// Kompresi gambar client-side (mencegah limit 1MB Firestore & kuota localStorage)
function compressImage(file, maxWidth, maxHeight, quality, callback) {
    if (!file || !file.type || !file.type.startsWith('image/')) {
        callback("");
        return;
    }
    if (file.type === 'image/svg+xml') {
        var readerSvg = new FileReader();
        readerSvg.onload = function (e) { callback(e.target.result); };
        readerSvg.readAsDataURL(file);
        return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
        var img = new Image();
        img.onload = function () {
            var w = img.width;
            var h = img.height;
            var maxW = maxWidth || 1000;
            var maxH = maxHeight || 1000;
            if (w > maxW || h > maxH) {
                if (w / h > maxW / maxH) {
                    h = Math.round((h * maxW) / w);
                    w = maxW;
                } else {
                    w = Math.round((w * maxH) / h);
                    h = maxH;
                }
            }
            var canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            var compressedDataUrl = canvas.toDataURL('image/jpeg', quality || 0.78);
            callback(compressedDataUrl);
        };
        img.onerror = function () {
            callback(e.target.result);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ================================
//  EDITOR TOOLBAR
// ================================
function buildEditorToolbars() {
    document.querySelectorAll('.editor-toolbar').forEach(function (toolbar) {
        var editorId = toolbar.dataset.editor;
        if (!editorId) return;
        var editor = document.getElementById(editorId + '_editor');
        if (!editor) return;

        toolbar.innerHTML = `
                <button data-cmd="bold" title="Bold"><b>B</b></button>
                <button data-cmd="italic" title="Italic"><i>I</i></button>
                <button data-cmd="underline" title="Underline"><u>U</u></button>
            `;

        toolbar.querySelectorAll('button').forEach(function (btn) {
            btn.addEventListener('mousedown', function (e) {
                e.preventDefault();
                var cmd = this.dataset.cmd;
                if (cmd === 'bold' || cmd === 'italic' || cmd === 'underline') {
                    document.execCommand(cmd, false, null);
                }
                editor.focus();
            });
        });
    });
}

// ================================
//  FIREBASE CONFIG & INITIALIZATION
// ================================
const firebaseConfig = {
    apiKey: "AIzaSyATiXsxLRS4gcFCCPAm9V4wOiM2SuexvZk",
    authDomain: "portfoliojmave28.firebaseapp.com",
    projectId: "portfoliojmave28",
    storageBucket: "portfoliojmave28.firebasestorage.app",
    messagingSenderId: "474949467582",
    appId: "1:474949467582:web:b4cf0e8dbcda71fdf14def"
};

var db = null;
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
} catch (err) {
    console.error("Firebase init error:", err);
}

// ================================
//  DATA & STATE (DEFAULT FALLBACKS)
// ================================
var DEFAULT_SECTIONS_CONFIG = {
    hero: {
        badge: "Tugas ICT JMAVE",
        mainTitle: "PORTOFOLIO",
        name: "Jason Maverick Liauw",
        subtitle: "Halo! Saya Jason Maverick Liauw, seorang pelajar di Mutiara Bangsa 2. Ini adalah portofolio saya, tempat saya menampilkan berbagai proyek, karya, dan pengalaman yang telah saya buat."
    },
    about: {
        title: "Tentang Saya",
        subtitle: "Mengenal Lebih Dekat",
        cards: [
            {
                id: 1, icon: "fa-solid fa-user-graduate", sub: "Siapa saya?",
                content: "Saya adalah seorang siswa SMP kelas 9 yang bersekolah di SMP Mutiara Bangsa 2. Saya senang mempelajari berbagai hal baru dan terus mengembangkan kemampuan saya."
            },
            {
                id: 2, icon: "fa-solid fa-basketball", sub: "Hobi",
                content: "Hobi saya adalah bermain Badminton dan Basket. Biasanya saya akan melakukan hobi saya ini saat saya ada waktu luang ataupun saat saya sedang pusing mengerjakan tugas sekolah."
            }
        ]
    },
    projects: {
        title: "Karya & Prestasi",
        subtitle: "Proyek Unggulan",
        desc: "Jelajahi berbagai proyek dan prestasi yang telah saya buat dan dapatkan"
    },
    contact: {
        title: "Mari Hubungi Saya",
        subtitle: "Apakah Anda memiliki pertanyaan atau ingin berdiskusi lebih lanjut? Silakan hubungi saya melalui email atau media sosial di bawah ini."
    },
    footer: {
        copy: "© 2026 Jason Maverick Liauw — SMP Mutiara Bangsa 2."
    }
};

var DEFAULT_CATEGORIES = [
    { id: 1, key: 'prestasi', label: 'Prestasi' },
    { id: 2, key: 'karya', label: 'Karya' }
];

var DEFAULT_PROJECTS = [{
    id: 1,
    title: "Juara 1 Lomba ICT & Desain Web",
    category: 'prestasi',
    categoryLabel: "Prestasi",
    status: "Penghargaan",
    imageSrc: "",
    youtubeUrl: "",
    icon: "fa-solid fa-trophy",
    description: "Meraih Juara 1 dalam kompetisi teknologi informasi dan komunikasi (ICT) antar siswa.",
    impact: "Penghargaan atas inovasi desain UI/UX dan struktur kode landing page yang responsif.",
    features: ["Desain UI/UX modern", "Dukungan mode terang/gelap", "Performa tinggi"],
    stack: ["HTML5", "Tailwind CSS", "JavaScript"],
    live: "https://example.com"
}, {
    id: 2,
    title: "Website Portofolio Interaktif",
    category: 'karya',
    categoryLabel: "Karya",
    status: "Selesai",
    imageSrc: "",
    youtubeUrl: "",
    icon: "fa-solid fa-paintbrush",
    description: "Pengembangan website portofolio pribadi modern berbasis HTML, Tailwind CSS, dan JavaScript interaktif.",
    impact: "Wadah menampilkan profil, hobi, proyek, serta pencapaian.",
    features: ["Sistem filter real-time", "Dark Mode switcher", "Modal detail interaktif"],
    stack: ["HTML5", "Tailwind CSS", "JavaScript"],
    live: "https://example.com"
}];

var DEFAULT_TECH_STACK = {
    visible: true,
    title: "Tech Stack & Skills",
    subtitle: "Berikut beberapa teknologi dan keterampilan yang sedang saya tekuni untuk mengembangkan kemampuan di bidang digital.",
    badges: [
        { id: 1, name: "HTML5", icon: "fab fa-html5", color: "text-orange-600 dark:text-orange-400", label: "" },
        { id: 2, name: "CSS3", icon: "fab fa-css3-alt", color: "text-blue-600 dark:text-blue-400", label: "" },
        { id: 3, name: "JavaScript", icon: "fab fa-js", color: "text-yellow-500 dark:text-yellow-400", label: "" },
        { id: 4, name: "AI Prompting", icon: "fa-solid fa-robot", color: "text-purple-600 dark:text-purple-400", label: "" },
        { id: 5, name: "GitHub", icon: "fab fa-github", color: "text-slate-800 dark:text-slate-300", label: "" },
        { id: 6, name: "Firebase", icon: "fa-solid fa-fire", color: "text-amber-500 dark:text-amber-400", label: "Aktif" }
    ]
};

var sectionsConfig = JSON.parse(JSON.stringify(DEFAULT_SECTIONS_CONFIG));
var categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
var projectsData = JSON.parse(JSON.stringify(DEFAULT_PROJECTS));
var customSections = [];
var techStackData = JSON.parse(JSON.stringify(DEFAULT_TECH_STACK));
var adminAuth = { user: 'admin', pass: 'admin123' };
var savedProfileImage = "";
var contactEmail = "";
var contactTiktok = "";

var activeFilter = 'all';
var searchQuery = '';
var currentCardImageData = "";

// ================================
//  FIRESTORE HELPER & SYNC
// ================================
function updateFirebaseStatus(status, msg) {
    var indicator = document.getElementById('firebaseStatusIndicator');
    var banner = document.getElementById('firebaseRulesBanner');
    if (indicator) {
        if (status === 'connected') {
            indicator.className = 'text-[10px] text-emerald-600 dark:text-emerald-400 font-mono';
            indicator.textContent = '● Firebase Terhubung';
        } else if (status === 'error') {
            indicator.className = 'text-[10px] text-rose-600 dark:text-rose-400 font-mono';
            indicator.textContent = '● Firebase: Rules Terkunci';
        } else if (status === 'syncing') {
            indicator.className = 'text-[10px] text-blue-600 dark:text-blue-400 font-mono';
            indicator.textContent = '● Firebase Menyinkronkan...';
        }
    }
    if (banner) {
        if (status === 'error') {
            banner.classList.remove('hidden');
        } else if (status === 'connected') {
            banner.classList.add('hidden');
        }
    }
}

function handleFsError(err, context) {
    console.error("Firestore Error [" + context + "]:", err);
    if (err && err.code === 'permission-denied') {
        updateFirebaseStatus('error');
        showToast("Akses Ditolak (Rules)", "Security Rules Firestore menolak akses. Buka Firebase Console > Rules, ubah ke allow read, write: if true;");
    } else {
        showToast("Gagal Menyimpan", "Gagal menyimpan ke Firestore: " + (err.message || err));
    }
}

function fsSave(docName, data, successTitle, successMsg) {
    // 1. Simpan langsung ke localStorage (fail-safe instan agar data tidak hilang saat refresh/offline)
    try {
        if (docName === 'sections_config') {
            localStorage.setItem('jml_sections_config', JSON.stringify(data));
        } else if (docName === 'categories') {
            localStorage.setItem('jml_categories', JSON.stringify(data.list || data));
        } else if (docName === 'projects') {
            localStorage.setItem('jml_projects', JSON.stringify(data.list || data));
        } else if (docName === 'custom_sections') {
            localStorage.setItem('jml_custom_sections', JSON.stringify(data.list || data));
        } else if (docName === 'tech_stack') {
            localStorage.setItem('jml_tech_stack', JSON.stringify(data));
        } else if (docName === 'admin_auth') {
            localStorage.setItem('jml_admin_auth', JSON.stringify(data));
        } else if (docName === 'profile_image') {
            localStorage.setItem('jml_profile_image', data.image || "");
        } else if (docName === 'contact') {
            localStorage.setItem('jml_contact_email', data.email || "");
            localStorage.setItem('jml_contact_tiktok', data.tiktok || "");
        }
    } catch (localErr) {
        console.warn("Gagal menyimpan ke localStorage:", localErr);
    }

    // 2. Simpan ke Firebase Firestore
    if (!db) {
        console.warn("Firestore belum diinisialisasi.");
        if (successTitle) showToast(successTitle, (successMsg || "Disimpan secara lokal") + " (Mode lokal)");
        return;
    }
    try {
        var cleanData = JSON.parse(JSON.stringify(data));
        db.collection('portfolio').doc(docName).set(cleanData)
            .then(function () {
                updateFirebaseStatus('connected');
                if (successTitle) showToast(successTitle, successMsg || "Perubahan tersimpan di Firebase & browser.");
            })
            .catch(function (err) {
                handleFsError(err, docName);
            });
    } catch (e) {
        console.error("Error serializing data for Firestore:", e);
    }
}

function applyDataToUI() {
    if (document.getElementById('heroBadgeDisplay') && sectionsConfig.hero)
        document.getElementById('heroBadgeDisplay').innerHTML = sectionsConfig.hero.badge || '';
    if (document.getElementById('heroMainTitleDisplay') && sectionsConfig.hero)
        document.getElementById('heroMainTitleDisplay').innerHTML = sectionsConfig.hero.mainTitle || '';
    if (document.getElementById('heroNameDisplay') && sectionsConfig.hero)
        document.getElementById('heroNameDisplay').innerHTML = sectionsConfig.hero.name || '';
    if (document.getElementById('heroSubtextDisplay') && sectionsConfig.hero)
        document.getElementById('heroSubtextDisplay').innerHTML = sectionsConfig.hero.subtitle || '';

    var heroImgDisplay = document.getElementById('heroImageDisplay');
    if (heroImgDisplay) {
        heroImgDisplay.src = savedProfileImage || createJmlSvgUri('JML');
    }

    if (document.getElementById('aboutSectionTitleDisplay') && sectionsConfig.about)
        document.getElementById('aboutSectionTitleDisplay').innerHTML = sectionsConfig.about.title || '';
    if (document.getElementById('aboutSectionSubtitleDisplay') && sectionsConfig.about)
        document.getElementById('aboutSectionSubtitleDisplay').innerHTML = sectionsConfig.about.subtitle || '';

    if (document.getElementById('projectsSectionTitleDisplay') && sectionsConfig.projects)
        document.getElementById('projectsSectionTitleDisplay').innerHTML = sectionsConfig.projects.title || '';
    if (document.getElementById('projectsSectionSubtitleDisplay') && sectionsConfig.projects)
        document.getElementById('projectsSectionSubtitleDisplay').innerHTML = sectionsConfig.projects.subtitle || '';
    if (document.getElementById('projectsSectionDescDisplay') && sectionsConfig.projects)
        document.getElementById('projectsSectionDescDisplay').innerHTML = sectionsConfig.projects.desc || '';

    if (document.getElementById('contactTitleDisplay') && sectionsConfig.contact)
        document.getElementById('contactTitleDisplay').innerHTML = sectionsConfig.contact.title || '';
    if (document.getElementById('contactSubtitleDisplay') && sectionsConfig.contact)
        document.getElementById('contactSubtitleDisplay').innerHTML = sectionsConfig.contact.subtitle || '';
    if (document.getElementById('footerCopyText') && sectionsConfig.footer)
        document.getElementById('footerCopyText').innerHTML = sectionsConfig.footer.copy || '';

    if (contactEmail) {
        var emailText = document.getElementById('emailTextDisplay');
        if (emailText) emailText.innerHTML = contactEmail;
        var mailLink = document.getElementById('mailLinkBtn');
        if (mailLink) mailLink.href = 'mailto:' + contactEmail;
    }
    if (contactTiktok) {
        var ttUser = document.getElementById('footerTiktokUser');
        if (ttUser) ttUser.innerHTML = '@' + contactTiktok;
        var ttFootLink = document.getElementById('footerTiktokLink');
        if (ttFootLink) ttFootLink.href = 'https://www.tiktok.com/@' + contactTiktok;
        var ttBtn = document.getElementById('tiktokLinkBtn');
        if (ttBtn) ttBtn.href = 'https://www.tiktok.com/@' + contactTiktok;
    }

    renderFilterButtons();
    renderAboutCards();
    renderTechStack();
    renderProjects();
    renderCustomSections();

    var adminModal = document.getElementById('adminPanelModal');
    if (adminModal && !adminModal.classList.contains('hidden')) {
        renderCategoryList();
        renderAdminProjectsList();
        renderAdminCustomSections();
        renderTechBadgeList();
        renderAdminAboutCards();
        updateTechVisibilityUI();
    }
}

// ================================
//  LOCAL STORAGE & FIRESTORE SYNC
// ================================
function saveAllToLocalStorage() {
    try {
        localStorage.setItem('jml_sections_config', JSON.stringify(sectionsConfig));
        localStorage.setItem('jml_categories', JSON.stringify(categories));
        localStorage.setItem('jml_projects', JSON.stringify(projectsData));
        localStorage.setItem('jml_custom_sections', JSON.stringify(customSections));
        localStorage.setItem('jml_tech_stack', JSON.stringify(techStackData));
        localStorage.setItem('jml_admin_auth', JSON.stringify(adminAuth));
        localStorage.setItem('jml_profile_image', savedProfileImage || "");
        localStorage.setItem('jml_contact_email', contactEmail || "");
        localStorage.setItem('jml_contact_tiktok', contactTiktok || "");
    } catch (e) {
        console.warn("localStorage quota/error:", e);
    }
}

function loadAllFromLocalStorage() {
    try {
        var s = localStorage.getItem('jml_sections_config');
        if (s) {
            var parsedS = JSON.parse(s);
            sectionsConfig = Object.assign({}, DEFAULT_SECTIONS_CONFIG, parsedS);
            if (!sectionsConfig.hero) sectionsConfig.hero = DEFAULT_SECTIONS_CONFIG.hero;
            if (!sectionsConfig.about) sectionsConfig.about = DEFAULT_SECTIONS_CONFIG.about;
            if (!sectionsConfig.projects) sectionsConfig.projects = DEFAULT_SECTIONS_CONFIG.projects;
            if (!sectionsConfig.contact) sectionsConfig.contact = DEFAULT_SECTIONS_CONFIG.contact;
            if (!sectionsConfig.footer) sectionsConfig.footer = DEFAULT_SECTIONS_CONFIG.footer;
        }
        var c = localStorage.getItem('jml_categories');
        if (c) categories = JSON.parse(c);
        var p = localStorage.getItem('jml_projects');
        if (p) projectsData = JSON.parse(p);
        var cs = localStorage.getItem('jml_custom_sections');
        if (cs) customSections = JSON.parse(cs);
        var t = localStorage.getItem('jml_tech_stack');
        if (t) {
            techStackData = Object.assign({}, DEFAULT_TECH_STACK, JSON.parse(t));
            if (!techStackData.badges) techStackData.badges = DEFAULT_TECH_STACK.badges;
        }
        var a = localStorage.getItem('jml_admin_auth');
        if (a) adminAuth = JSON.parse(a);
        var pi = localStorage.getItem('jml_profile_image');
        if (pi !== null) savedProfileImage = pi;
        var em = localStorage.getItem('jml_contact_email');
        if (em !== null) contactEmail = em;
        var tt = localStorage.getItem('jml_contact_tiktok');
        if (tt !== null) contactTiktok = tt;
    } catch (e) {
        console.warn("Gagal membaca dari localStorage:", e);
    }
}

function pushStateToFirestore(isManual) {
    if (!db) {
        if (isManual) showToast("Error", "Firebase belum terinisialisasi. Cek koneksi internet.");
        return;
    }
    try {
        updateFirebaseStatus('syncing');
        var syncBtn = document.getElementById('sidebarSyncBtn');
        if (syncBtn) {
            syncBtn.disabled = true;
            syncBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Menyinkronkan...</span>';
        }

        // Simpan snapshot memori saat ini ke localStorage
        saveAllToLocalStorage();

        var batch = db.batch();
        batch.set(db.collection('portfolio').doc('sections_config'), JSON.parse(JSON.stringify(sectionsConfig)));
        batch.set(db.collection('portfolio').doc('categories'), { list: JSON.parse(JSON.stringify(categories)) });
        batch.set(db.collection('portfolio').doc('projects'), { list: JSON.parse(JSON.stringify(projectsData)) });
        batch.set(db.collection('portfolio').doc('custom_sections'), { list: JSON.parse(JSON.stringify(customSections)) });
        batch.set(db.collection('portfolio').doc('tech_stack'), JSON.parse(JSON.stringify(techStackData)));
        batch.set(db.collection('portfolio').doc('admin_auth'), JSON.parse(JSON.stringify(adminAuth)));
        batch.set(db.collection('portfolio').doc('profile_image'), { image: savedProfileImage || "" });
        batch.set(db.collection('portfolio').doc('contact'), { email: contactEmail || "", tiktok: contactTiktok || "" });

        batch.commit().then(function () {
            console.log("Firestore berhasil disinkronkan dengan seluruh data portofolio terbaru.");
            updateFirebaseStatus('connected');
            if (syncBtn) {
                syncBtn.disabled = false;
                syncBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> <span>Sync ke Firebase</span>';
            }
            if (isManual) {
                showToast("Berhasil Disinkronkan", "Seluruh data portofolio terbaru berhasil tersimpan di Firebase Firestore!");
            }
        }).catch(function (err) {
            console.error("Gagal sinkronisasi data ke Firestore:", err);
            if (syncBtn) {
                syncBtn.disabled = false;
                syncBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> <span>Sync ke Firebase</span>';
            }
            handleFsError(err, "syncToFirestore");
        });
    } catch (e) {
        console.error("Error serializing data for Firestore:", e);
        var syncBtnErr = document.getElementById('sidebarSyncBtn');
        if (syncBtnErr) {
            syncBtnErr.disabled = false;
            syncBtnErr.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> <span>Sync ke Firebase</span>';
        }
        showToast("Error", "Gagal memproses data: " + e.message);
    }
}

function manualSyncToFirestore() {
    showToast("Menyinkronkan...", "Menyimpan data terkini ke Firebase Firestore...");
    pushStateToFirestore(true);
}

function initFirestoreSync() {
    if (!db) {
        updateFirebaseStatus('error', 'Firebase belum siap');
        return;
    }

    updateFirebaseStatus('syncing');

    db.collection('portfolio').onSnapshot(function (snapshot) {
        updateFirebaseStatus('connected');

        if (snapshot.empty) {
            console.log("Koleksi Firestore masih kosong. Melakukan auto-seed dengan data terkini...");
            pushStateToFirestore(false);
            return;
        }

        snapshot.forEach(function (doc) {
            var d = doc.data();
            if (doc.id === 'sections_config') {
                sectionsConfig = Object.assign({}, DEFAULT_SECTIONS_CONFIG, d);
                if (!sectionsConfig.hero) sectionsConfig.hero = DEFAULT_SECTIONS_CONFIG.hero;
                if (!sectionsConfig.about) sectionsConfig.about = DEFAULT_SECTIONS_CONFIG.about;
                if (!sectionsConfig.projects) sectionsConfig.projects = DEFAULT_SECTIONS_CONFIG.projects;
                if (!sectionsConfig.contact) sectionsConfig.contact = DEFAULT_SECTIONS_CONFIG.contact;
                if (!sectionsConfig.footer) sectionsConfig.footer = DEFAULT_SECTIONS_CONFIG.footer;
            } else if (doc.id === 'categories') {
                categories = d.list || [];
            } else if (doc.id === 'projects') {
                projectsData = d.list || [];
            } else if (doc.id === 'custom_sections') {
                customSections = d.list || [];
            } else if (doc.id === 'tech_stack') {
                techStackData = Object.assign({}, DEFAULT_TECH_STACK, d);
                if (!techStackData.badges) techStackData.badges = DEFAULT_TECH_STACK.badges;
            } else if (doc.id === 'admin_auth') {
                adminAuth = d && d.user ? d : { user: 'admin', pass: 'admin123' };
            } else if (doc.id === 'profile_image') {
                savedProfileImage = d.image || "";
            } else if (doc.id === 'contact') {
                contactEmail = d.email || "";
                contactTiktok = d.tiktok || "";
            }
        });

        // Perbarui cache localStorage agar offline selalu sinkron
        saveAllToLocalStorage();

        applyDataToUI();
    }, function (error) {
        console.error("Firestore onSnapshot error:", error);
        if (error && error.code === 'permission-denied') {
            updateFirebaseStatus('error');
            showToast("Firestore Rules Terkunci", "Akses Firestore ditolak. Buka tab Rules di Firebase Console.");
        }
    });
}

// ================================
//  EXPORT / IMPORT & GITHUB HELPER
// ================================
function triggerFileDownload(content, filename, mimeType) {
    var blob = new Blob([content], { type: mimeType || 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
}

function embedDataIntoHtml(htmlText) {
    var out = htmlText;

    out = out.replace(/var\s+DEFAULT_SECTIONS_CONFIG\s*=\s*\{[\s\S]*?\n\s*\};/, function () {
        return 'var DEFAULT_SECTIONS_CONFIG = ' + JSON.stringify(sectionsConfig, null, 4) + ';';
    });

    out = out.replace(/var\s+DEFAULT_CATEGORIES\s*=\s*\[[\s\S]*?\n\s*\];/, function () {
        return 'var DEFAULT_CATEGORIES = ' + JSON.stringify(categories, null, 4) + ';';
    });

    out = out.replace(/var\s+DEFAULT_PROJECTS\s*=\s*\[[\s\S]*?\n\s*\];/, function () {
        return 'var DEFAULT_PROJECTS = ' + JSON.stringify(projectsData, null, 4) + ';';
    });

    out = out.replace(/var\s+DEFAULT_TECH_STACK\s*=\s*\{[\s\S]*?\n\s*\};/, function () {
        return 'var DEFAULT_TECH_STACK = ' + JSON.stringify(techStackData, null, 4) + ';';
    });

    out = out.replace(/var\s+customSections\s*=\s*\[[\s\S]*?\];/, function () {
        return 'var customSections = ' + JSON.stringify(customSections, null, 4) + ';';
    });

    out = out.replace(/var\s+savedProfileImage\s*=\s*".*?";/, function () {
        return 'var savedProfileImage = ' + JSON.stringify(savedProfileImage || "") + ';';
    });

    out = out.replace(/var\s+contactEmail\s*=\s*".*?";/, function () {
        return 'var contactEmail = ' + JSON.stringify(contactEmail || "") + ';';
    });

    out = out.replace(/var\s+contactTiktok\s*=\s*".*?";/, function () {
        return 'var contactTiktok = ' + JSON.stringify(contactTiktok || "") + ';';
    });

    return out;
}

function downloadUpdatedHtmlForGithub() {
    showToast("Menyiapkan File...", "Mempersiapkan index.html dengan data terbaru...");
    fetch(window.location.href)
        .then(function (res) {
            if (!res.ok) throw new Error("HTTP error " + res.status);
            return res.text();
        })
        .then(function (htmlText) {
            var updated = embedDataIntoHtml(htmlText);
            triggerFileDownload(updated, 'index.html', 'text/html');
            showToast("Berhasil Didownload", "File index.html terbaru telah diunduh! Silakan ganti index.html di repo dan commit ke GitHub.");
        })
        .catch(function (err) {
            console.warn("Fetch failed, fallback to document source:", err);
            var docHtml = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
            var updatedFallback = embedDataIntoHtml(docHtml);
            triggerFileDownload(updatedFallback, 'index.html', 'text/html');
            showToast("File Didownload", "File index.html telah diunduh! Silakan upload ke GitHub repo Anda.");
        });
}

function exportDataBackupJson() {
    var backup = {
        exportedAt: new Date().toISOString(),
        sectionsConfig: sectionsConfig,
        categories: categories,
        projectsData: projectsData,
        customSections: customSections,
        techStackData: techStackData,
        savedProfileImage: savedProfileImage,
        contactEmail: contactEmail,
        contactTiktok: contactTiktok,
        adminAuth: adminAuth
    };
    triggerFileDownload(JSON.stringify(backup, null, 2), 'portfolio-jml-backup.json', 'application/json');
    showToast("Backup Berhasil", "File portfolio-jml-backup.json telah diunduh.");
}

function importDataBackupJson(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (evt) {
        try {
            var data = JSON.parse(evt.target.result);
            if (data.sectionsConfig) sectionsConfig = data.sectionsConfig;
            if (data.categories) categories = data.categories;
            if (data.projectsData) projectsData = data.projectsData;
            if (data.customSections) customSections = data.customSections;
            if (data.techStackData) techStackData = data.techStackData;
            if (data.savedProfileImage !== undefined) savedProfileImage = data.savedProfileImage;
            if (data.contactEmail !== undefined) contactEmail = data.contactEmail;
            if (data.contactTiktok !== undefined) contactTiktok = data.contactTiktok;
            if (data.adminAuth) adminAuth = data.adminAuth;

            saveAllToLocalStorage();
            applyDataToUI();
            manualSyncToFirestore();
            showToast("Restore Berhasil", "Data berhasil di-restore dan langsung disinkronkan ke Firebase!");
        } catch (err) {
            showToast("Error", "Gagal membaca file JSON backup: " + err.message);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

// ================================
//  NAVBAR SCROLL — ENHANCED
//  fitur: geser ngikutin kursor (drag) + keyboard arrow
// ================================
function initNavbarMouseScroll() {
    var nav = document.getElementById('desktopNav');
    if (!nav) return;

    // fokus untuk keyboard
    nav.setAttribute('tabindex', '0');
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'Navigasi utama — gunakan panah kiri/kanan untuk geser');

    var isDragging = false;
    var startX = 0;
    var scrollLeftStart = 0;
    var isHovering = false;
    var lastMouseX = 0;
    var hasDragged = false;
    var dragThreshold = 4;

    // ---------- CLICK & DRAG (geser ngikutin kursor) ----------
    nav.addEventListener('mousedown', function (e) {
        if (e.button !== 0) return;
        if (nav.scrollWidth <= nav.clientWidth) return;
        isDragging = true;
        hasDragged = false;
        startX = e.clientX;
        scrollLeftStart = nav.scrollLeft;
        nav.classList.add('dragging');
        nav.classList.remove('grab', 'default-cursor');
        nav.style.cursor = 'grabbing';
        nav.style.userSelect = 'none';
        // nonaktifkan smooth saat drag
        nav.style.scrollBehavior = 'auto';
        e.preventDefault();
    });

    document.addEventListener('mousemove', function (e) {
        if (!isDragging) return;
        var delta = e.clientX - startX;
        if (Math.abs(delta) > dragThreshold) {
            hasDragged = true;
        }
        nav.scrollLeft = scrollLeftStart - delta;
        e.preventDefault();
    });

    document.addEventListener('mouseup', function (e) {
        if (isDragging) {
            isDragging = false;
            nav.classList.remove('dragging');
            nav.style.userSelect = '';
            // kembalikan cursor
            if (isHovering && nav.scrollWidth > nav.clientWidth) {
                nav.classList.add('grab');
                nav.style.cursor = 'grab';
            } else {
                nav.classList.add('default-cursor');
                nav.style.cursor = 'default';
            }
            // kembalikan smooth behavior (tapi tetap smooth untuk keyboard)
            nav.style.scrollBehavior = '';
            // jika tidak ada pergerakan berarti klik biasa — biarkan link berfungsi
            if (!hasDragged) {
                // click akan ditangani oleh browser
            }
        }
    });

    // ---------- KEYBOARD ARROWS ----------
    nav.addEventListener('keydown', function (e) {
        if (nav.scrollWidth <= nav.clientWidth) return;
        var amount = 140;
        var handled = false;

        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            nav.scrollBy({ left: -amount, behavior: 'smooth' });
            handled = true;
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            nav.scrollBy({ left: amount, behavior: 'smooth' });
            handled = true;
        } else if (e.key === 'Home') {
            e.preventDefault();
            nav.scrollTo({ left: 0, behavior: 'smooth' });
            handled = true;
        } else if (e.key === 'End') {
            e.preventDefault();
            nav.scrollTo({ left: nav.scrollWidth, behavior: 'smooth' });
            handled = true;
        }

        if (handled) {
            // update fade indicator
            updateNavFade(nav);
        }
    });

    // ---------- HOVER-BASED SCROLL (tetap, sebagai pelengkap) ----------
    nav.addEventListener('mouseenter', function () {
        isHovering = true;
        lastMouseX = 0;
        if (!isDragging && nav.scrollWidth > nav.clientWidth) {
            nav.classList.add('grab');
            nav.style.cursor = 'grab';
        } else {
            nav.classList.add('default-cursor');
            nav.style.cursor = 'default';
        }
    });

    nav.addEventListener('mouseleave', function () {
        isHovering = false;
        if (!isDragging) {
            nav.classList.remove('grab');
            nav.classList.add('default-cursor');
            nav.style.cursor = 'default';
        }
        lastMouseX = 0;
    });

    nav.addEventListener('mousemove', function (e) {
        if (!isHovering || isDragging) return;
        if (nav.scrollWidth <= nav.clientWidth) {
            nav.classList.remove('grab');
            nav.classList.add('default-cursor');
            nav.style.cursor = 'default';
            return;
        }
        if (lastMouseX === 0) {
            lastMouseX = e.clientX;
            return;
        }
        var delta = e.clientX - lastMouseX;
        if (Math.abs(delta) > 2) {
            nav.scrollBy({ left: delta * 0.5, behavior: 'auto' });
            // update fade
            updateNavFade(nav);
        }
        lastMouseX = e.clientX;
    });

    // ---------- SCROLL WHEEL (opsional, nyaman) ----------
    nav.addEventListener('wheel', function (e) {
        if (nav.scrollWidth <= nav.clientWidth) return;
        e.preventDefault();
        nav.scrollBy({ left: e.deltaY * 1.2, behavior: 'auto' });
        updateNavFade(nav);
    }, { passive: false });

    // ---------- UPDATE FADE INDICATOR ----------
    function updateNavFade(el) {
        var canScrollLeft = el.scrollLeft > 0;
        var canScrollRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 1;
        if (canScrollLeft || canScrollRight) {
            el.classList.add('show-fade');
            // hanya tampilkan di sisi yang bisa scroll
            if (canScrollLeft) {
                el.style.setProperty('--fade-left', '1');
            } else {
                el.style.setProperty('--fade-left', '0');
            }
            if (canScrollRight) {
                el.style.setProperty('--fade-right', '1');
            } else {
                el.style.setProperty('--fade-right', '0');
            }
        } else {
            el.classList.remove('show-fade');
        }
    }

    // pasang scroll event untuk update fade
    nav.addEventListener('scroll', function () {
        updateNavFade(this);
    });

    // update awal
    setTimeout(function () {
        updateNavFade(nav);
    }, 100);

    // update saat resize
    var resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            updateNavFade(nav);
        }, 150);
    });

    // juga update saat konten navbar berubah (mutation observer)
    var observer = new MutationObserver(function () {
        updateNavFade(nav);
    });
    observer.observe(nav, { childList: true, subtree: true, characterData: true });
}

// ================================
//  RENDER FUNCTIONS
// ================================

function renderAboutCards() {
    var container = document.getElementById('aboutCardsContainer');
    if (!container) return;
    var cards = sectionsConfig.about.cards || [];
    if (cards.length === 0) {
        container.innerHTML =
            '<p class="text-center text-slate-500 dark:text-slate-400 col-span-2">Belum ada card. Tambahkan di admin panel.</p>';
        return;
    }
    container.innerHTML = cards.map(function (card) {
        var iconHtml = card.icon ? '<div class="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm"><i class="' +
            card.icon + ' group-hover:rotate-6 transition-transform"></i></div>' : '';
        return '<div class="hover-lift hover-glow group p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-3 transition-all duration-300">' +
            iconHtml +
            '<h3 class="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">' +
            card.sub + '</h3>' +
            '<p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">' +
            card.content + '</p>' +
            '</div>';
    }).join('');
}

function renderTechStack() {
    var container = document.getElementById('techStackContainer');
    if (!container) return;
    if (!techStackData.visible || techStackData.badges.length === 0) {
        container.innerHTML = '';
        return;
    }
    var badgesHtml = techStackData.badges.map(function (badge) {
        var iconHtml = badge.icon ? '<i class="' + badge.icon + ' text-5xl ' + badge.color +
            ' group-hover:scale-110 transition-transform"></i>' : '';
        var labelHtml = badge.label ? '<span class="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold shadow-md">' +
            badge.label + '</span>' : '';
        return '<div class="group flex flex-col items-center p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 w-28 relative">' +
            iconHtml +
            '<span class="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">' + badge.name +
            '</span>' +
            labelHtml +
            '</div>';
    }).join('');
    container.innerHTML =
        '<section id="techstack" class="py-16 sm:py-24 bg-white/80 dark:bg-slate-900/80 bg-grid-pattern border-y border-slate-200 dark:border-slate-800 transition-colors">' +
        '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">' +
        '<div class="max-w-3xl mx-auto text-center space-y-4 mb-12">' +
        '<h2 class="text-xs font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase">' + (techStackData
            .title || 'Tech Stack & Skills') + '</h2>' +
        '<h3 class="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">' + (techStackData.title ||
            'Tech Stack & Skills') + '</h3>' +
        '<p class="text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">' + (techStackData.subtitle ||
            '') + '</p>' +
        '</div>' +
        '<div class="flex flex-wrap justify-center gap-6 max-w-4xl mx-auto">' +
        badgesHtml +
        '</div>' +
        '</div>' +
        '</section>';
}

function renderProjects() {
    var projectsGrid = document.getElementById('projectsGrid');
    var emptyState = document.getElementById('emptyState');
    if (!projectsGrid) return;

    document.getElementById('projectsSectionTitleDisplay').innerHTML = sectionsConfig.projects.title ||
        'Karya & Prestasi';
    document.getElementById('projectsSectionSubtitleDisplay').innerHTML = sectionsConfig.projects.subtitle ||
        'Proyek Unggulan';
    document.getElementById('projectsSectionDescDisplay').innerHTML = sectionsConfig.projects.desc ||
        'Jelajahi berbagai proyek dan prestasi yang telah saya buat dan dapatkan';

    var filteredProjects = projectsData.filter(function (project) {
        var matchesFilter = activeFilter === 'all' || project.category === activeFilter;
        var matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    if (filteredProjects.length === 0) {
        projectsGrid.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    emptyState.classList.add('hidden');

    projectsGrid.innerHTML = filteredProjects.map(function (project) {
        var imgDisplay = project.imageSrc ? project.imageSrc : createJmlSvgUri('JML');
        var iconHtml = project.icon ? '<i class="' + project.icon + '"></i>' : '';
        return '<div class="project-card group hover-glow bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2">' +
            '<div>' +
            '<div class="h-44 relative overflow-hidden group bg-slate-900">' +
            '<img src="' + imgDisplay + '" alt="' + project.title +
            '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onerror="handleImageError(this, \'JML\')">' +
            '<div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 p-4 flex flex-col justify-between">' +
            '<div class="flex items-center justify-between">' +
            '<span class="px-2.5 py-1 rounded-md text-xs font-semibold bg-white/20 backdrop-blur-md text-white border border-white/20">' +
            (project.categoryLabel || 'Proyek') + '</span>' +
            '<span class="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/80 text-white backdrop-blur-sm">' +
            (project.status || 'Selesai') + '</span>' +
            '</div>' +
            '<div class="flex items-center space-x-2 text-white">' +
            (iconHtml ? '<div class="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-sm">' +
                iconHtml + '</div>' : '') +
            (project.youtubeUrl ?
                '<span class="text-xs bg-red-600 px-2 py-0.5 rounded font-bold"><i class="fa-brands fa-youtube mr-1"></i>Video</span>' :
                '') +
            '</div>' +
            '</div>' +
            '</div>' +
            '<div class="p-5 space-y-3">' +
            '<h3 class="text-lg font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">' +
            project.title + '</h3>' +
            '<p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">' +
            project.description + '</p>' +
            '<div class="flex flex-wrap gap-1.5 pt-2">' +
            (project.stack || []).slice(0, 4).map(function (tech) {
                return '<span class="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">' +
                    tech + '</span>';
            }).join('') +
            '</div>' +
            '</div>' +
            '</div>' +
            '<div class="p-5 pt-0 flex items-center justify-between gap-2 border-t border-slate-200/60 dark:border-slate-800/60 mt-4">' +
            '<button onclick="openProjectDetailModal(' + project.id +
            ')" class="w-full py-2.5 rounded-xl bg-slate-200/60 hover:bg-blue-600 hover:text-white dark:bg-slate-800 dark:hover:bg-blue-600 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-all duration-300 flex items-center justify-center space-x-1 shadow-sm">' +
            '<span>Detail Project</span>' +
            '<i class="fa-solid fa-arrow-right text-[10px] ml-1"></i>' +
            '</button>' +
            '</div>' +
            '</div>';
    }).join('');
}

function renderCustomSections() {
    var container = document.getElementById('customSectionsContainer');
    var dynamicDesktopNav = document.getElementById('dynamicDesktopNav');
    var dynamicMobileNav = document.getElementById('dynamicMobileNav');
    if (!container) return;

    dynamicDesktopNav.innerHTML = '';
    dynamicMobileNav.innerHTML = '';

    var visibleSections = customSections.filter(function (s) { return !s.hidden; });

    if (visibleSections.length === 0) {
        container.innerHTML = '';
        return;
    }

    visibleSections.forEach(function (section) {
        var desktopItemHtml = '<a href="#section-' + section.id +
            '" class="nav-link-effect px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all shrink-0">' +
            section.title + '</a>';
        dynamicDesktopNav.insertAdjacentHTML('beforeend', desktopItemHtml);

        if (dynamicMobileNav) {
            dynamicMobileNav.insertAdjacentHTML('beforeend',
                '<a href="#section-' + section.id +
                '" class="mobile-link block px-3 py-2.5 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">' +
                section.title + '</a>'
            );
        }
    });

    container.innerHTML = visibleSections.map(function (section) {
        var cards = section.cards || [];
        var cardsHtml = cards.map(function (card) {
            var cardImg = card.imageSrc ? card.imageSrc : createJmlSvgUri('JML');
            var iconHtml = card.icon ? '<i class="' + card.icon + '"></i>' : '';
            return '<div class="project-card group hover-glow bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2">' +
                '<div>' +
                '<div class="h-44 relative overflow-hidden bg-slate-900">' +
                '<img src="' + cardImg + '" alt="' + card.title +
                '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onerror="handleImageError(this, \'JML\')">' +
                '<div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 p-4 flex flex-col justify-between">' +
                '<div class="flex items-center justify-between">' +
                '<span class="px-2.5 py-1 rounded-md text-xs font-semibold bg-white/20 backdrop-blur-md text-white border border-white/20">' +
                (card.categoryLabel || section.title) + '</span>' +
                '<span class="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/80 text-white backdrop-blur-sm">' +
                (card.status || 'Aktif') + '</span>' +
                '</div>' +
                '<div class="flex items-center space-x-2 text-white">' +
                (iconHtml ? '<div class="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-sm">' +
                    iconHtml + '</div>' : '') +
                (card.youtubeUrl ?
                    '<div class="text-xs bg-red-600 text-white px-2 py-0.5 rounded font-bold"><i class="fa-brands fa-youtube mr-1"></i>Video</div>' :
                    '') +
                '</div>' +
                '</div>' +
                '</div>' +
                '<div class="p-5 space-y-3">' +
                '<h3 class="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">' + card.title +
                '</h3>' +
                '<p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">' +
                card.description + '</p>' +
                '</div>' +
                '</div>' +
                '<div class="p-5 pt-0 flex items-center justify-between gap-2 border-t border-slate-200/60 dark:border-slate-800/60 mt-4">' +
                '<button onclick="openCustomCardModal(' + section.id + ',' + card.id +
                ')" class="w-full py-2.5 rounded-xl bg-slate-200/60 hover:bg-blue-600 hover:text-white dark:bg-slate-800 dark:hover:bg-blue-600 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-all duration-300 flex items-center justify-center space-x-1 shadow-sm">' +
                '<span>Detail Card</span>' +
                '<i class="fa-solid fa-arrow-right text-[10px] ml-1"></i>' +
                '</button>' +
                '</div>' +
                '</div>';
        }).join('');

        return '<section id="section-' + section.id +
            '" class="py-16 sm:py-24 bg-white/50 dark:bg-slate-900/50 bg-grid-pattern border-t border-slate-200 dark:border-slate-800">' +
            '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">' +
            '<div class="mb-8 flex flex-col md:flex-row md:items-end justify-between">' +
            '<div>' +
            '<h2 class="text-xs font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase">Section Custom</h2>' +
            '<p class="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-1">' + section
                .title + '</p>' +
            '</div>' +
            '<p class="text-sm text-slate-500 dark:text-slate-400 mt-2 md:mt-0 max-w-md">' + (section
                .subtitle || '') + '</p>' +
            '</div>' +
            '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">' +
            cardsHtml +
            '</div>' +
            '</div>' +
            '</section>';
    }).join('');
}

function applyFilter(filterKey) {
    activeFilter = filterKey || 'all';
    document.querySelectorAll('.filter-btn').forEach(function (b) {
        if (b.getAttribute('data-filter') === activeFilter) {
            b.classList.add('active', 'bg-blue-600', 'text-white');
            b.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
        } else {
            b.classList.remove('active', 'bg-blue-600', 'text-white');
            b.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
        }
    });
    renderProjects();
}
window.applyFilter = applyFilter;

function renderFilterButtons() {
    var allBtn = document.querySelector('button[data-filter="all"]');
    if (allBtn) {
        allBtn.onclick = function () {
            applyFilter('all');
        };
    }

    var container = document.getElementById('dynamicFilterButtons');
    if (!container) return;
    container.innerHTML = '';
    categories.forEach(function (cat) {
        var btn = document.createElement('button');
        btn.setAttribute('data-filter', cat.key);
        btn.className =
            'filter-btn px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all';
        btn.textContent = cat.label;
        btn.addEventListener('click', function () {
            applyFilter(this.getAttribute('data-filter'));
        });
        container.appendChild(btn);
    });
    document.querySelectorAll('.filter-btn').forEach(function (b) {
        if (b.getAttribute('data-filter') === activeFilter) {
            b.classList.add('active', 'bg-blue-600', 'text-white');
            b.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
        } else {
            b.classList.remove('active', 'bg-blue-600', 'text-white');
            b.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
        }
    });
}

// ================================
//  PROJECT & CARD MODALS
// ================================
window.openProjectDetailModal = function (id) {
    var project = projectsData.find(function (p) { return p.id === id; });
    if (!project) return;
    showCardInModal(project);
};

window.openCustomCardModal = function (sectionId, cardId) {
    var sec = customSections.find(function (s) { return s.id === sectionId; });
    if (!sec) return;
    var card = (sec.cards || []).find(function (c) { return c.id === cardId; });
    if (!card) return;
    showCardInModal(card);
};

function showCardInModal(data) {
    document.getElementById('modalTitle').textContent = data.title;
    document.getElementById('modalCategoryBadge').textContent = data.categoryLabel || 'Item';
    document.getElementById('modalStatusBadge').textContent = data.status || 'Selesai';
    document.getElementById('modalDescription').textContent = data.description || '';
    document.getElementById('modalImpact').textContent = data.impact || 'Informasi detail terkait karya/prestasi ini.';
    document.getElementById('modalLiveLink').href = data.live || '#';

    var mediaBox = document.getElementById('modalMediaContainer');
    if (data.youtubeUrl) {
        var videoId = "";
        if (data.youtubeUrl.includes('v=')) {
            videoId = data.youtubeUrl.split('v=')[1].split('&')[0];
        } else if (data.youtubeUrl.includes('youtu.be/')) {
            videoId = data.youtubeUrl.split('youtu.be/')[1].split('?')[0];
        }
        if (videoId) {
            mediaBox.innerHTML =
                '<iframe class="w-full h-full rounded-xl" src="https://www.youtube.com/embed/' + videoId +
                '" frameborder="0" allowfullscreen></iframe>';
            mediaBox.classList.remove('hidden');
        } else {
            mediaBox.classList.add('hidden');
        }
    } else {
        mediaBox.classList.add('hidden');
    }

    document.getElementById('modalFeatures').innerHTML = (data.features || ["Aksesibilitas baik",
        "Desain terstruktur"
    ]).map(function (f) { return '<li>' + f + '</li>'; }).join('');
    document.getElementById('modalStack').innerHTML = (data.stack || ["General"]).map(function (s) {
        return '<span class="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700">' +
            s + '</span>';
    }).join('');

    document.getElementById('projectModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('projectModal').classList.add('hidden');
}

// ================================
//  ADMIN LOGIN
// ================================
document.getElementById('adminLoginBtn').addEventListener('click', function () {
    document.getElementById('adminLoginModal').classList.remove('hidden');
});

function closeAdminLoginModal() {
    document.getElementById('adminLoginModal').classList.add('hidden');
    document.getElementById('loginErrorMsg').classList.add('hidden');
}

function handleAdminLogin(e) {
    e.preventDefault();
    var u = document.getElementById('loginUsername').value;
    var p = document.getElementById('loginPassword').value;

    if (u === adminAuth.user && p === adminAuth.pass) {
        closeAdminLoginModal();
        document.getElementById('adminPanelModal').classList.remove('hidden');
        loadAdminFormValues();
        showToast("Autentikasi Berhasil", "Selamat datang di Backend Admin Panel!");
    } else {
        document.getElementById('loginErrorMsg').classList.remove('hidden');
    }
}

function closeAdminPanelModal() {
    document.getElementById('adminPanelModal').classList.add('hidden');
}

function switchAdminTab(tabId, btnElem) {
    document.querySelectorAll('.admin-tab-content').forEach(function (el) { el.classList.add('hidden'); });
    document.querySelectorAll('.admin-tab-btn').forEach(function (el) {
        el.classList.remove('bg-blue-600', 'text-white');
        el.classList.add('text-slate-700', 'dark:text-slate-400');
    });
    document.getElementById(tabId).classList.remove('hidden');
    if (btnElem) {
        btnElem.classList.add('bg-blue-600', 'text-white');
        btnElem.classList.remove('text-slate-700', 'dark:text-slate-400');
    }
}

// ================================
//  ADMIN FORM LOAD & SAVE
// ================================
function loadAdminFormValues() {
    document.querySelector('#heroBadgeDisplay_editor').innerHTML = sectionsConfig.hero.badge;
    document.querySelector('#heroMainTitleDisplay_editor').innerHTML = sectionsConfig.hero.mainTitle;
    document.querySelector('#heroNameDisplay_editor').innerHTML = sectionsConfig.hero.name;
    document.querySelector('#heroSubtextDisplay_editor').innerHTML = sectionsConfig.hero.subtitle;
    var savedImg = savedProfileImage || "";
    document.getElementById('admHeroImgPreview').src = savedImg || createJmlSvgUri('JML');

    document.querySelector('#aboutSectionTitleDisplay_editor').innerHTML = sectionsConfig.about.title;
    document.querySelector('#aboutSectionSubtitleDisplay_editor').innerHTML = sectionsConfig.about.subtitle;
    renderAdminAboutCards();

    document.querySelector('#projectsSectionTitleDisplay_editor').innerHTML = sectionsConfig.projects.title;
    document.querySelector('#projectsSectionSubtitleDisplay_editor').innerHTML = sectionsConfig.projects.subtitle;
    document.querySelector('#projectsSectionDescDisplay_editor').innerHTML = sectionsConfig.projects.desc;

    document.querySelector('#contactTitleDisplay_editor').innerHTML = sectionsConfig.contact.title;
    document.querySelector('#contactSubtitleDisplay_editor').innerHTML = sectionsConfig.contact.subtitle;
    document.querySelector('#footerCopyText_editor').innerHTML = sectionsConfig.footer.copy;

    document.getElementById('admContactEmail').value = contactEmail || document.getElementById('emailTextDisplay').textContent;
    document.getElementById('admContactTiktok').value = (contactTiktok || document.getElementById('footerTiktokUser').textContent)
        .replace('@', '');

    document.getElementById('admTechTitle').value = techStackData.title || '';
    document.getElementById('admTechSubtitle').value = techStackData.subtitle || '';
    updateTechVisibilityUI();
    renderTechBadgeList();

    renderCategoryList();
    renderAdminProjectsList();
    renderAdminCustomSections();
}

// ----- Hero -----
document.getElementById('admProfileFileInput').addEventListener('change', function (e) {
    if (this.files && this.files[0]) {
        showToast("Mengoptimasi Gambar...", "Mengompres foto profil untuk performa terbaik...");
        compressImage(this.files[0], 600, 600, 0.8, function (compressed) {
            document.getElementById('admHeroImgPreview').src = compressed;
            showToast("Gambar Siap", "Foto profil siap disimpan. Klik tombol 'Simpan Hero'.");
        });
    }
});

function saveHeroSettings() {
    sectionsConfig.hero.badge = document.querySelector('#heroBadgeDisplay_editor').innerHTML;
    sectionsConfig.hero.mainTitle = document.querySelector('#heroMainTitleDisplay_editor').innerHTML;
    sectionsConfig.hero.name = document.querySelector('#heroNameDisplay_editor').innerHTML;
    sectionsConfig.hero.subtitle = document.querySelector('#heroSubtextDisplay_editor').innerHTML;

    document.getElementById('heroBadgeDisplay').innerHTML = sectionsConfig.hero.badge;
    document.getElementById('heroMainTitleDisplay').innerHTML = sectionsConfig.hero.mainTitle;
    document.getElementById('heroNameDisplay').innerHTML = sectionsConfig.hero.name;
    document.getElementById('heroSubtextDisplay').innerHTML = sectionsConfig.hero.subtitle;

    var previewSrc = document.getElementById('admHeroImgPreview').src;
    var heroImgDisplay = document.getElementById('heroImageDisplay');
    if (previewSrc && !previewSrc.includes('data:image/svg+xml')) {
        heroImgDisplay.src = previewSrc;
        savedProfileImage = previewSrc;
        fsSave('profile_image', { image: previewSrc });
    } else {
        heroImgDisplay.src = createJmlSvgUri('JML');
        savedProfileImage = "";
        fsSave('profile_image', { image: "" });
    }

    fsSave('sections_config', sectionsConfig, "Perubahan Disimpan", "Hero dan foto profil diperbarui.");
}

function resetProfileImage() {
    document.getElementById('admHeroImgPreview').src = createJmlSvgUri('JML');
    document.getElementById('heroImageDisplay').src = createJmlSvgUri('JML');
    document.getElementById('admProfileFileInput').value = "";
    savedProfileImage = "";
    fsSave('profile_image', { image: "" }, "Foto Profil Dihapus", "Foto dikembalikan ke placeholder.");
}

// ----- About Admin -----
function renderAdminAboutCards() {
    var container = document.getElementById('admAboutCards');
    if (!container) return;
    var cards = sectionsConfig.about.cards || [];
    if (cards.length === 0) {
        container.innerHTML =
            '<p class="text-sm text-slate-500 dark:text-slate-400 italic">Belum ada card. Tambahkan card baru.</p>';
        return;
    }
    container.innerHTML = cards.map(function (card, index) {
        return '<div class="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3" data-index="' +
            index + '">' +
            '<div class="flex items-center justify-between">' +
            '<div class="flex items-center space-x-2">' +
            (card.icon ? '<i class="' + card.icon + ' text-blue-500"></i>' : '') +
            '<span class="font-semibold text-sm">' + card.sub + '</span>' +
            '</div>' +
            '<div class="flex items-center space-x-2">' +
            '<button onclick="toggleEditAboutCard(' + index +
            ')" class="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs rounded-md font-medium"><i class="fa-solid fa-pen"></i></button>' +
            '<button onclick="deleteAboutCard(' + index +
            ')" class="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-xs rounded-md font-medium text-white"><i class="fa-solid fa-trash"></i></button>' +
            '</div>' +
            '</div>' +
            '<div class="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">' + card.content +
            '</div>' +
            '<div id="aboutEditForm_' + index +
            '" class="hidden about-edit-form mt-3 space-y-3">' +
            '<div><label class="text-xs font-semibold text-slate-600 dark:text-slate-400">Ikon (FontAwesome)</label>' +
            '<input type="text" id="aboutIconInput_' + index + '" value="' + (card.icon || '') +
            '" placeholder="fa-solid fa-star" class="w-full" /></div>' +
            '<div><label class="text-xs font-semibold text-slate-600 dark:text-slate-400">Subjudul</label>' +
            '<input type="text" id="aboutSubInput_' + index + '" value="' + card.sub +
            '" class="w-full" /></div>' +
            '<div><label class="text-xs font-semibold text-slate-600 dark:text-slate-400">Isi</label>' +
            '<textarea id="aboutContentInput_' + index +
            '" rows="3" class="w-full">' + card.content + '</textarea></div>' +
            '<div class="flex justify-end space-x-2">' +
            '<button onclick="saveAboutCardInline(' + index +
            ')" class="btn-save"><i class="fa-solid fa-check mr-1"></i>Simpan</button>' +
            '<button onclick="toggleEditAboutCard(' + index +
            ')" class="btn-cancel">Batal</button>' +
            '</div>' +
            '</div>' +
            '</div>';
    }).join('');
}

function toggleEditAboutCard(index) {
    var form = document.getElementById('aboutEditForm_' + index);
    if (form) {
        form.classList.toggle('hidden');
    }
}

function saveAboutCardInline(index) {
    var cards = sectionsConfig.about.cards || [];
    if (!cards[index]) return;
    var iconInput = document.getElementById('aboutIconInput_' + index);
    var subInput = document.getElementById('aboutSubInput_' + index);
    var contentInput = document.getElementById('aboutContentInput_' + index);
    if (iconInput) cards[index].icon = iconInput.value.trim() || '';
    if (subInput) cards[index].sub = subInput.value;
    if (contentInput) cards[index].content = contentInput.value;
    fsSave('sections_config', sectionsConfig, "Card Diperbarui", "Perubahan disimpan.");
    renderAdminAboutCards();
    renderAboutCards();
}

function addAboutCard() {
    var cards = sectionsConfig.about.cards || [];
    var newCard = {
        id: Date.now(),
        icon: "fa-solid fa-star",
        sub: "Subjudul baru",
        content: "Isi konten card baru..."
    };
    cards.push(newCard);
    sectionsConfig.about.cards = cards;
    fsSave('sections_config', sectionsConfig, "Card Ditambahkan", "Card baru berhasil dibuat.");
    renderAdminAboutCards();
    renderAboutCards();
}

function deleteAboutCard(index) {
    if (!confirm("Hapus card ini?")) return;
    var cards = sectionsConfig.about.cards || [];
    cards.splice(index, 1);
    sectionsConfig.about.cards = cards;
    fsSave('sections_config', sectionsConfig, "Card Dihapus", "Card berhasil dihapus.");
    renderAdminAboutCards();
    renderAboutCards();
}

function saveAboutSettings() {
    sectionsConfig.about.title = document.querySelector('#aboutSectionTitleDisplay_editor').innerHTML;
    sectionsConfig.about.subtitle = document.querySelector('#aboutSectionSubtitleDisplay_editor').innerHTML;
    document.getElementById('aboutSectionTitleDisplay').innerHTML = sectionsConfig.about.title;
    document.getElementById('aboutSectionSubtitleDisplay').innerHTML = sectionsConfig.about.subtitle;
    fsSave('sections_config', sectionsConfig, "Perubahan Disimpan", "Tentang Saya diperbarui.");
}

// ----- Projects Settings -----
function saveProjectsSettings() {
    sectionsConfig.projects.title = document.querySelector('#projectsSectionTitleDisplay_editor').innerHTML;
    sectionsConfig.projects.subtitle = document.querySelector('#projectsSectionSubtitleDisplay_editor').innerHTML;
    sectionsConfig.projects.desc = document.querySelector('#projectsSectionDescDisplay_editor').innerHTML;
    renderProjects();
    fsSave('sections_config', sectionsConfig, "Perubahan Disimpan", "Pengaturan Projects diperbarui.");
}

// ----- Contact & Footer -----
function saveContactSettings() {
    sectionsConfig.contact.title = document.querySelector('#contactTitleDisplay_editor').innerHTML;
    sectionsConfig.contact.subtitle = document.querySelector('#contactSubtitleDisplay_editor').innerHTML;
    sectionsConfig.footer.copy = document.querySelector('#footerCopyText_editor').innerHTML;

    var email = document.getElementById('admContactEmail').value;
    var tiktok = document.getElementById('admContactTiktok').value;
    contactEmail = email;
    contactTiktok = tiktok;

    document.getElementById('contactTitleDisplay').innerHTML = sectionsConfig.contact.title;
    document.getElementById('contactSubtitleDisplay').innerHTML = sectionsConfig.contact.subtitle;
    document.getElementById('emailTextDisplay').innerHTML = email;
    document.getElementById('footerTiktokUser').innerHTML = '@' + tiktok;
    document.getElementById('footerTiktokLink').href = 'https://www.tiktok.com/@' + tiktok;
    document.getElementById('tiktokLinkBtn').href = 'https://www.tiktok.com/@' + tiktok;
    document.getElementById('mailLinkBtn').href = 'mailto:' + email;
    document.getElementById('footerCopyText').innerHTML = sectionsConfig.footer.copy;

    fsSave('contact', { email: email, tiktok: tiktok });
    fsSave('sections_config', sectionsConfig, "Perubahan Disimpan", "Kontak & footer diperbarui.");
}

// ----- Security -----
function saveSecuritySettings() {
    var u = document.getElementById('admNewUsername').value;
    var p = document.getElementById('admNewPassword').value;
    if (u && p) {
        adminAuth = { user: u, pass: p };
        fsSave('admin_auth', adminAuth, "Keamanan Diperbarui", "Credential login berhasil diganti!");
        document.getElementById('admNewUsername').value = '';
        document.getElementById('admNewPassword').value = '';
    } else {
        showToast("Peringatan", "Mohon isi username dan password baru.");
    }
}

// ================================
//  TECH STACK ADMIN
// ================================
function updateTechVisibilityUI() {
    var toggle = document.getElementById('techVisibilityToggle');
    var indicator = document.getElementById('techToggleIndicator');
    var label = document.getElementById('techVisibilityLabel');
    if (techStackData.visible) {
        toggle.classList.remove('bg-slate-600');
        toggle.classList.add('bg-blue-600');
        indicator.classList.remove('translate-x-0');
        indicator.classList.add('translate-x-6');
        label.textContent = 'Terlihat';
    } else {
        toggle.classList.remove('bg-blue-600');
        toggle.classList.add('bg-slate-600');
        indicator.classList.remove('translate-x-6');
        indicator.classList.add('translate-x-0');
        label.textContent = 'Tersembunyi';
    }
}

document.getElementById('techVisibilityToggle').addEventListener('click', function () {
    techStackData.visible = !techStackData.visible;
    fsSave('tech_stack', techStackData);
    updateTechVisibilityUI();
    renderTechStack();
    showToast('Perubahan', 'Tech Stack ' + (techStackData.visible ? 'ditampilkan' : 'disembunyikan') + '.');
});

function saveTechStackSettings() {
    techStackData.title = document.getElementById('admTechTitle').value.trim() || 'Tech Stack & Skills';
    techStackData.subtitle = document.getElementById('admTechSubtitle').value.trim();
    fsSave('tech_stack', techStackData, 'Berhasil', 'Pengaturan Tech Stack disimpan.');
    renderTechStack();
}

function renderTechBadgeList() {
    var container = document.getElementById('admTechBadgeList');
    if (!container) return;
    if (techStackData.badges.length === 0) {
        container.innerHTML =
            '<p class="text-xs text-slate-500 dark:text-slate-400 italic col-span-2">Belum ada badge.</p>';
        return;
    }
    container.innerHTML = techStackData.badges.map(function (b) {
        return '<div class="flex items-center justify-between p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">' +
            '<div class="flex items-center space-x-3">' +
            (b.icon ? '<i class="' + b.icon + ' text-xl ' + b.color + '"></i>' : '') +
            '<span class="font-semibold text-sm text-slate-900 dark:text-white">' + b.name + '</span>' +
            (b.label ?
                '<span class="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">' +
                b.label + '</span>' : '') +
            '</div>' +
            '<div class="flex items-center space-x-1">' +
            '<button onclick="editTechBadge(' + b.id +
            ')" class="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs rounded-md font-medium text-slate-700 dark:text-slate-200"><i class="fa-solid fa-pen"></i></button>' +
            '<button onclick="deleteTechBadge(' + b.id +
            ')" class="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-xs rounded-md font-medium text-white"><i class="fa-solid fa-trash"></i></button>' +
            '</div>' +
            '</div>';
    }).join('');
}

function openTechBadgeModal(badgeData) {
    var modal = document.getElementById('techBadgeModal');
    var form = document.getElementById('techBadgeForm');
    form.reset();
    document.getElementById('techBadgeEditId').value = '';

    if (badgeData) {
        document.getElementById('techBadgeModalTitle').innerHTML =
            '<i class="fa-solid fa-pen-to-square text-blue-500"></i> Edit Badge';
        document.getElementById('techBadgeEditId').value = badgeData.id;
        document.getElementById('techBadgeName').value = badgeData.name;
        document.getElementById('techBadgeIcon').value = badgeData.icon || '';
        document.getElementById('techBadgeColor').value = badgeData.color || '';
        document.getElementById('techBadgeLabel').value = badgeData.label || '';
    } else {
        document.getElementById('techBadgeModalTitle').innerHTML =
            '<i class="fa-solid fa-microchip text-blue-500"></i> Tambah Badge';
    }
    modal.classList.remove('hidden');
}

function closeTechBadgeModal() {
    document.getElementById('techBadgeModal').classList.add('hidden');
}

function handleSaveTechBadge(e) {
    e.preventDefault();
    var id = document.getElementById('techBadgeEditId').value;
    var name = document.getElementById('techBadgeName').value.trim();
    var icon = document.getElementById('techBadgeIcon').value.trim();
    var color = document.getElementById('techBadgeColor').value.trim();
    var label = document.getElementById('techBadgeLabel').value.trim();

    if (!name) {
        showToast('Peringatan', 'Nama teknologi wajib diisi.');
        return;
    }

    if (id) {
        var badge = techStackData.badges.find(function (b) { return b.id == id; });
        if (badge) {
            badge.name = name;
            badge.icon = icon;
            badge.color = color;
            badge.label = label;
        }
    } else {
        var newBadge = {
            id: Date.now(),
            name: name,
            icon: icon,
            color: color,
            label: label
        };
        techStackData.badges.push(newBadge);
    }

    fsSave('tech_stack', techStackData, 'Berhasil', 'Badge berhasil disimpan.');
    renderTechStack();
    renderTechBadgeList();
    closeTechBadgeModal();
}

function editTechBadge(id) {
    var badge = techStackData.badges.find(function (b) { return b.id === id; });
    if (badge) openTechBadgeModal(badge);
}

function deleteTechBadge(id) {
    if (confirm('Hapus badge ini?')) {
        techStackData.badges = techStackData.badges.filter(function (b) { return b.id !== id; });
        fsSave('tech_stack', techStackData, 'Terhapus', 'Badge berhasil dihapus.');
        renderTechStack();
        renderTechBadgeList();
    }
}

// ================================
//  CATEGORIES ADMIN
// ================================
function renderCategoryList() {
    var container = document.getElementById('categoryList');
    if (!container) return;
    container.innerHTML = categories.map(function (cat) {
        return '<span class="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-semibold">' +
            cat.label +
            ' <button onclick="deleteCategory(' + cat.id +
            ')" class="ml-2 text-rose-500 hover:text-rose-700 dark:hover:text-rose-300"><i class="fa-solid fa-xmark"></i></button>' +
            '</span>';
    }).join('');
}

function addCategory() {
    var input = document.getElementById('newCategoryInput');
    var label = input.value.trim();
    if (!label) {
        showToast('Peringatan', 'Masukkan nama kategori.');
        return;
    }
    if (categories.some(function (c) { return c.label.toLowerCase() === label.toLowerCase(); })) {
        showToast('Peringatan', 'Kategori sudah ada.');
        return;
    }
    var key = label.toLowerCase().replace(/\s+/g, '_');
    var baseKey = key;
    var counter = 1;
    while (categories.some(function (c) { return c.key === key; })) {
        key = baseKey + '_' + counter;
        counter++;
    }
    var newCat = { id: Date.now(), key: key, label: label };
    categories.push(newCat);
    fsSave('categories', { list: categories }, 'Berhasil', 'Kategori "' + label + '" ditambahkan.');
    renderCategoryList();
    renderFilterButtons();
    populateCategorySelect();
    input.value = '';
}

function deleteCategory(id) {
    var cat = categories.find(function (c) { return c.id === id; });
    if (!cat) return;
    var used = projectsData.some(function (p) { return p.category === cat.key; });
    if (used) {
        showToast('Tidak bisa hapus', 'Kategori "' + cat.label +
            '" masih digunakan oleh project. Ubah kategori project terlebih dahulu.');
        return;
    }
    if (confirm('Hapus kategori "' + cat.label + '"?')) {
        categories = categories.filter(function (c) { return c.id !== id; });
        fsSave('categories', { list: categories }, 'Berhasil', 'Kategori dihapus.');
        renderCategoryList();
        renderFilterButtons();
        populateCategorySelect();
    }
}

// ================================
//  PROJECTS ADMIN
// ================================
function renderAdminProjectsList() {
    var container = document.getElementById('admProjectsList');
    container.innerHTML = projectsData.map(function (p) {
        return '<div class="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3">' +
            '<div class="flex items-center space-x-3 overflow-hidden">' +
            '<img src="' + (p.imageSrc || createJmlSvgUri('JML')) +
            '" class="w-12 h-12 rounded-lg object-cover bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shrink-0" onerror="handleImageError(this, \'JML\')">' +
            '<div class="truncate">' +
            '<p class="font-bold text-sm text-slate-900 dark:text-white truncate">' + p.title + '</p>' +
            '<span class="text-xs text-blue-600 dark:text-blue-400">' + (p.categoryLabel || p.category) +
            '</span>' +
            '</div>' +
            '</div>' +
            '<div class="flex items-center space-x-2 shrink-0">' +
            '<button onclick="editProjectCard(' + p.id +
            ')" class="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-lg font-semibold transition-all"><i class="fa-solid fa-pen mr-1"></i> Edit</button>' +
            '<button onclick="deleteProject(' + p.id +
            ')" class="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs rounded-lg font-semibold transition-all"><i class="fa-solid fa-trash"></i></button>' +
            '</div>' +
            '</div>';
    }).join('');
}

function populateCategorySelect() {
    var select = document.getElementById('cardCategorySelect');
    if (!select) return;
    select.innerHTML = '';
    categories.forEach(function (cat) {
        var opt = document.createElement('option');
        opt.value = cat.key;
        opt.textContent = cat.label;
        select.appendChild(opt);
    });
}

function setCategoryFieldVisibility(targetType) {
    var projectWrapper = document.getElementById('categoryProjectWrapper');
    var customWrapper = document.getElementById('categoryCustomWrapper');
    if (targetType === 'project') {
        projectWrapper.classList.remove('hidden');
        customWrapper.classList.add('hidden');
        populateCategorySelect();
    } else {
        projectWrapper.classList.add('hidden');
        customWrapper.classList.remove('hidden');
    }
}

function openProjectModalForm() {
    document.getElementById('cardEditId').value = "";
    document.getElementById('cardEditTargetType').value = "project";
    document.getElementById('cardModalHeaderTitle').innerHTML =
        '<i class="fa-solid fa-plus text-blue-500"></i> Tambah Karya / Prestasi Baru';
    document.getElementById('cardTitleInput').value = "";
    document.getElementById('cardStatusInput').value = "Selesai";
    document.getElementById('cardIconInput').value = "";
    document.getElementById('cardDescInput').value = "";
    document.getElementById('cardYoutubeInput').value = "";
    document.getElementById('cardLiveInput').value = "";
    document.getElementById('cardStackInput').value = "HTML, Tailwind CSS";
    document.getElementById('cardCategoryInput').value = "";
    currentCardImageData = "";
    document.getElementById('cardImagePreview').src = createJmlSvgUri('JML');
    document.getElementById('cardFileInput').value = "";
    setCategoryFieldVisibility('project');
    document.getElementById('cardEditModal').classList.remove('hidden');
}

function editProjectCard(id) {
    var p = projectsData.find(function (item) { return item.id === id; });
    if (!p) return;
    document.getElementById('cardEditId').value = p.id;
    document.getElementById('cardEditTargetType').value = "project";
    document.getElementById('cardModalHeaderTitle').innerHTML =
        '<i class="fa-solid fa-pen-to-square text-blue-500"></i> Edit Karya / Prestasi';
    document.getElementById('cardTitleInput').value = p.title;
    setCategoryFieldVisibility('project');
    var select = document.getElementById('cardCategorySelect');
    if (select) {
        var found = false;
        for (var i = 0; i < select.options.length; i++) {
            if (select.options[i].value === p.category) {
                select.selectedIndex = i;
                found = true;
                break;
            }
        }
        if (!found && select.options.length > 0) select.selectedIndex = 0;
    }
    document.getElementById('cardStatusInput').value = p.status || 'Selesai';
    document.getElementById('cardIconInput').value = p.icon || '';
    document.getElementById('cardDescInput').value = p.description;
    document.getElementById('cardYoutubeInput').value = p.youtubeUrl || '';
    document.getElementById('cardLiveInput').value = p.live || '';
    document.getElementById('cardStackInput').value = (p.stack || []).join(', ');
    currentCardImageData = p.imageSrc || "";
    document.getElementById('cardImagePreview').src = currentCardImageData || createJmlSvgUri('JML');
    document.getElementById('cardFileInput').value = "";
    document.getElementById('cardEditModal').classList.remove('hidden');
}

function deleteProject(id) {
    if (confirm('Hapus project ini?')) {
        projectsData = projectsData.filter(function (p) { return p.id !== id; });
        fsSave('projects', { list: projectsData }, "Terhapus", "Project berhasil dihapus.");
        renderProjects();
        renderAdminProjectsList();
    }
}

// ================================
//  CARD FORM HANDLER
// ================================
document.getElementById('cardFileInput').addEventListener('change', function (e) {
    if (this.files && this.files[0]) {
        showToast("Mengoptimasi Gambar...", "Mengompres gambar card untuk performa terbaik...");
        compressImage(this.files[0], 1000, 700, 0.78, function (compressed) {
            currentCardImageData = compressed;
            document.getElementById('cardImagePreview').src = compressed;
            showToast("Gambar Siap", "Gambar card berhasil dioptimasi.");
        });
    }
});

function resetCardImage() {
    currentCardImageData = "";
    document.getElementById('cardImagePreview').src = createJmlSvgUri('JML');
    document.getElementById('cardFileInput').value = "";
}

function closeCardModal() {
    document.getElementById('cardEditModal').classList.add('hidden');
}

function handleSaveCardForm(e) {
    e.preventDefault();
    var idVal = document.getElementById('cardEditId').value;
    var targetType = document.getElementById('cardEditTargetType').value;

    var title = document.getElementById('cardTitleInput').value;
    var catLabel = '';
    var catKey = '';
    if (targetType === 'project') {
        catKey = document.getElementById('cardCategorySelect').value;
        var selectedCat = categories.find(function (c) { return c.key === catKey; });
        catLabel = selectedCat ? selectedCat.label : catKey;
    } else {
        catLabel = document.getElementById('cardCategoryInput').value || 'Karya';
        catKey = catLabel.toLowerCase().replace(/\s+/g, '_');
    }
    var status = document.getElementById('cardStatusInput').value || 'Selesai';
    var icon = document.getElementById('cardIconInput').value.trim();
    var desc = document.getElementById('cardDescInput').value;
    var youtube = document.getElementById('cardYoutubeInput').value;
    var live = document.getElementById('cardLiveInput').value;
    var stackArr = document.getElementById('cardStackInput').value.split(',').map(function (s) { return s.trim(); })
        .filter(Boolean);

    if (targetType === "project") {
        var validCat = categories.find(function (c) { return c.key === catKey; });
        if (!validCat && categories.length > 0) {
            catKey = categories[0].key;
            catLabel = categories[0].label;
        } else if (!validCat && categories.length === 0) {
            showToast('Peringatan', 'Belum ada kategori. Tambahkan kategori dulu.');
            return;
        }

        if (idVal) {
            var p = projectsData.find(function (item) { return item.id == idVal; });
            if (p) {
                p.title = title;
                p.category = catKey;
                p.categoryLabel = catLabel;
                p.status = status;
                p.icon = icon;
                p.description = desc;
                p.youtubeUrl = youtube;
                p.live = live;
                p.stack = stackArr;
                p.imageSrc = currentCardImageData;
            }
        } else {
            var newProj = {
                id: Date.now(),
                title: title,
                category: catKey,
                categoryLabel: catLabel,
                status: status,
                icon: icon,
                imageSrc: currentCardImageData,
                youtubeUrl: youtube,
                description: desc,
                impact: "Penghargaan & Hasil Karya Baru",
                features: ["Detail Fitur Responsif", "Terstruktur"],
                stack: stackArr,
                live: live
            };
            projectsData.unshift(newProj);
        }
        fsSave('projects', { list: projectsData }, "Card Tersimpan", "Data karya/prestasi berhasil disimpan.");
        renderProjects();
        renderAdminProjectsList();
    } else {
        var secId = parseInt(targetType);
        var sec = customSections.find(function (s) { return s.id === secId; });
        if (sec) {
            if (!sec.cards) sec.cards = [];
            if (idVal) {
                var c = sec.cards.find(function (item) { return item.id == idVal; });
                if (c) {
                    c.title = title;
                    c.categoryLabel = catLabel;
                    c.status = status;
                    c.icon = icon;
                    c.description = desc;
                    c.youtubeUrl = youtube;
                    c.live = live;
                    c.stack = stackArr;
                    c.imageSrc = currentCardImageData;
                }
            } else {
                sec.cards.unshift({
                    id: Date.now(),
                    title: title,
                    categoryLabel: catLabel,
                    status: status,
                    icon: icon,
                    description: desc,
                    youtubeUrl: youtube,
                    live: live,
                    stack: stackArr,
                    imageSrc: currentCardImageData
                });
            }
            fsSave('custom_sections', { list: customSections }, "Card Tersimpan", "Data card section custom berhasil disimpan.");
            renderCustomSections();
            renderAdminCustomSections();
        }
    }

    closeCardModal();
}

// ================================
//  CUSTOM SECTIONS ADMIN
// ================================
function addNewCustomSection() {
    var title = document.getElementById('newSectionTitle').value;
    var subtitle = document.getElementById('newSectionSubtitle').value;
    if (!title) {
        showToast("Peringatan", "Judul section tidak boleh kosong.");
        return;
    }
    var newSec = {
        id: Date.now(),
        title: title,
        subtitle: subtitle,
        hidden: false,
        cards: []
    };
    customSections.push(newSec);
    fsSave('custom_sections', { list: customSections }, "Section Dibuat", "Section baru ditambahkan.");
    renderCustomSections();
    renderAdminCustomSections();
    document.getElementById('newSectionTitle').value = '';
    document.getElementById('newSectionSubtitle').value = '';
}

function renderAdminCustomSections() {
    var container = document.getElementById('admCustomSectionsList');
    container.innerHTML = customSections.map(function (s) {
        return '<div class="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">' +
            '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">' +
            '<div>' +
            '<span class="font-bold text-base text-slate-900 dark:text-white">' + s.title + '</span>' +
            '<span class="ml-2 text-xs px-2 py-0.5 rounded ' + (s.hidden ?
                'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300' :
                'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300') +
            ' font-semibold">' +
            (s.hidden ? 'Tersembunyi' : 'Tampil') +
            '</span>' +
            '<p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">' + (s.subtitle ||
                'Tanpa sub-deskripsi') + '</p>' +
            '</div>' +
            '<div class="flex items-center space-x-2 shrink-0">' +
            '<button onclick="openCustomSectionCardForm(' + s.id +
            ')" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-xs font-semibold rounded-lg text-white">+ Tambah Card</button>' +
            '<button onclick="toggleSectionHide(' + s.id +
            ')" class="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-200">' +
            (s.hidden ? 'Tampilkan' : 'Sembunyikan') + '</button>' +
            '<button onclick="deleteCustomSection(' + s.id +
            ')" class="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-xs font-semibold rounded-lg text-white"><i class="fa-solid fa-trash"></i> Hapus</button>' +
            '</div>' +
            '</div>' +
            '<div class="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">' +
            ((s.cards || []).length === 0 ?
                '<p class="text-xs text-slate-500 dark:text-slate-400 italic">Belum ada card.</p>' : '') +
            (s.cards || []).map(function (c) {
                var iconHtml = c.icon ? '<i class="' + c.icon + ' text-blue-500 mr-1"></i>' : '';
                return '<div class="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl flex items-center justify-between gap-3">' +
                    '<div class="flex items-center space-x-3 overflow-hidden">' +
                    '<img src="' + (c.imageSrc || createJmlSvgUri('JML')) +
                    '" class="w-10 h-10 rounded-lg object-cover bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shrink-0" onerror="handleImageError(this, \'JML\')">' +
                    '<div class="truncate">' +
                    iconHtml +
                    '<span class="font-semibold text-xs text-slate-900 dark:text-white truncate">' +
                    c.title + '</span>' +
                    '<span class="text-[10px] text-slate-500 dark:text-slate-400">' + (c
                        .categoryLabel || s.title) + '</span>' +
                    '</div>' +
                    '</div>' +
                    '<div class="flex items-center space-x-1 shrink-0">' +
                    '<button onclick="editCustomSectionCard(' + s.id + ',' + c.id +
                    ')" class="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-[11px] text-slate-700 dark:text-slate-200 rounded-md font-medium"><i class="fa-solid fa-pen"></i></button>' +
                    '<button onclick="deleteCustomSectionCard(' + s.id + ',' + c.id +
                    ')" class="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-[11px] text-white rounded-md font-medium"><i class="fa-solid fa-xmark"></i></button>' +
                    '</div>' +
                    '</div>';
            }).join('') +
            '</div>' +
            '</div>';
    }).join('');
}

function openCustomSectionCardForm(sectionId) {
    var sec = customSections.find(function (s) { return s.id === sectionId; });
    if (!sec) return;
    document.getElementById('cardEditId').value = "";
    document.getElementById('cardEditTargetType').value = sectionId;
    document.getElementById('cardModalHeaderTitle').innerHTML =
        '<i class="fa-solid fa-plus text-blue-500"></i> Tambah Card ke ' + sec.title;
    document.getElementById('cardTitleInput').value = "";
    document.getElementById('cardCategoryInput').value = sec.title;
    document.getElementById('cardStatusInput').value = "Aktif";
    document.getElementById('cardIconInput').value = "";
    document.getElementById('cardDescInput').value = "";
    document.getElementById('cardYoutubeInput').value = "";
    document.getElementById('cardLiveInput').value = "";
    document.getElementById('cardStackInput').value = "Teknologi";
    currentCardImageData = "";
    document.getElementById('cardImagePreview').src = createJmlSvgUri('JML');
    document.getElementById('cardFileInput').value = "";
    setCategoryFieldVisibility('custom');
    document.getElementById('cardEditModal').classList.remove('hidden');
}

function editCustomSectionCard(sectionId, cardId) {
    var sec = customSections.find(function (s) { return s.id === sectionId; });
    if (!sec) return;
    var c = (sec.cards || []).find(function (item) { return item.id === cardId; });
    if (!c) return;
    document.getElementById('cardEditId').value = c.id;
    document.getElementById('cardEditTargetType').value = sectionId;
    document.getElementById('cardModalHeaderTitle').innerHTML =
        '<i class="fa-solid fa-pen-to-square text-blue-500"></i> Edit Card ' + c.title;
    document.getElementById('cardTitleInput').value = c.title;
    document.getElementById('cardCategoryInput').value = c.categoryLabel || sec.title;
    document.getElementById('cardStatusInput').value = c.status || 'Aktif';
    document.getElementById('cardIconInput').value = c.icon || '';
    document.getElementById('cardDescInput').value = c.description;
    document.getElementById('cardYoutubeInput').value = c.youtubeUrl || '';
    document.getElementById('cardLiveInput').value = c.live || '';
    document.getElementById('cardStackInput').value = (c.stack || []).join(', ');
    currentCardImageData = c.imageSrc || "";
    document.getElementById('cardImagePreview').src = currentCardImageData || createJmlSvgUri('JML');
    document.getElementById('cardFileInput').value = "";
    setCategoryFieldVisibility('custom');
    document.getElementById('cardEditModal').classList.remove('hidden');
}

function deleteCustomSectionCard(sectionId, cardId) {
    var sec = customSections.find(function (s) { return s.id === sectionId; });
    if (sec && sec.cards) {
        sec.cards = sec.cards.filter(function (c) { return c.id !== cardId; });
        fsSave('custom_sections', { list: customSections }, "Card Dihapus", "Card berhasil dihapus.");
        renderCustomSections();
        renderAdminCustomSections();
    }
}

function toggleSectionHide(id) {
    var sec = customSections.find(function (s) { return s.id === id; });
    if (sec) {
        sec.hidden = !sec.hidden;
        fsSave('custom_sections', { list: customSections });
        renderCustomSections();
        renderAdminCustomSections();
        showToast("Status Section", sec.hidden ? "Section disembunyikan." : "Section ditampilkan.");
    }
}

function deleteCustomSection(id) {
    customSections = customSections.filter(function (s) { return s.id !== id; });
    fsSave('custom_sections', { list: customSections }, "Section Dihapus", "Section dan seluruh cardnya dihapus.");
    renderCustomSections();
    renderAdminCustomSections();
}

// ================================
//  THEME
// ================================
function initTheme() {
    var userTheme = localStorage.getItem('theme');
    var systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (userTheme === 'dark' || (!userTheme && systemPrefersDark)) {
        document.documentElement.classList.add('dark');
        document.getElementById('themeIconSun').classList.remove('hidden');
        document.getElementById('themeIconMoon').classList.add('hidden');
    } else {
        document.documentElement.classList.remove('dark');
        document.getElementById('themeIconSun').classList.add('hidden');
        document.getElementById('themeIconMoon').classList.remove('hidden');
    }
}

document.getElementById('themeToggle').addEventListener('click', function () {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        document.getElementById('themeIconSun').classList.add('hidden');
        document.getElementById('themeIconMoon').classList.remove('hidden');
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        document.getElementById('themeIconSun').classList.remove('hidden');
        document.getElementById('themeIconMoon').classList.add('hidden');
    }
});

// ================================
//  COPY EMAIL
// ================================
document.getElementById('copyEmailBtn').addEventListener('click', function () {
    var email = document.getElementById('emailTextDisplay').textContent;
    var tempInput = document.createElement('input');
    tempInput.value = email;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    document.getElementById('copyBtnText').textContent = 'Copied!';
    showToast("Email Disalin!", "Alamat email berhasil disalin.");
    setTimeout(function () {
        document.getElementById('copyBtnText').textContent = 'Copy';
    }, 2000);
});

// ================================
//  MOBILE MENU TOGGLE
// ================================
document.getElementById('mobileMenuBtn').addEventListener('click', function () {
    document.getElementById('mobileMenu').classList.toggle('hidden');
});

// ================================
//  FILTER & SEARCH
// ================================
function setupFilterListeners() {
    var searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            searchQuery = e.target.value;
            renderProjects();
        });
    }

    var allFilterBtn = document.querySelector('button[data-filter="all"]');
    if (allFilterBtn) {
        allFilterBtn.addEventListener('click', function () {
            applyFilter('all');
        });
    }
}

// ================================
//  INIT ON LOAD
// ================================
window.onload = function () {
    initTheme();

    // Editor toolbars
    buildEditorToolbars();

    // Muat data dari localStorage terlebih dahulu agar UI instan dan tidak kembali ke default
    loadAllFromLocalStorage();

    // Tampilkan data ke UI
    applyDataToUI();

    // Filter listeners
    setupFilterListeners();

    // ENHANCED NAVBAR SCROLL (drag + keyboard arrow)
    initNavbarMouseScroll();

    // Inisialisasi sinkronisasi data dengan Firebase Firestore
    initFirestoreSync();
};
