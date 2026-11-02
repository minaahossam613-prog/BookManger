/*=========================================
    Book Manager Pro - app.js
    باستخدام IndexedDB كقاعدة بيانات خارجية
=========================================*/

/*=========================
    فئة قاعدة البيانات IndexedDB
=========================*/
class BookDatabase {
    constructor() {
        this.dbName = 'BookManagerDB';
        this.dbVersion = 1;
        this.db = null;
        this.booksStore = 'books';
        this.listsStore = 'lists';
        this.isReady = false;
        this.pendingOperations = [];
    }

    async open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error('❌ خطأ في فتح قاعدة البيانات:', event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                this.isReady = true;
                console.log('✅ تم فتح قاعدة البيانات بنجاح');
                this.processPendingOperations();
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains(this.booksStore)) {
                    const booksStore = db.createObjectStore(this.booksStore, { keyPath: 'id' });
                    booksStore.createIndex('title', 'title', { unique: false });
                    booksStore.createIndex('author', 'author', { unique: false });
                    booksStore.createIndex('status', 'status', { unique: false });
                    booksStore.createIndex('favorite', 'favorite', { unique: false });
                    booksStore.createIndex('list', 'list', { unique: false });
                    console.log('✅ تم إنشاء مخزن الكتب');
                }

                if (!db.objectStoreNames.contains(this.listsStore)) {
                    db.createObjectStore(this.listsStore, { keyPath: 'name' });
                    console.log('✅ تم إنشاء مخزن القوائم');
                }
            };
        });
    }

    processPendingOperations() {
        while (this.pendingOperations.length > 0) {
            const operation = this.pendingOperations.shift();
            operation();
        }
    }

    async ensureReady() {
        if (!this.isReady) {
            await this.open();
        }
    }

    async execute(operation) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const executeOp = () => {
                try {
                    const result = operation(this.db);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            };

            if (this.isReady) {
                executeOp();
            } else {
                this.pendingOperations.push(executeOp);
            }
        });
    }

    async getAllBooks() {
        return this.execute((db) => {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([this.booksStore], 'readonly');
                const store = transaction.objectStore(this.booksStore);
                const request = store.getAll();

                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
            });
        });
    }

    async getBook(id) {
        return this.execute((db) => {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([this.booksStore], 'readonly');
                const store = transaction.objectStore(this.booksStore);
                const request = store.get(id);

                request.onsuccess = () => resolve(request.result || null);
                request.onerror = () => reject(request.error);
            });
        });
    }

    async addBook(book) {
        return this.execute((db) => {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([this.booksStore], 'readwrite');
                const store = transaction.objectStore(this.booksStore);
                const request = store.add(book);

                request.onsuccess = () => resolve(book);
                request.onerror = () => reject(request.error);
            });
        });
    }

    async updateBook(book) {
        return this.execute((db) => {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([this.booksStore], 'readwrite');
                const store = transaction.objectStore(this.booksStore);
                const request = store.put(book);

                request.onsuccess = () => resolve(book);
                request.onerror = () => reject(request.error);
            });
        });
    }

    async deleteBook(id) {
        return this.execute((db) => {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([this.booksStore], 'readwrite');
                const store = transaction.objectStore(this.booksStore);
                const request = store.delete(id);

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        });
    }

    async deleteAllBooks() {
        return this.execute((db) => {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([this.booksStore], 'readwrite');
                const store = transaction.objectStore(this.booksStore);
                const request = store.clear();

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        });
    }

    async getAllLists() {
        return this.execute((db) => {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([this.listsStore], 'readonly');
                const store = transaction.objectStore(this.listsStore);
                const request = store.getAll();

                request.onsuccess = () => {
                    const lists = request.result || [];
                    resolve(lists.map(item => item.name));
                };
                request.onerror = () => reject(request.error);
            });
        });
    }

    async addList(listName) {
        return this.execute((db) => {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([this.listsStore], 'readwrite');
                const store = transaction.objectStore(this.listsStore);
                const request = store.add({ name: listName });

                request.onsuccess = () => resolve(listName);
                request.onerror = () => reject(request.error);
            });
        });
    }

    async deleteList(listName) {
        return this.execute((db) => {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([this.listsStore], 'readwrite');
                const store = transaction.objectStore(this.listsStore);
                const request = store.delete(listName);

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        });
    }

    async deleteAllLists() {
        return this.execute((db) => {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([this.listsStore], 'readwrite');
                const store = transaction.objectStore(this.listsStore);
                const request = store.clear();

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        });
    }

    async exportAllData() {
        const books = await this.getAllBooks();
        const lists = await this.getAllLists();
        return { books, lists, exportDate: new Date().toISOString() };
    }

    async bulkSaveBooks(books) {
        return this.execute((db) => {
            return new Promise((resolve, reject) => {
                const tx = db.transaction([this.booksStore], 'readwrite');
                const store = tx.objectStore(this.booksStore);
                const clearReq = store.clear();
                clearReq.onsuccess = () => {
                    if (books.length === 0) { resolve(); return; }
                    let done = 0;
                    books.forEach(book => {
                        const req = store.put(book);
                        req.onsuccess = () => { done++; if (done === books.length) resolve(); };
                        req.onerror = () => reject(req.error);
                    });
                };
                clearReq.onerror = () => reject(clearReq.error);
                tx.onerror = () => reject(tx.error);
            });
        });
    }

    async bulkSaveLists(lists) {
        return this.execute((db) => {
            return new Promise((resolve, reject) => {
                const tx = db.transaction([this.listsStore], 'readwrite');
                const store = tx.objectStore(this.listsStore);
                const clearReq = store.clear();
                clearReq.onsuccess = () => {
                    if (lists.length === 0) { resolve(); return; }
                    let done = 0;
                    lists.forEach(name => {
                        const req = store.put({ name });
                        req.onsuccess = () => { done++; if (done === lists.length) resolve(); };
                        req.onerror = () => reject(req.error);
                    });
                };
                clearReq.onerror = () => reject(clearReq.error);
                tx.onerror = () => reject(tx.error);
            });
        });
    }

    async importAllData(data) {
        await this.deleteAllBooks();
        await this.deleteAllLists();

        for (const book of data.books) {
            await this.addBook(book);
        }

        for (const list of data.lists) {
            await this.addList(list);
        }
    }
}

/*=========================
    تهيئة قاعدة البيانات
=========================*/
const db = new BookDatabase();

/*=========================
    العناصر
=========================*/
const booksContainer = document.getElementById("booksContainer");
const booksCount = document.getElementById("booksCount");
const favoriteCount = document.getElementById("favoriteCount");
const readCount = document.getElementById("readCount");
const waitingCount = document.getElementById("waitingCount");
const searchInput = document.getElementById("searchInput");
const loadingIndicator = document.getElementById("loadingIndicator");

const titleInput = document.getElementById("title");
const authorInput = document.getElementById("author");
const yearInput = document.getElementById("year");
const pagesInput = document.getElementById("pages");
const categoryInput = document.getElementById("category");
const statusSelect = document.getElementById("status");
const ratingSelect = document.getElementById("rating");
const bookListSelect = document.getElementById("bookList");
const notesTextarea = document.getElementById("notes");
const coverInput = document.getElementById("cover");
const pdfInput = document.getElementById("pdfFile");
const addBookBtn = document.getElementById("addBookBtn");

const editTitle = document.getElementById("editTitle");
const editAuthor = document.getElementById("editAuthor");
const editYear = document.getElementById("editYear");
const editPages = document.getElementById("editPages");
const editCategory = document.getElementById("editCategory");
const editStatus = document.getElementById("editStatus");
const editNotes = document.getElementById("editNotes");
const editCover = document.getElementById("editCover");
const editCoverPreview = document.getElementById("editCoverPreview");
const editRating = document.getElementById("editRating");
const editPdfFile = document.getElementById("editPdfFile");
const currentPdfName = document.getElementById("currentPdfName");
const saveEditBtn = document.getElementById("saveEdit");
const cancelEditBtn = document.getElementById("cancelEdit");
const editModal = document.getElementById("editModal");

/*=========================
    المتغيرات العامة
=========================*/
let books = [];
let customLists = [];
let editIndex = -1;
let currentFilter = "all";
let currentListFilter = null;
let isLoading = true;
let lastBackupDate = localStorage.getItem('lastBackupDate') || null;
const lastPageSaveByBook = new Map();

/*=========================
    تحميل البيانات من IndexedDB
=========================*/
function normalizeBookProgress(book) {
    if (!book || typeof book !== 'object') return book;

    const total = parseInt(book.pdfTotalPages, 10) || parseInt(book.pages, 10) || 0;
    const originalPage = parseInt(book.currentPage, 10) || 0;
    const safePage = normalizePageNumber(originalPage, total || null);

    let changed = false;
    if (originalPage !== safePage) {
        book.currentPage = safePage;
        changed = true;
    }

    if (total > 0 && parseInt(book.pdfTotalPages, 10) !== total) {
        book.pdfTotalPages = total;
        changed = true;
    }

    return { book, changed };
}

async function loadAllData() {
    showLoading(true);
    try {
        await db.open();
        books = await db.getAllBooks();
        customLists = await db.getAllLists();

        let needsSave = false;
        books = books.map((book) => {
            const result = normalizeBookProgress(book);
            if (result.changed) {
                needsSave = true;
            }
            return result.book;
        });

        if (needsSave) {
            await saveBooksToDB();
        }

        console.log(`📚 تم تحميل ${books.length} كتاب من قاعدة البيانات`);
        console.log(`📋 تم تحميل ${customLists.length} قائمة من قاعدة البيانات`);
    } catch (error) {
        console.error('❌ خطأ في تحميل البيانات:', error);
        showNotification(t('dataImportError'), 'error');
    }
    showLoading(false);
    isLoading = false;
}

function showLoading(show) {
    if (loadingIndicator) {
        loadingIndicator.style.display = show ? 'block' : 'none';
    }
}

/*=========================
    حفظ البيانات إلى IndexedDB
=========================*/
async function saveBooksToDB() {
    try {
        await db.bulkSaveBooks(books);
        console.log('✅ تم حفظ الكتب في قاعدة البيانات');
    } catch (error) {
        console.error('❌ خطأ في حفظ الكتب:', error);
        showNotification(t('dataExportError'), 'error');
    }
}

async function saveListsToDB() {
    try {
        await db.bulkSaveLists(customLists);
        console.log('✅ تم حفظ القوائم في قاعدة البيانات');
    } catch (error) {
        console.error('❌ خطأ في حفظ القوائم:', error);
    }
}

/*=========================
    ✅ حفظ واسترجاع تقدم القراءة (آخر صفحة تم الوصول إليها)
    يتم استدعاء هذه الدالة من نافذة قارئ الـ PDF (عبر window.opener)
    عند كل تغيير صفحة وعند إغلاق النافذة، حتى يتم حفظ آخر صفحة
    وصل إليها المستخدم حتى لو أغلق التطبيق مباشرة.
=========================*/
function normalizePageNumber(value, totalPages = null) {
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed)) return 1;
    const min = 1;
    const max = totalPages && totalPages > 0 ? totalPages : null;
    if (parsed < min) return min;
    if (max && parsed > max) return max;
    return parsed;
}

async function saveReadingProgress(id, currentPage, totalPages, saveStamp = Date.now()) {
    const book = books.find(b => b.id === id);
    if (!book) return;

    const total = totalPages ? parseInt(totalPages, 10) : getBookTotalPages(book);
    const page = normalizePageNumber(currentPage, total);
    const previousStamp = lastPageSaveByBook.get(id) || 0;

    if (saveStamp < previousStamp) {
        return;
    }

    book.currentPage = page;
    if (total && total > 0) {
        book.pdfTotalPages = total;
    }

    if (book.status === 'Want To Read' && page > 1) {
        book.status = 'Reading';
    }

    lastPageSaveByBook.set(id, saveStamp);

    try {
        await saveBooksToDB();
    } catch (error) {
        console.error('❌ خطأ في حفظ تقدم القراءة:', error);
    }

    renderBooks();
    updateStatistics();
}

function getBookTotalPages(book) {
    return parseInt(book.pdfTotalPages) || parseInt(book.pages) || 0;
}

function getReadingProgressPercent(book) {
    const total = getBookTotalPages(book);
    const current = normalizePageNumber(book.currentPage, total);
    if (!total || !current) return 0;
    return Math.min(100, Math.round((current / total) * 100));
}

/*=========================
    إنشاء ID
=========================*/
function createID() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/*=========================
    ✅ تحويل Data URL إلى Blob URL
    (لحل مشكلة عدم فتح بعض ملفات PDF الكبيرة في كروم)
=========================*/
function dataURLtoBlobURL(dataURL) {
    if (!dataURL) return null;
    try {
        const [header, base64] = dataURL.split(',');
        const mimeMatch = header.match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mime });
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error('❌ خطأ في تحويل الملف إلى Blob URL:', error);
        return null;
    }
}

/*=========================
    قراءة الصور وملفات PDF
=========================*/
function readCover(file) {
    return new Promise((resolve) => {
        if (!file || !file.type || !file.type.startsWith("image/")) {
            resolve("https://placehold.co/300x450?text=📚+No+Cover");
            return;
        }
        const reader = new FileReader();
        reader.onload = function (e) {
            resolve(e.target.result);
        };
        reader.onerror = function () {
            resolve("https://placehold.co/300x450?text=📚+No+Cover");
        };
        reader.readAsDataURL(file);
    });
}

function readPDFFile(file) {
    return new Promise((resolve) => {
        if (!file || file.type !== "application/pdf") {
            resolve(null);
            return;
        }
        const reader = new FileReader();
        reader.onload = function (e) {
            resolve(e.target.result);
        };
        reader.onerror = function () {
            resolve(null);
        };
        reader.readAsDataURL(file);
    });
}

/*=========================
    ✅ إضافة كتاب (مع حفظ القائمة)
=========================*/
addBookBtn.addEventListener("click", async function () {
    if (isLoading) {
        showNotification(t('waitLoading'), 'info');
        return;
    }

    const title = titleInput.value.trim();
    const author = authorInput.value.trim();

    if (!title) {
        showNotification(t('enterTitle'), "error");
        titleInput.focus();
        return;
    }

    if (!author) {
        showNotification(t('enterAuthor'), "error");
        authorInput.focus();
        return;
    }

    try {
        const year = yearInput.value || "";
        const pages = pagesInput.value || "";
        const category = categoryInput.value || "";
        const status = statusSelect.value || "Want To Read";
        const rating = parseInt(ratingSelect.value) || 1;
        const notes = notesTextarea.value || "";
        const selectedList = bookListSelect.value || "";

        const coverFile = coverInput.files ? coverInput.files[0] : null;
        const pdfFile = pdfInput.files ? pdfInput.files[0] : null;

        const cover = await readCover(coverFile);
        const pdfData = await readPDFFile(pdfFile);

        const book = {
            id: createID(),
            title: title,
            author: author,
            year: year,
            pages: pages,
            category: category,
            status: status,
            rating: rating,
            notes: notes,
            cover: cover,
            pdf: pdfData,
            favorite: false,
            list: selectedList,
            currentPage: 0,
            pdfTotalPages: null,
            createdAt: new Date().toISOString()
        };

        books.push(book);
        await saveBooksToDB();
        
        renderBooks();
        updateStatistics();
        updateListSelect();
        renderLists();

        titleInput.value = "";
        authorInput.value = "";
        yearInput.value = "";
        pagesInput.value = "";
        categoryInput.value = "";
        statusSelect.value = "Want To Read";
        ratingSelect.value = "5";
        notesTextarea.value = "";
        coverInput.value = "";
        pdfInput.value = "";

        showNotification(t('bookAdded'), "success");
    } catch (error) {
        console.error("❌ خطأ في إضافة الكتاب:", error);
        showNotification(t('bookAddError'), "error");
    }
});

document.querySelectorAll("#bookForm input, #bookForm textarea").forEach(input => {
    input.addEventListener("keypress", function (e) {
        if (e.key === "Enter" && this.tagName !== "TEXTAREA") {
            e.preventDefault();
            addBookBtn.click();
        }
    });
});

/*=========================
    الإشعارات
=========================*/
function showNotification(message, type = "info") {
    const existing = document.querySelector(".notification");
    if (existing) existing.remove();

    const colors = {
        success: "#10b981",
        error: "#ef4444",
        info: "#2563eb"
    };

    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 9999;
        animation: popup 0.3s ease;
        font-size: 16px;
        max-width: 400px;
        direction: rtl;
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = "0";
        notification.style.transition = "opacity 0.5s";
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

/*=========================
    تحويل التقييم
=========================*/
function stars(number) {
    return "⭐".repeat(Math.min(number, 5));
}

/*=========================
    ✅ تحميل ملف PDF للكتاب
=========================*/
function downloadBookPDF(id) {
    const book = books.find(b => b.id === id);
    if (!book || !book.pdf) {
        showNotification(t('noPdf'), 'error');
        return;
    }

    const pdfSrc = dataURLtoBlobURL(book.pdf) || book.pdf;
    const safeName = (book.title || 'book').replace(/[^a-zA-Z0-9_\- ]/g, '_') + '.pdf';

    const a = document.createElement('a');
    a.href = pdfSrc;
    a.download = safeName;
    document.body.appendChild(a);
    a.click();
    a.remove();

    showNotification(t('pdfDownloaded', {title: book.title}), 'success');
}

/*=========================
    عرض الكتب مع زر إضافة إلى قائمة وزر إزالة من القائمة
=========================*/
function renderBooks() {
    let booksToShow = [...books];

    if (currentListFilter) {
        booksToShow = booksToShow.filter(book => book.list === currentListFilter);
    } else if (currentFilter === "favorites") {
        booksToShow = booksToShow.filter(book => book.favorite);
    } else if (currentFilter === "finished") {
        booksToShow = booksToShow.filter(book => book.status === "Finished");
    } else if (currentFilter === "want-to-read") {
        booksToShow = booksToShow.filter(book => book.status === "Want To Read");
    }

    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
    if (query) {
        booksToShow = booksToShow.filter(book =>
            book.title.toLowerCase().includes(query) ||
            book.author.toLowerCase().includes(query) ||
            (book.category && book.category.toLowerCase().includes(query))
        );
    }

    booksContainer.innerHTML = "";

    if (booksToShow.length === 0) {
        booksContainer.innerHTML = `
            <div class="empty-library">
                <h2>📚 ${t('noBooks')}</h2>
                <p>${query ? t('noSearchResults') : t('startAdding')}</p>
            </div>
        `;
        return;
    }

    booksToShow.forEach((book) => {
        const card = document.createElement("div");
        card.className = "book-card";

        let pdfBadge = "";
        if (book.pdf) {
            pdfBadge = `<span class="pdf-badge"><i class="fa-regular fa-file-pdf"></i> ${t('pdfBadge')}</span>`;
        }

        let listTag = "";
        if (book.list && book.list.trim() !== "") {
            listTag = `<span class="book-list-tag"><i class="fa-solid fa-list"></i> ${escapeHTML(book.list)}</span>`;
        }

        const hasPDF = book.pdf ? true : false;
        
        const pdfButton = hasPDF ? `
            <button class="open-pdf-btn" onclick="openPDFInNewPage('${book.id}')">
                <i class="fa-regular fa-file-pdf"></i> ${t('pdfBadge')}
            </button>
        ` : '';

        const downloadPdfButton = hasPDF ? `
            <button class="download-pdf-btn" onclick="downloadBookPDF('${book.id}')" title="${t('downloadPdf')}">
                <i class="fa-solid fa-download"></i>
            </button>
        ` : '';

        const openButton = hasPDF ? `
            <button class="open-book-btn" onclick="openPDFInNewPage('${book.id}')">
                <i class="fa-solid fa-book-open"></i> ${t('openBook')}
            </button>
        ` : `
            <button class="open-book-btn" onclick="openBookInfo('${book.id}')">
                <i class="fa-solid fa-book-open"></i> ${t('openBook')}
            </button>
        `;

        // ✅ قائمة الخيارات للقوائم
        const listOptions = customLists.length > 0 ? customLists.map(list => 
            `<option value="${escapeHTML(list)}">${escapeHTML(list)}</option>`
        ).join('') : `<option value="">${t('noLists')}</option>`;

        const currentList = book.list || "";

        // ✅ تحديد ما إذا كان الزر لإزالة من القائمة سيظهر
        const totalPagesForProgress = getBookTotalPages(book);
        const progressBlock = (book.pdf && book.currentPage > 0) ? `
            <div class="reading-progress-wrap">
                <div class="reading-progress-text">
                    <span>📖 ${t('readingProgress')}</span>
                    <span>${book.currentPage}${totalPagesForProgress ? ' / ' + totalPagesForProgress : ''}</span>
                </div>
                <div class="reading-progress-bar-bg">
                    <div class="reading-progress-bar-fill" style="width:${getReadingProgressPercent(book)}%;"></div>
                </div>
            </div>
        ` : '';

        const hasList = book.list && book.list.trim() !== "";
        const removeButton = hasList ? `
            <button class="remove-from-list-btn" data-book-id="${book.id}" data-list-name="${escapeHTML(book.list)}" style="padding:6px 12px;background:#ef4444;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px;white-space:nowrap;transition:0.3s;">
                <i class="fa-solid fa-xmark"></i> ${t('removeFromList')}
            </button>
        ` : '';

        card.innerHTML = `
            <div class="book-cover-wrapper">
                <img class="book-cover" src="${book.cover}" alt="${escapeHTML(book.title)}" 
                     onerror="this.src='https://placehold.co/300x450?text=📚+No+Cover'">
                ${pdfBadge}
            </div>
            <div class="book-info">
                <h3>${escapeHTML(book.title)}</h3>
                <p><strong>${t('author')}:</strong> ${escapeHTML(book.author)}</p>
                <p><strong>${t('year')}:</strong> ${escapeHTML(book.year) || "-"}</p>
                <p><strong>${t('category')}:</strong> ${escapeHTML(book.category) || "-"}</p>
                <p><strong>${t('pages')}:</strong> ${escapeHTML(book.pages) || "-"}</p>
                <p><strong>${t('status')}:</strong> ${tStatus(book.status)}</p>
                ${listTag}
                <div class="book-rating">${stars(book.rating)}</div>
                <div class="book-notes">${escapeHTML(book.notes) || ""}</div>
                ${progressBlock}
                <div class="book-actions">
                    ${openButton}
                    ${pdfButton}
                    ${downloadPdfButton}
                    <button class="edit-btn" onclick="openEdit('${book.id}')">✏️</button>
                    <button class="delete-btn" onclick="deleteBook('${book.id}')">🗑</button>
                    <button class="favorite-btn ${book.favorite ? 'active' : ''}" onclick="toggleFavorite('${book.id}')">
                        ${book.favorite ? '⭐' : '☆'}
                    </button>
                </div>
                <!-- ✅ قسم إدارة القوائم -->
                <div class="add-to-list-section" style="margin-top:10px;display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
                    <select class="add-to-list-select" data-book-id="${book.id}" style="flex:1;min-width:100px;padding:6px 10px;border:1px solid var(--border);border-radius:8px;background:var(--card-bg);color:var(--text);font-size:13px;">
                        <option value="">📋 ${t('selectList')}</option>
                        ${listOptions}
                    </select>
                    <button class="add-to-list-btn" data-book-id="${book.id}" style="padding:6px 12px;background:var(--main);color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px;white-space:nowrap;transition:0.3s;">
                        <i class="fa-solid fa-plus"></i> ${t('addToList')}
                    </button>
                    ${removeButton}
                </div>
            </div>
        `;

        booksContainer.appendChild(card);
    });

    // ربط أحداث أزرار الإضافة إلى القوائم
    document.querySelectorAll('.add-to-list-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const bookId = this.dataset.bookId;
            const select = document.querySelector(`.add-to-list-select[data-book-id="${bookId}"]`);
            if (select) {
                addBookToList(bookId, select.value);
            }
        });
    });

    // ✅ ربط أحداث أزرار الإزالة من القوائم
    document.querySelectorAll('.remove-from-list-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const bookId = this.dataset.bookId;
            const listName = this.dataset.listName;
            removeBookFromList(bookId, listName);
        });
    });

    // ربط أحداث الضغط على Enter في حقل اختيار القائمة
    document.querySelectorAll('.add-to-list-select').forEach(select => {
        select.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const bookId = this.dataset.bookId;
                addBookToList(bookId, this.value);
            }
        });
    });
}

/*=========================
    ✅ دالة إضافة كتاب إلى قائمة
=========================*/
async function addBookToList(bookId, listName) {
    if (!listName || listName === '') {
        showNotification(t('selectListPrompt'), 'error');
        return;
    }

    const book = books.find(b => b.id === bookId);
    if (!book) {
        showNotification(t('bookNotFound'), 'error');
        return;
    }

    // إذا كان الكتاب بالفعل في هذه القائمة
    if (book.list === listName) {
        showNotification(t('alreadyInList', {title: book.title, list: listName}), 'info');
        return;
    }

    // التحقق من وجود القائمة
    if (!customLists.includes(listName)) {
        showNotification(t('listNotFound', {list: listName}), 'error');
        return;
    }

    // تحديث القائمة
    book.list = listName;
    await saveBooksToDB();
    renderBooks();
    updateStatistics();
    renderLists();
    updateListSelect();
    showNotification(t('addedToList', {title: book.title, list: listName}), 'success');
}

/*=========================
    ✅ دالة إزالة كتاب من قائمة
=========================*/
async function removeBookFromList(bookId, listName) {
    if (!listName || listName === '') {
        showNotification(t('bookNotFound'), 'error');
        return;
    }

    const book = books.find(b => b.id === bookId);
    if (!book) {
        showNotification(t('bookNotFound'), 'error');
        return;
    }

    // التأكد من أن الكتاب في هذه القائمة
    if (book.list !== listName) {
        showNotification(t('notInList', {title: book.title, list: listName}), 'error');
        return;
    }

    // إزالة الكتاب من القائمة
    book.list = "";
    await saveBooksToDB();
    renderBooks();
    updateStatistics();
    renderLists();
    updateListSelect();
    showNotification(t('removedFromList', {title: book.title, list: listName}), 'success');
}

/*=========================
    ✅ فتح الكتاب في صفحة منفصلة
=========================*/
/*=========================
    ✅ فتح الكتاب في صفحة منفصلة - إصدار مُصلح
=========================*/
function openPDFInNewPage(id) {
    const book = books.find(b => b.id === id);
    if (!book) {
        showNotification(t('bookNotFound'), 'error');
        return;
    }

    if (!book.pdf) {
        showNotification(t('noPdf'), 'error');
        return;
    }

    const pdfSrc = dataURLtoBlobURL(book.pdf) || book.pdf;

    const newWindow = window.open('', '_blank');
    if (!newWindow) {
        showNotification(t('allowPopup'), 'error');
        return;
    }

    const startPage = (book.currentPage && book.currentPage > 0) ? book.currentPage : 1;
    const bookId = book.id;
    const bookTitle = escapeHTML(book.title);
    const dirAttr = currentLang === 'ar' ? 'rtl' : 'ltr';

    const vt = currentLang === 'en' ? {
        loading: 'Loading book...',
        loadError: 'Failed to load the PDF file.',
        pageLabel: 'Page',
        ofLabel: 'of',
        prev: 'Previous',
        next: 'Next',
        zoomIn: 'Zoom in',
        zoomOut: 'Zoom out',
        resumed: 'Resumed from page {page}'
    } : currentLang === 'ru' ? {
        loading: 'Загрузка книги...',
        loadError: 'Не удалось загрузить PDF файл.',
        pageLabel: 'Страница',
        ofLabel: 'из',
        prev: 'Назад',
        next: 'Вперёд',
        zoomIn: 'Увеличить',
        zoomOut: 'Уменьшить',
        resumed: 'Продолжено со страницы {page}'
    } : currentLang === 'zh' ? {
        loading: '正在加载图书...',
        loadError: '无法加载 PDF 文件。',
        pageLabel: '页码',
        ofLabel: '/',
        prev: '上一页',
        next: '下一页',
        zoomIn: '放大',
        zoomOut: '缩小',
        resumed: '已从第 {page} 页继续阅读'
    } : currentLang === 'es' ? {
        loading: 'Cargando libro...',
        loadError: 'No se pudo cargar el archivo PDF.',
        pageLabel: 'Página',
        ofLabel: 'de',
        prev: 'Anterior',
        next: 'Siguiente',
        zoomIn: 'Acercar',
        zoomOut: 'Alejar',
        resumed: 'Reanudado desde la página {page}'
    } : {
        loading: 'جاري تحميل الكتاب...',
        loadError: 'تعذر تحميل ملف PDF.',
        pageLabel: 'صفحة',
        ofLabel: 'من',
        prev: 'السابق',
        next: 'التالي',
        zoomIn: 'تكبير',
        zoomOut: 'تصغير',
        resumed: 'تم الاستكمال من الصفحة {page}'
    };

    const html = `
<!DOCTYPE html>
<html lang="${currentLang}" dir="${dirAttr}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${bookTitle}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        html, body { width: 100%; height: 100%; background: #1a1a1a; overflow: hidden; }
        .toolbar {
            position: fixed; top: 0; left: 0; right: 0; height: 56px; z-index: 10;
            background: #111827; color: #fff; display: flex; align-items: center;
            justify-content: space-between; padding: 0 16px; gap: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,.4);
        }
        .toolbar .title {
            font-size: 15px; opacity: .85; overflow: hidden; text-overflow: ellipsis;
            white-space: nowrap; max-width: 30%;
        }
        .toolbar .nav { display: flex; align-items: center; gap: 8px; }
        .toolbar button {
            background: #374151; color: #fff; border: none; border-radius: 8px;
            padding: 8px 14px; cursor: pointer; font-size: 14px; transition: .2s;
        }
        .toolbar button:hover { background: #4b5563; }
        .toolbar button:disabled { opacity: .4; cursor: not-allowed; }
        .toolbar .zoom-group { display: flex; align-items: center; gap: 4px; }
        .toolbar .zoom-group button { padding: 8px 12px; }
        .toolbar input[type=number] {
            width: 56px; text-align: center; padding: 6px 4px; border-radius: 6px;
            border: none; font-size: 14px;
        }
        .page-status { font-size: 13px; opacity: .85; display: flex; align-items: center; gap: 6px; }
        .viewer {
            position: absolute; top: 56px; left: 0; right: 0; bottom: 0;
            overflow-y: scroll; overflow-x: auto;
            background: #1a1a1a;
            scroll-behavior: smooth;
            direction: ltr;
        }
        .pages-container {
            display: flex; flex-direction: column; align-items: center;
            gap: 14px; padding: 20px 0 80px;
            min-height: 100%;
        }
        .page-wrap {
            position: relative; background: #fff;
            box-shadow: 0 5px 25px rgba(0,0,0,.5);
            flex-shrink: 0;
            transition: opacity .3s;
        }
        .page-wrap canvas { display: block; width: 100%; height: 100%; }
        .page-wrap .page-num-tag {
            position: absolute; bottom: 6px; ${currentLang === 'ar' ? 'left' : 'right'}: 6px;
            background: rgba(0,0,0,.55); color: #fff; font-size: 11px;
            padding: 2px 8px; border-radius: 10px; pointer-events: none;
        }
        .center-msg {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            color: #fff; text-align: center; gap: 12px;
        }
        .center-msg i { font-size: 40px; }
        .toast {
            position: fixed; bottom: 20px; ${currentLang === 'ar' ? 'right' : 'left'}: 20px;
            background: #10b981; color: #fff; padding: 10px 18px; border-radius: 10px;
            font-size: 13px; opacity: 0; transform: translateY(10px);
            transition: .3s; pointer-events: none; z-index: 20;
        }
        .toast.show { opacity: 1; transform: translateY(0); }
    </style>
</head>
<body>
    <div class="toolbar">
        <span class="title">📖 ${bookTitle}</span>
        <div class="nav">
            <button id="prevBtn"><i class="fa-solid fa-angle-${currentLang === 'ar' ? 'right' : 'left'}"></i> ${vt.prev}</button>
            <span class="page-status">
                ${vt.pageLabel}
                <input type="number" id="pageInput" min="1" value="${startPage}">
                ${vt.ofLabel} <span id="totalPages">-</span>
            </span>
            <button id="nextBtn">${vt.next} <i class="fa-solid fa-angle-${currentLang === 'ar' ? 'left' : 'right'}"></i></button>
            <div class="zoom-group">
                <button id="zoomOutBtn" title="${vt.zoomOut}"><i class="fa-solid fa-magnifying-glass-minus"></i></button>
                <button id="zoomInBtn" title="${vt.zoomIn}"><i class="fa-solid fa-magnifying-glass-plus"></i></button>
            </div>
        </div>
    </div>

    <div class="viewer" id="viewerWrap">
        <div class="center-msg" id="statusMsg">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <p>${vt.loading}</p>
        </div>
        <div class="pages-container" id="pagesContainer" style="display:none;"></div>
    </div>

    <div class="toast" id="toast"></div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    <script>
    (function () {
        const bookId = ${JSON.stringify(bookId)};
        const startPage = ${startPage};
        const pdfSrc = ${JSON.stringify(pdfSrc)};
        const opener = window.opener;

        pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const statusMsg = document.getElementById('statusMsg');
        const pageInput = document.getElementById('pageInput');
        const totalPagesEl = document.getElementById('totalPages');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const zoomInBtn = document.getElementById('zoomInBtn');
        const zoomOutBtn = document.getElementById('zoomOutBtn');
        const toast = document.getElementById('toast');
        const viewerWrap = document.getElementById('viewerWrap');
        const pagesContainer = document.getElementById('pagesContainer');

        let pdfDoc = null;
        let currentPage = startPage;
        let baseWidth = 0, baseHeight = 0;
        let scale = 1;
        let userZoom = 1;
        let saveTimer = null;
        let ignoreScrollUntil = 0;
        let lastSavedPage = startPage;
        let isLayouting = false;
        const pageEls = [];
        const renderedPages = new Set();
        const renderTasks = new Map();
        let visibilityObserver = null;
        const visibleRatios = new Map();

        function showToast(msg) {
            toast.textContent = msg;
            toast.classList.add('show');
            setTimeout(function () { toast.classList.remove('show'); }, 1800);
        }

        function clampPage(num) {
            if (!pdfDoc || !pdfDoc.numPages) return Math.max(1, parseInt(num, 10) || 1);
            const safe = parseInt(num, 10) || 1;
            return Math.min(pdfDoc.numPages, Math.max(1, safe));
        }

        /* ✅ حفظ التقدم بـ debounce 400ms لتجنب الكتابة المتكررة */
        function persistProgress(immediate, forcedPage) {
            if (!opener || opener.closed || typeof opener.saveReadingProgress !== 'function') return;

            const nextPage = clampPage(forcedPage ?? pageInput.value ?? currentPage ?? startPage);
            if (!Number.isInteger(lastSavedPage)) lastSavedPage = startPage;

            currentPage = nextPage;
            pageInput.value = nextPage;
            prevBtn.disabled = nextPage <= 1;
            nextBtn.disabled = pdfDoc && nextPage >= pdfDoc.numPages;

            if (!immediate && nextPage === lastSavedPage) return;

            const doSave = function () {
                try {
                    lastSavedPage = nextPage;
                    const saveStamp = Date.now();
                    opener.saveReadingProgress(bookId, nextPage, pdfDoc ? pdfDoc.numPages : null, saveStamp);
                } catch (e) { console.error(e); }
            };

            clearTimeout(saveTimer);
            if (immediate) {
                doSave();
            } else {
                saveTimer = setTimeout(doSave, 400);
            }
        }

        function setCurrentPage(num, fromScroll) {
            const nextPage = clampPage(num);
            if (nextPage === currentPage && pageInput.value === String(nextPage)) return;
            currentPage = nextPage;
            pageInput.value = nextPage;
            prevBtn.disabled = nextPage <= 1;
            nextBtn.disabled = pdfDoc && nextPage >= pdfDoc.numPages;
            persistProgress(false, nextPage);
        }

        /* ✅ عرض صفحة واحدة داخل الـ canvas الخاص بها */
        function renderPageInto(num) {
            if (!pdfDoc || renderedPages.has(num) || renderTasks.has(num)) return;
            renderedPages.add(num);
            pdfDoc.getPage(num).then(function (page) {
                const wrap = pageEls[num - 1];
                if (!wrap) return;
                const canvas = wrap.querySelector('canvas');
                const ctx = canvas.getContext('2d');
                const viewport = page.getViewport({ scale: scale * 1.5 });
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const task = page.render({ canvasContext: ctx, viewport: viewport });
                renderTasks.set(num, task);
                task.promise.then(function () {
                    renderTasks.delete(num);
                }).catch(function () { renderTasks.delete(num); });
            });
        }

        /* ✅ بناء/إعادة بناء كل صفحات المستند */
        function layoutPages() {
            isLayouting = true;
            pagesContainer.innerHTML = '';
            pageEls.length = 0;
            renderedPages.clear();
            visibleRatios.clear();

            const containerWidth = viewerWrap.clientWidth - 40;
            scale = Math.max(0.3, Math.min(3, (containerWidth / baseWidth) * userZoom));
            const w = Math.round(baseWidth * scale);
            const h = Math.round(baseHeight * scale);

            for (let i = 1; i <= pdfDoc.numPages; i++) {
                const wrap = document.createElement('div');
                wrap.className = 'page-wrap';
                wrap.dataset.page = i;
                wrap.style.width = w + 'px';
                wrap.style.height = h + 'px';
                const canvas = document.createElement('canvas');
                wrap.appendChild(canvas);
                const tag = document.createElement('span');
                tag.className = 'page-num-tag';
                tag.textContent = i;
                wrap.appendChild(tag);
                pagesContainer.appendChild(wrap);
                pageEls.push(wrap);
            }

            if (visibilityObserver) visibilityObserver.disconnect();
            visibilityObserver = new IntersectionObserver(handleIntersections, {
                root: viewerWrap,
                rootMargin: '800px 0px',
                threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0]
            });
            pageEls.forEach(function (el) { visibilityObserver.observe(el); });
            isLayouting = false;
        }

        /* ✅ تحديد أفضل صفحة مرئية: الأولوية لأعلى نسبة ظهور، ثم الأقرب للمركز */
        function resolveBestVisiblePage() {
            if (!pdfDoc || !pageEls.length) return null;

            let bestPage = currentPage || 1;
            let bestScore = -1;

            const viewerRect = viewerWrap.getBoundingClientRect();
            const viewportCenter = viewerRect.top + (viewerRect.height / 2);

            pageEls.forEach(function (el, index) {
                const num = index + 1;
                const ratio = visibleRatios.get(num) || 0;
                const rect = el.getBoundingClientRect();
                const pageCenter = rect.top + (rect.height / 2);
                const distance = Math.abs(pageCenter - viewportCenter);

                /* الوزن: نسبة الظهور أهم بكثير من المسافة */
                const score = (ratio * 10000) - (distance * 0.01);
                if (score > bestScore) {
                    bestScore = score;
                    bestPage = num;
                }
            });

            return Math.max(1, Math.min(pdfDoc.numPages, bestPage));
        }

        function handleIntersections(entries) {
            if (isLayouting) return;

            entries.forEach(function (entry) {
                const num = parseInt(entry.target.dataset.page);
                if (entry.isIntersecting) {
                    renderPageInto(num);
                    visibleRatios.set(num, entry.intersectionRatio);
                } else {
                    visibleRatios.delete(num);
                }
            });

            if (Date.now() <= ignoreScrollUntil) return;

            const bestPage = resolveBestVisiblePage();
            if (bestPage && bestPage !== currentPage) {
                setCurrentPage(bestPage, true);
            }
        }

        /* ✅ التمرير البرمجي: نستخدم scrollTo بدلاً من scrollIntoView للتحكم الأفضل */
        function scrollToPage(num) {
            if (!pdfDoc) return;
            num = clampPage(num);
            const el = pageEls[num - 1];
            if (!el) return;

            /* نمنع مراقب الظهور من التقاط أي صفحة أثناء التمرير ولفترة أطول (900ms) */
            ignoreScrollUntil = Date.now() + 900;

            const targetTop = el.offsetTop - 20; /* 20px هامش علوي */
            viewerWrap.scrollTo({ top: targetTop, behavior: 'smooth' });

            setCurrentPage(num, false);

            /* نتأكد من إعادة التفعيل بعد استقرار التمرير */
            setTimeout(function () {
                ignoreScrollUntil = 0;
                /* تحديث نهائي للصفحة الحالية بعد استقرار التمرير */
                const finalPage = resolveBestVisiblePage();
                if (finalPage && finalPage !== currentPage) {
                    setCurrentPage(finalPage, true);
                }
            }, 950);
        }

        prevBtn.addEventListener('click', function () { scrollToPage(currentPage - 1); });
        nextBtn.addEventListener('click', function () { scrollToPage(currentPage + 1); });
        pageInput.addEventListener('change', function () {
            scrollToPage(parseInt(pageInput.value) || 1);
        });

        document.addEventListener('keydown', function (e) {
            if (e.target === pageInput) return;
            if (e.key === 'ArrowLeft') scrollToPage(currentPage - 1);
            else if (e.key === 'ArrowRight') scrollToPage(currentPage + 1);
            else if (e.key === 'PageUp') viewerWrap.scrollBy({ top: -viewerWrap.clientHeight * 0.9, behavior: 'smooth' });
            else if (e.key === 'PageDown') viewerWrap.scrollBy({ top: viewerWrap.clientHeight * 0.9, behavior: 'smooth' });
        });

        function applyZoom(factor) {
            if (!pdfDoc) return;
            userZoom = Math.max(0.5, Math.min(3, userZoom * factor));
            const target = clampPage(currentPage);

            ignoreScrollUntil = Date.now() + 1000;
            layoutPages();
            renderPageInto(target);

            /* ✅ نحسب الموضع الدقيق للصفحة المستهدفة وننتقل إليه مباشرة */
            requestAnimationFrame(function () {
                const el = pageEls[target - 1];
                if (el) {
                    viewerWrap.scrollTo({ top: el.offsetTop - 20, behavior: 'auto' });
                }
                setCurrentPage(target, false);
                setTimeout(function () { ignoreScrollUntil = 0; }, 400);
            });
        }
        zoomInBtn.addEventListener('click', function () { applyZoom(1.2); });
        zoomOutBtn.addEventListener('click', function () { applyZoom(1 / 1.2); });

        let resizeTimer = null;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () { applyZoom(1); }, 300);
        });

        /* ✅ مراقبة التمرير اليدوي: نستخدم best visible page */
        viewerWrap.addEventListener('scroll', function () {
            if (Date.now() <= ignoreScrollUntil || !pdfDoc || isLayouting) return;
            const bestPage = resolveBestVisiblePage();
            if (bestPage && bestPage !== currentPage) {
                setCurrentPage(bestPage, true);
            }
        }, { passive: true });

        pdfjsLib.getDocument(pdfSrc).promise.then(function (doc) {
            pdfDoc = doc;
            totalPagesEl.textContent = doc.numPages;
            pageInput.max = doc.numPages;

            return doc.getPage(1).then(function (firstPage) {
                const vp = firstPage.getViewport({ scale: 1 });
                baseWidth = vp.width;
                baseHeight = vp.height;

                statusMsg.style.display = 'none';
                pagesContainer.style.display = 'flex';

                /* ✅ نبدأ بإيقاف مراقب الظهور تماماً حتى ننتهي من الانتقال للصفحة المحفوظة */
                ignoreScrollUntil = Date.now() + 2000;

                layoutPages();

                const initial = clampPage(startPage);
                currentPage = initial;
                pageInput.value = initial;
                prevBtn.disabled = initial <= 1;
                nextBtn.disabled = initial >= doc.numPages;
                renderPageInto(initial);

                /* ✅ ننتظر رسم العناصر ثم ننتقل للصفحة المطلوبة */
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        const el = pageEls[initial - 1];
                        if (el) {
                            viewerWrap.scrollTo({ top: el.offsetTop - 20, behavior: 'auto' });
                        }
                        renderPageInto(initial);
                        /* نسمح للمراقب بالعمل بعد استقرار كل شيء */
                        setTimeout(function () {
                            ignoreScrollUntil = 0;
                            /* تحديث نهائي */
                            const finalPage = resolveBestVisiblePage();
                            if (finalPage && finalPage !== currentPage) {
                                setCurrentPage(finalPage, true);
                            }
                        }, 500);
                    });
                });

                if (startPage > 1 && startPage <= doc.numPages) {
                    showToast('${vt.resumed}'.replace('{page}', startPage));
                }
            });
        }).catch(function (err) {
            console.error(err);
            statusMsg.innerHTML = '<i class="fa-regular fa-file-pdf"></i><p>${vt.loadError}</p>';
        });

        /* ✅ حفظ فوري عند إغلاق النافذة */
        window.addEventListener('beforeunload', function () { persistProgress(true); });
        window.addEventListener('pagehide', function () { persistProgress(true); });
        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'hidden') persistProgress(true);
        });
    })();
    <\/script>
</body>
</html>
    `;

    newWindow.document.write(html);
    newWindow.document.close();
}
function openBookInfo(id) {
    const book = books.find(b => b.id === id);
    if (!book) {
        showNotification(t('bookNotFound'), 'error');
        return;
    }

    const newWindow = window.open('', '_blank');
    if (!newWindow) {
        showNotification(t('allowPopup'), 'error');
        return;
    }

    let statusClass = 'want-to-read';
    let statusText = t('statusWantToRead');
    if (book.status === 'Finished') {
        statusClass = 'finished';
        statusText = '✅ ' + t('statusFinished');
    } else if (book.status === 'Reading') {
        statusClass = 'reading';
        statusText = '📖 ' + t('statusReading');
    }

    const bookInfo = `${book.author} - ${book.year || 'N/A'}`;
    const pdfDownloadSrc = book.pdf ? (dataURLtoBlobURL(book.pdf) || book.pdf) : null;

    const html = `
<!DOCTYPE html>
<html lang="${currentLang}" dir="${currentLang === 'ar' ? 'rtl' : 'ltr'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${t('bookInfoTitle', {title: book.title})}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        body { background: #f0f4f8; min-height: 100vh; padding: 30px; }
        .container { max-width: 1000px; margin: 0 auto; }
        .back-btn {
            display: inline-flex; align-items: center; gap: 10px;
            padding: 12px 25px; background: #2563eb; color: white;
            border: none; border-radius: 10px; cursor: pointer;
            font-size: 16px; transition: 0.3s; margin-bottom: 25px;
        }
        .back-btn:hover { background: #1d4ed8; transform: translateX(-5px); }
        .book-view {
            background: white; border-radius: 20px; padding: 35px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }
        .book-header {
            display: flex; gap: 40px; align-items: flex-start;
            flex-wrap: wrap; margin-bottom: 30px;
        }
        .book-cover {
            width: 280px; height: 400px; object-fit: cover;
            border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.15);
            background: #ddd;
        }
        .book-info { flex: 1; min-width: 280px; }
        .book-info h1 { font-size: 34px; margin-bottom: 8px; color: #1f2937; }
        .book-info .author { font-size: 20px; color: #6b7280; margin-bottom: 15px; }
        .status-badge {
            display: inline-block; padding: 6px 18px; border-radius: 20px;
            font-size: 14px; font-weight: 600; margin-bottom: 15px;
        }
        .status-badge.finished { background: #10b981; color: white; }
        .status-badge.reading { background: #f59e0b; color: white; }
        .status-badge.want-to-read { background: #3b82f6; color: white; }
        .book-details {
            display: grid; grid-template-columns: 1fr 1fr;
            gap: 12px 30px; margin: 20px 0; padding: 20px;
            background: #f8fafc; border-radius: 12px;
        }
        .book-details .item {
            display: flex; justify-content: space-between;
            padding: 5px 0; border-bottom: 1px solid #e5e7eb;
        }
        .book-details .item:last-child { border-bottom: none; }
        .book-details .label { color: #6b7280; font-weight: 500; }
        .book-details .value { color: #1f2937; font-weight: 600; }
        .book-rating { font-size: 30px; margin: 15px 0; }
        .book-notes {
            background: #f8fafc; padding: 20px; border-radius: 12px;
            margin: 20px 0; border-right: 4px solid #2563eb;
            color: #374151; line-height: 1.8;
        }
        .book-notes h3 { color: #1f2937; margin-bottom: 10px; font-size: 16px; }
        .book-path {
            background: #fef3c7; padding: 15px 20px; border-radius: 12px;
            margin: 20px 0; border-right: 4px solid #f59e0b;
            direction: ltr; text-align: left;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: #92400e;
            word-break: break-all;
        }
        .book-path .path-label {
            display: block; font-weight: 600; margin-bottom: 8px;
            color: #78350f; font-family: 'Segoe UI', sans-serif;
            direction: rtl;
        }
        .list-tag {
            display: inline-block; background: #2563eb; color: white;
            padding: 4px 15px; border-radius: 20px; font-size: 14px;
            margin: 5px 0 10px 0;
        }
        .no-pdf {
            text-align: center; padding: 40px 20px;
            background: #f8fafc; border-radius: 12px; color: #6b7280;
        }
        .no-pdf i { font-size: 50px; color: #d1d5db; margin-bottom: 15px; }
        @media (max-width: 700px) {
            .book-header { flex-direction: column; align-items: center; text-align: center; }
            .book-cover { width: 200px; height: 280px; }
            .book-details { grid-template-columns: 1fr; }
            body { padding: 15px; }
            .book-view { padding: 20px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <button class="back-btn" onclick="window.close()">
            <i class="fa-solid fa-arrow-${currentLang === 'ar' ? 'right' : 'left'}"></i> ${t('returnHome')}
        </button>
        
        <div class="book-view">
            <div class="book-header">
                <img class="book-cover" src="${book.cover}" alt="${escapeHTML(book.title)}" 
                     onerror="this.src='https://placehold.co/280x400?text=📚+No+Cover'">
                <div class="book-info">
                    <h1>${escapeHTML(book.title)}</h1>
                    <p class="author"><i class="fa-regular fa-user"></i> ${escapeHTML(book.author)}</p>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                    ${book.list ? `<div class="list-tag"><i class="fa-solid fa-list"></i> ${escapeHTML(book.list)}</div>` : ''}
                    
                    <div class="book-details">
                        <div class="item"><span class="label">${t('bookDetailYear')}</span><span class="value">${escapeHTML(book.year) || '-'}</span></div>
                        <div class="item"><span class="label">${t('bookDetailPages')}</span><span class="value">${escapeHTML(book.pages) || '-'}</span></div>
                        <div class="item"><span class="label">${t('bookDetailCategory')}</span><span class="value">${escapeHTML(book.category) || '-'}</span></div>
                        <div class="item"><span class="label">${t('bookDetailRating')}</span><span class="value">${stars(book.rating)}</span></div>
                        <div class="item"><span class="label">${t('bookDetailPath')}</span><span class="value" style="font-size:12px;">${escapeHTML(bookInfo)}</span></div>
                    </div>
                    
                    <div class="book-rating">${stars(book.rating)}</div>
                </div>
            </div>
            
            ${book.notes ? `
                <div class="book-notes">
                    <h3><i class="fa-regular fa-pen-to-square"></i> ${t('bookNotesSection')}</h3>
                    <p>${escapeHTML(book.notes)}</p>
                </div>
            ` : ''}
            
            <div class="book-path">
                <span class="path-label">${t('bookPathLabel')}</span>
                ${escapeHTML(bookInfo)}
            </div>
            
            ${book.pdf ? `
                <div style="margin-top:20px;text-align:center;">
                    <a href="${pdfDownloadSrc}" download="${escapeHTML(book.title).replace(/[^a-zA-Z0-9_\- ]/g, '_')}.pdf" style="display:inline-block;padding:12px 30px;background:#2563eb;color:white;border-radius:10px;text-decoration:none;">
                        <i class="fa-solid fa-download"></i> ${t('downloadPdf')}
                    </a>
                </div>
            ` : `
                <div class="no-pdf">
                    <i class="fa-regular fa-file-pdf"></i>
                    <p>${t('noPdfFile')}</p>
                </div>
            `}
        </div>
    </div>
</body>
</html>
    `;

    newWindow.document.write(html);
    newWindow.document.close();
}

/*=========================
    تبديل المفضلة
=========================*/
async function toggleFavorite(id) {
    const book = books.find(b => b.id === id);
    if (!book) return;
    book.favorite = !book.favorite;
    await saveBooksToDB();
    renderBooks();
    updateStatistics();
}

/*=========================
    الإحصائيات
=========================*/
function updateStatistics() {
    booksCount.textContent = books.length;
    favoriteCount.textContent = books.filter(book => book.favorite).length;
    readCount.textContent = books.filter(book => book.status === "Finished").length;
    waitingCount.textContent = books.filter(book => book.status === "Want To Read").length;
}

/*=========================
    حذف كتاب
=========================*/
async function deleteBook(id) {
    if (confirm(t('confirmDelete'))) {
        const book = books.find(b => b.id === id);
        if (!book) return;
        
        books = books.filter(b => b.id !== id);
        await db.deleteBook(id);
        renderBooks();
        updateStatistics();
        showNotification(t('bookDeleted', {title: book.title}), "error");
    }
}

/*=========================
    ✅ تعديل كتاب
=========================*/
document.querySelectorAll(".star").forEach(star => {
    star.addEventListener("click", function () {
        const value = parseInt(this.dataset.value);
        document.querySelectorAll(".star").forEach(s => {
            s.classList.toggle("active", parseInt(s.dataset.value) <= value);
        });
        document.getElementById("editRating").value = value;
    });

    star.addEventListener("mouseenter", function () {
        const value = parseInt(this.dataset.value);
        document.querySelectorAll(".star").forEach(s => {
            s.classList.toggle("hover", parseInt(s.dataset.value) <= value);
        });
    });

    star.addEventListener("mouseleave", function () {
        document.querySelectorAll(".star").forEach(s => s.classList.remove("hover"));
    });
});

function openEdit(id) {
    const book = books.find(b => b.id === id);
    if (!book) return;

    editIndex = id;

    editTitle.value = book.title || "";
    editAuthor.value = book.author || "";
    editYear.value = book.year || "";
    editPages.value = book.pages || "";
    editCategory.value = book.category || "";
    editStatus.value = book.status || "Want To Read";
    editNotes.value = book.notes || "";
    editCoverPreview.src = book.cover || "https://placehold.co/300x450?text=📚+No+Cover";
    editCover.value = "";
    editPdfFile.value = "";

    if (book.pdf) {
        const sizeInMB = (book.pdf.length / 1024 / 1024).toFixed(2);
        currentPdfName.textContent = `${t('currentPdfAttached')} (${sizeInMB} MB)`;
        currentPdfName.style.color = "#10b981";
    } else {
        currentPdfName.textContent = "❌ " + t('currentPdfNone');
        currentPdfName.style.color = "#ef4444";
    }

    const rating = book.rating || 1;
    document.getElementById("editRating").value = rating;
    document.querySelectorAll(".star").forEach(s => {
        s.classList.toggle("active", parseInt(s.dataset.value) <= rating);
    });

    addListSelectToEdit(book.list);

    editModal.classList.add("show");
}

function addListSelectToEdit(currentList) {
    let existingSelect = document.getElementById('editListSelect');
    if (!existingSelect) {
        const editModalContent = document.querySelector('.modal-content');
        const editActions = document.querySelector('.edit-actions');
        
        const selectWrapper = document.createElement('div');
        selectWrapper.style.marginBottom = '12px';
        
        const label = document.createElement('label');
        label.textContent = '📋 ' + t('listLabel');
        label.style.display = 'block';
        label.style.marginBottom = '6px';
        label.style.fontWeight = '600';
        label.style.color = 'var(--text)';
        
        const select = document.createElement('select');
        select.id = 'editListSelect';
        select.style.width = '100%';
        select.style.padding = '12px';
        select.style.border = '1px solid var(--border)';
        select.style.borderRadius = '10px';
        select.style.background = 'var(--background)';
        select.style.color = 'var(--text)';
        
        selectWrapper.appendChild(label);
        selectWrapper.appendChild(select);
        
        editModalContent.insertBefore(selectWrapper, editActions);
        updateEditListSelect(currentList);
    } else {
        updateEditListSelect(currentList);
    }
}

function updateEditListSelect(currentList) {
    const select = document.getElementById('editListSelect');
    if (!select) return;
    
    const currentValue = currentList || "";
    select.innerHTML = `<option value="">${t('noList')}</option>`;
    customLists.forEach(list => {
        const option = document.createElement('option');
        option.value = list;
        option.textContent = list;
        if (list === currentValue) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    if (currentValue && !customLists.includes(currentValue)) {
        const option = document.createElement('option');
        option.value = currentValue;
        option.textContent = currentValue + ' ' + t('overwriteList');
        option.selected = true;
        select.appendChild(option);
    }
}

saveEditBtn.addEventListener("click", async function () {
    if (editIndex === -1 || !editIndex) {
        showNotification(t('bookNotFound'), "error");
        return;
    }

    try {
        const book = books.find(b => b.id === editIndex);
        if (!book) return;

        book.title = editTitle.value.trim() || book.title;
        book.author = editAuthor.value.trim() || book.author;
        book.year = editYear.value || "";
        book.pages = editPages.value || "";
        book.category = editCategory.value || "";
        book.status = editStatus.value || "Want To Read";
        book.notes = editNotes.value || "";
        book.rating = parseInt(document.getElementById("editRating").value) || 1;

        const editListSelect = document.getElementById('editListSelect');
        if (editListSelect) {
            book.list = editListSelect.value || "";
        }

        const coverFile = editCover.files ? editCover.files[0] : null;
        if (coverFile && coverFile.type.startsWith("image/")) {
            const newCover = await readCover(coverFile);
            book.cover = newCover;
        }

        const pdfFile = editPdfFile.files ? editPdfFile.files[0] : null;
        if (pdfFile && pdfFile.type === "application/pdf") {
            const newPdf = await readPDFFile(pdfFile);
            if (newPdf) {
                book.pdf = newPdf;
                showNotification(t('pdfUpdated'), "success");
            }
        }

        await db.updateBook(book);
        renderBooks();
        updateStatistics();
        closeEditModal();
        showNotification(t('bookUpdated'), "success");
    } catch (error) {
        console.error("❌ خطأ في التعديل:", error);
        showNotification(t('bookUpdateError'), "error");
    }
});

cancelEditBtn.addEventListener("click", closeEditModal);

function closeEditModal() {
    editModal.classList.remove("show");
    editIndex = -1;
    editCover.value = "";
    editPdfFile.value = "";
}

editModal.addEventListener("click", function (e) {
    if (e.target === this) {
        closeEditModal();
    }
});

editCover.addEventListener("change", function (e) {
    const file = e.target.files ? e.target.files[0] : null;
    if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = function (ev) {
            editCoverPreview.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    }
});

editPdfFile.addEventListener("change", function (e) {
    const file = e.target.files ? e.target.files[0] : null;
    if (file && file.type === "application/pdf") {
        const sizeInMB = (file.size / 1024 / 1024).toFixed(2);
        currentPdfName.textContent = `📄 ${file.name} (${sizeInMB} MB)`;
        currentPdfName.style.color = "#f59e0b";
    } else if (file) {
        currentPdfName.textContent = t('selectValidPdf');
        currentPdfName.style.color = "#ef4444";
    }
});

/*=========================
    البحث
=========================*/
searchInput?.addEventListener("input", function () {
    renderBooks();
});

document.getElementById("searchBtn")?.addEventListener("click", function () {
    renderBooks();
});

/*=========================
    فلترة القائمة الجانبية
=========================*/
document.querySelectorAll(".sidebar ul li").forEach(item => {
    item.addEventListener("click", function () {
        document.querySelectorAll(".sidebar ul li").forEach(li => li.classList.remove("active"));
        this.classList.add("active");

        currentFilter = this.dataset.filter || "all";
        currentListFilter = null;

        document.querySelectorAll(".list-item").forEach(li => li.classList.remove("active"));

        renderBooks();
    });
});

/*=========================
    القوائم المخصصة
=========================*/
function renderLists() {
    const container = document.getElementById("customListsContainer");
    if (!container) return;
    container.innerHTML = "";

    customLists.forEach(list => {
        const item = document.createElement("div");
        item.className = "list-item";
        if (currentListFilter === list) {
            item.classList.add("active");
        }
        const count = books.filter(b => b.list === list).length;
        item.innerHTML = `
            <i class="fa-solid fa-list-ul"></i>
            <span>${escapeHTML(list)}</span>
            <span class="list-count">(${count})</span>
            <button class="delete-list" data-list-name="${escapeHTML(list)}"><i class="fa-solid fa-xmark"></i></button>
        `;
        item.addEventListener("click", function (e) {
            if (e.target.closest(".delete-list")) return;
            document.querySelectorAll(".list-item").forEach(li => li.classList.remove("active"));
            this.classList.add("active");
            document.querySelectorAll(".sidebar ul li").forEach(li => li.classList.remove("active"));

            currentListFilter = list;
            currentFilter = "all";
            renderBooks();
        });

        const delBtn = item.querySelector('.delete-list');
        if (delBtn) {
            delBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                deleteList(this.dataset.listName);
            });
        }

        container.appendChild(item);
    });
}

function updateListSelect() {
    const select = document.getElementById("bookList");
    if (!select) return;
    const currentValue = select.value;
    select.innerHTML = `<option value="">${t('noList')}</option>`;
    customLists.forEach(list => {
        const option = document.createElement("option");
        option.value = list;
        option.textContent = list;
        select.appendChild(option);
    });
    if (currentValue && customLists.includes(currentValue)) {
        select.value = currentValue;
    }
    
    const editSelect = document.getElementById('editListSelect');
    if (editSelect) {
        const editCurrentValue = editSelect.value;
        editSelect.innerHTML = `<option value="">${t('noList')}</option>`;
        customLists.forEach(list => {
            const option = document.createElement("option");
            option.value = list;
            option.textContent = list;
            editSelect.appendChild(option);
        });
        if (editCurrentValue && customLists.includes(editCurrentValue)) {
            editSelect.value = editCurrentValue;
        }
    }
}

document.getElementById("addListBtn")?.addEventListener("click", async function () {
    if (isLoading) {
        showNotification(t('waitLoading'), 'info');
        return;
    }

    const input = document.getElementById("newListName");
    const name = input.value.trim();
    if (!name) {
        showNotification(t('enterListName'), "error");
        return;
    }
    if (customLists.includes(name)) {
        showNotification(t('listExists'), "error");
        return;
    }
    customLists.push(name);
    await saveListsToDB();
    renderLists();
    updateListSelect();
    input.value = "";
    showNotification(t('listCreated', {list: name}), "success");
});

document.getElementById("newListName")?.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        document.getElementById("addListBtn").click();
    }
});

async function deleteList(listName) {
    if (!confirm(t('confirmDeleteList', {list: listName}))) return;

    books.forEach(book => {
        if (book.list === listName) {
            book.list = "";
        }
    });

    customLists = customLists.filter(l => l !== listName);
    await saveListsToDB();
    await saveBooksToDB();

    if (currentListFilter === listName) {
        currentListFilter = null;
    }

    renderLists();
    updateListSelect();
    renderBooks();
    updateStatistics();
    showNotification(t('listDeleted', {list: listName}), "error");
}

/*=========================
    الثيمات
=========================*/
// ✅ ملحوظة: الكود القديم اللي كان بيدور على كل ".theme-btn" اتشال من هنا،
// لأن أزرار "تصدير/استيراد/إضافة ثيم" بقت بتستخدم نفس الكلاس "theme-btn"
// وكان بيعمل setAttribute("data-theme", undefined) لما تدوس عليهم بالغلط،
// وده كان بيمسح الثيم الحالي. اختيار الثيمات دلوقتي بالكامل عن طريق
// renderThemeList() والكروت اللي بترندر جوه #themeList (تحت فى الكود).
const savedTheme = localStorage.getItem("theme") || "light";
if (!savedTheme.startsWith('custom:')) {
    document.documentElement.setAttribute("data-theme", savedTheme);
}

// Theme modal logic
const createThemeBtn = document.getElementById('createThemeBtn');
const themeModal = document.getElementById('themeModal');
const saveThemeBtn = document.getElementById('saveThemeBtn');
const cancelThemeBtn = document.getElementById('cancelThemeBtn');
let editingThemeName = null;

// ✅ معاينة حية لألوان الثيم أثناء التعديل/الإنشاء
const THEME_COLOR_FIELDS = ['themeMain', 'themeBackground', 'themeSidebar', 'themeText', 'themeCard'];

function getContrastTextColor(hex) {
    hex = (hex || '#000000').replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.55 ? '#111111' : '#ffffff';
}

function updateColorPreview(inputId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(inputId + 'Preview');
    if (!input || !preview) return;
    const color = input.value;
    preview.style.backgroundColor = color;
    preview.style.color = getContrastTextColor(color);
    preview.textContent = color;
}

THEME_COLOR_FIELDS.forEach(id => {
    const input = document.getElementById(id);
    input?.addEventListener('input', () => updateColorPreview(id));
});

function openThemeModal(theme) {
    const header = themeModal.querySelector('h2');
    if (theme) {
        editingThemeName = theme.name;
        header.innerHTML = '<i class="fa-solid fa-palette"></i> ' + t('editThemeTitle');
        document.getElementById('themeName').value = theme.name;
        document.getElementById('themeMain').value = theme.vars['--main'] || '#2563eb';
        document.getElementById('themeBackground').value = theme.vars['--background'] || '#eef2f7';
        document.getElementById('themeSidebar').value = theme.vars['--sidebar'] || '#111827';
        document.getElementById('themeText').value = theme.vars['--text'] || '#1f2937';
        document.getElementById('themeCard').value = theme.vars['--card-bg'] || '#ffffff';
    } else {
        editingThemeName = null;
        header.innerHTML = '<i class="fa-solid fa-palette"></i> ' + t('createThemeTitle');
        document.getElementById('themeName').value = '';
        document.getElementById('themeMain').value = '#2563eb';
        document.getElementById('themeBackground').value = '#eef2f7';
        document.getElementById('themeSidebar').value = '#111827';
        document.getElementById('themeText').value = '#1f2937';
        document.getElementById('themeCard').value = '#ffffff';
    }
    THEME_COLOR_FIELDS.forEach(id => updateColorPreview(id));
    themeModal.classList.add('show');
}

function closeThemeModal() {
    editingThemeName = null;
    themeModal.classList.remove('show');
}

createThemeBtn?.addEventListener('click', function () {
    openThemeModal();
});

cancelThemeBtn?.addEventListener('click', function () {
    closeThemeModal();
});

// Save custom theme (create or update)
saveThemeBtn?.addEventListener('click', function () {
    const name = document.getElementById('themeName').value.trim();
    const main = document.getElementById('themeMain').value;
    const background = document.getElementById('themeBackground').value;
    const sidebar = document.getElementById('themeSidebar').value;
    const text = document.getElementById('themeText').value;
    const card = document.getElementById('themeCard').value;

    if (!name) {
        showNotification(t('enterThemeName'), 'error');
        return;
    }

    const stored = JSON.parse(localStorage.getItem('customThemes') || '[]');
    const themeObj = { name, vars: { '--main': main, '--background': background, '--sidebar': sidebar, '--text': text, '--card-bg': card } };

    // If editing an existing theme (editingThemeName set), replace it
    if (editingThemeName) {
        if (name !== editingThemeName) {
            const conflict = stored.find(t => t.name === name);
            if (conflict) {
                showNotification(t('themeExists', {name: name}), 'error');
                return;
            }
        }
        const idx = stored.findIndex(t => t.name === editingThemeName);
        if (idx >= 0) stored[idx] = themeObj;
        else stored.push(themeObj);
    } else {
        // overwrite if same name
        const idx = stored.findIndex(t => t.name === name);
        if (idx >= 0) stored[idx] = themeObj; else stored.push(themeObj);
    }

    localStorage.setItem('customThemes', JSON.stringify(stored));
    applyCustomTheme(themeObj);
    renderThemeList();
    showNotification(t('themeSaved'), 'success');
    closeThemeModal();
});

function applyCustomTheme(themeObj) {
    const vars = themeObj.vars || {};
    Object.keys(vars).forEach(key => {
        document.documentElement.style.setProperty(key, vars[key]);
    });
}

// ✅ بتشيل أي ألوان مخصصة كانت متحطوطة كـ inline style على <html>،
// عشان لما ترجع لثيم جاهز، ألوانه تظهر صح بدل ما تفضل ألوان الثيم المخصص عالقة
const CUSTOM_THEME_VAR_KEYS = ['--main', '--background', '--sidebar', '--text', '--card-bg'];
function clearCustomThemeVars() {
    CUSTOM_THEME_VAR_KEYS.forEach(key => {
        document.documentElement.style.removeProperty(key);
    });
}

function cssEscape(str) {
    return str.replace(/"|\\/g, '');
}

// load custom themes on startup
(function loadCustomThemes() {
    const stored = JSON.parse(localStorage.getItem('customThemes') || '[]');

    // If saved theme is a custom one, apply it
    const saved = localStorage.getItem('theme');
    if (saved && saved.startsWith('custom:')) {
        const name = saved.split(':')[1];
        const themeObj = stored.find(x => x.name === name);
        if (themeObj) applyCustomTheme(themeObj);
    }
})();

// Render theme list (built-in + custom) as rectangular cards
function renderThemeList() {
    const container = document.getElementById('themeList');
    if (!container) return;
    container.innerHTML = '';

    const builtIn = [
        { key: 'light', icon: 'fa-regular fa-sun', name: t('themeLight') },
        { key: 'dark', icon: 'fa-regular fa-moon', name: t('themeDark') },
        { key: 'blue', icon: 'fa-solid fa-droplet', name: t('themeBlue') },
        { key: 'green', icon: 'fa-solid fa-leaf', name: t('themeGreen') },
        { key: 'purple', icon: 'fa-solid fa-gem', name: t('themePurple') }
    ];

    builtIn.forEach(function(th) {
        const card = document.createElement('div');
        card.className = 'theme-card';

        const btn = document.createElement('button');
        btn.className = 'theme-apply-btn';
        btn.innerHTML = `<i class="icon ${th.icon}"></i>`;
        btn.addEventListener('click', () => {
            clearCustomThemeVars();
            document.documentElement.setAttribute('data-theme', th.key);
            localStorage.setItem('theme', th.key);
            document.querySelectorAll('.theme-apply-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            showNotification(t('themeApplied', {name: th.name}),'success');
        });

        const nm = document.createElement('div');
        nm.className = 'theme-name';
        nm.textContent = th.name;

        card.appendChild(btn);
        card.appendChild(nm);
        container.appendChild(card);
    });

    // custom themes
    const stored = JSON.parse(localStorage.getItem('customThemes') || '[]');
    stored.forEach(function(th) {
        const card = document.createElement('div');
        card.className = 'theme-card';

        const btn = document.createElement('button');
        btn.className = 'theme-apply-btn';
        btn.innerHTML = `<i class="icon fa-solid fa-circle-half-stroke"></i>`;
        btn.addEventListener('click', () => {
            applyCustomTheme(th);
            localStorage.setItem('theme', 'custom:' + th.name);
            document.querySelectorAll('.theme-apply-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            showNotification(t('themeApplied', {name: th.name}),'success');
        });

        const actions = document.createElement('div');
        actions.className = 'theme-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'edit-theme-small';
        editBtn.title = t('editThemeTitle');
        editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openThemeModal(th);
        });

        const del = document.createElement('button');
        del.className = 'delete-theme-small';
        del.title = t('deleteThemeConfirmTitle');
        del.innerHTML = '<i class="fa-solid fa-trash"></i>';
        del.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!confirm(t('deleteThemeConfirm', {name: th.name}))) return;
            const newStored = stored.filter(x => x.name !== th.name);
            localStorage.setItem('customThemes', JSON.stringify(newStored));
            const current = localStorage.getItem('theme') || 'light';
            if (current === 'custom:' + th.name) {
                clearCustomThemeVars();
                localStorage.setItem('theme', 'light');
                document.documentElement.setAttribute('data-theme', 'light');
            }
            renderThemeList();
            showNotification(t('themeDeleted', {name: th.name}), 'error');
        });

        const nm = document.createElement('div');
        nm.className = 'theme-name';
        nm.textContent = th.name;

        actions.appendChild(editBtn);
        actions.appendChild(del);
        card.appendChild(btn);
        card.appendChild(actions);
        card.appendChild(nm);
        container.appendChild(card);
    });

    // mark active
    const saved = localStorage.getItem('theme') || 'light';
    if (saved.startsWith('custom:')) {
        const cname = saved.split(':')[1];
        const cards = Array.from(document.querySelectorAll('.theme-card'));
        cards.forEach(c => {
            const nm = c.querySelector('.theme-name')?.textContent;
            if (nm === cname) c.querySelector('.theme-apply-btn')?.classList.add('active');
        });
    } else {
        document.querySelectorAll('.theme-card').forEach(c => {
            const btn = c.querySelector('.theme-apply-btn');
            const nm = c.querySelector('.theme-name')?.textContent;
            // match built-in by name mapping
            const map = { [t('themeLight')]:'light', [t('themeDark')]:'dark', [t('themeBlue')]:'blue', [t('themeGreen')]:'green', [t('themePurple')]:'purple' };
            if (map[nm] === saved) btn?.classList.add('active');
        });
    }
}

// Export and import themes as JSON file
const exportThemesBtn = document.getElementById('exportThemesBtn');
const importThemesBtn = document.getElementById('importThemesBtn');
const importThemesInput = document.getElementById('importThemesInput');

async function exportThemes() {
    try {
        const themes = JSON.parse(localStorage.getItem('customThemes') || '[]');
        const payload = { exportedAt: new Date().toISOString(), themes };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const name = `themes_backup_${new Date().toISOString().replace(/[:.]/g,'-')}.json`;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showNotification(t('themeExported'), 'success');
    } catch (err) {
        console.error(err);
        showNotification(t('themeExportError'), 'error');
    }
}

async function importThemes(file) {
    if (!file) return;
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        let incoming = [];
        if (Array.isArray(data)) incoming = data;
        else if (Array.isArray(data.themes)) incoming = data.themes;
        else {
            showNotification(t('themeInvalidFile'), 'error');
            return;
        }

        const stored = JSON.parse(localStorage.getItem('customThemes') || '[]');
        incoming.forEach(t => {
            const idx = stored.findIndex(s => s.name === t.name);
            if (idx >= 0) stored[idx] = t; else stored.push(t);
        });
        localStorage.setItem('customThemes', JSON.stringify(stored));
        renderThemeList();
        showNotification(t('themeImportSuccess'), 'success');
    } catch (err) {
        console.error(err);
        showNotification(t('themeImportError'), 'error');
    }
}

exportThemesBtn?.addEventListener('click', exportThemes);
importThemesBtn?.addEventListener('click', function () { importThemesInput.click(); });
importThemesInput?.addEventListener('change', function (e) {
    const file = e.target.files && e.target.files[0];
    if (file) importThemes(file);
    // reset so same file can be chosen again later
    importThemesInput.value = '';
});

/*=========================
    عرض معلومات آخر نسخة احتياطية
=========================*/
function updateBackupInfo() {
    const backupInfo = document.getElementById('lastBackupInfo');
    const dateSpan = document.getElementById('lastBackupDate');
    
    if (lastBackupDate) {
        const date = new Date(lastBackupDate);
        const formattedDate = date.toLocaleString(currentLang === 'ar' ? 'ar-EG' : (currentLang === 'ru' ? 'ru-RU' : (currentLang === 'zh' ? 'zh-CN' : (currentLang === 'es' ? 'es-ES' : 'en-US'))), {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        dateSpan.textContent = formattedDate;
        backupInfo.style.display = 'flex';
    } else {
        backupInfo.style.display = 'none';
    }
}

/*=========================
    تصدير البيانات
=========================*/
async function exportData() {
    const exportBtn = document.getElementById('exportDataBtn');
    const originalHTML = exportBtn.innerHTML;
    
    try {
        exportBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>' + t('exporting') + '</span>';
        exportBtn.classList.add('loading');
        
        const data = await db.exportAllData();
        
        const backupData = {
            ...data,
            backupInfo: {
                version: '1.0',
                exportedAt: new Date().toISOString(),
                totalBooks: data.books.length,
                totalLists: data.lists.length,
                appName: t('appTitle')
            }
        };
        
        const json = JSON.stringify(backupData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        const date = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `books_backup_${date}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        lastBackupDate = new Date().toISOString();
        localStorage.setItem('lastBackupDate', lastBackupDate);
        updateBackupInfo();
        
        showNotification(t('dataExported', {books: data.books.length, lists: data.lists.length}), 'success');
    } catch (error) {
        console.error('❌ خطأ في تصدير البيانات:', error);
        showNotification(t('dataExportError'), 'error');
    } finally {
        exportBtn.innerHTML = originalHTML;
        exportBtn.classList.remove('loading');
    }
}

/*=========================
    استيراد البيانات
=========================*/
async function importData(file) {
    const importBtn = document.getElementById('importDataBtn');
    const originalHTML = importBtn.innerHTML;
    
    try {
        if (!file) {
            showNotification(t('selectFile'), 'error');
            return;
        }
        
        importBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>' + t('importing') + '</span>';
        importBtn.classList.add('loading');
        
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (!data.books || !data.lists) {
            showNotification(t('invalidFile'), 'error');
            return;
        }
        
        const backupInfo = data.backupInfo || {};
        const totalBooks = data.books.length;
        const totalLists = data.lists.length;
        const exportDate = backupInfo.exportedAt ? new Date(backupInfo.exportedAt).toLocaleString(currentLang === 'ar' ? 'ar-EG' : (currentLang === 'ru' ? 'ru-RU' : (currentLang === 'zh' ? 'zh-CN' : (currentLang === 'es' ? 'es-ES' : 'en-US')))) : t('unknownDate');
        
        const confirmMessage = t('dataImportConfirm', {books: totalBooks, lists: totalLists, date: exportDate});
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        await db.importAllData(data);
        books = await db.getAllBooks();
        customLists = await db.getAllLists();
        
        renderLists();
        updateListSelect();
        renderBooks();
        updateStatistics();
        
        lastBackupDate = new Date().toISOString();
        localStorage.setItem('lastBackupDate', lastBackupDate);
        updateBackupInfo();
        
        showNotification(t('dataImportSuccess', {books: totalBooks, lists: totalLists}), 'success');
    } catch (error) {
        console.error('❌ خطأ في استيراد البيانات:', error);
        if (error instanceof SyntaxError) {
            showNotification(t('invalidFile'), 'error');
        } else {
            showNotification(t('dataImportError'), 'error');
        }
    } finally {
        importBtn.innerHTML = originalHTML;
        importBtn.classList.remove('loading');
        document.getElementById('importFileInput').value = '';
    }
}

/*=========================
    ربط أحداث التصدير والاستيراد
=========================*/
document.addEventListener('DOMContentLoaded', function() {
    const exportBtn = document.getElementById('exportDataBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
    
    const importBtn = document.getElementById('importDataBtn');
    const importFileInput = document.getElementById('importFileInput');
    
    if (importBtn && importFileInput) {
        importBtn.addEventListener('click', function() {
            importFileInput.click();
        });
        
        importFileInput.addEventListener('change', function(e) {
            const file = e.target.files ? e.target.files[0] : null;
            if (file) {
                importData(file);
            }
        });
    }
    
    updateBackupInfo();
});

/*=========================
    الترجمة (i18n)
=========================*/
const translations = {
  ar: {
    appTitle: 'مدير الكتب المتقدم',
    sidebarLogo: 'مدير الكتب',
    navHome: 'الرئيسية',
    navAllBooks: 'جميع الكتب',
    navFavorites: 'المفضلة',
    navFinished: 'مقروء',
    navWantToRead: 'أريد القراءة',
    myLists: 'قوائمي',
    newListPlaceholder: 'قائمة جديدة...',
    langToggle: 'اللغة',
    langAr: 'العربية',
    langEn: 'English',
    langRu: 'Русский',
    themeTitle: 'الثيمات',
    exportThemes: 'تصدير الثيمات',
    importThemes: 'استيراد الثيمات',
    createTheme: 'إضافة ثيم',
    library: 'مكتبتي',
    searchPlaceholder: 'بحث عن كتاب...',
    loading: 'جاري التحميل...',
    totalBooks: 'إجمالي الكتب',
    favorites: 'المفضلة',
    read: 'مقروء',
    wantToRead: 'أريد القراءة',
    addBookSection: 'إضافة كتاب جديد',
    titleLabel: 'عنوان الكتاب',
    authorLabel: 'المؤلف',
    yearLabel: 'سنة النشر',
    pagesLabel: 'عدد الصفحات',
    categoryLabel: 'التصنيف',
    statusLabel: 'الحالة',
    statusWantToRead: 'أريد القراءة',
    statusReading: 'أقرأ الآن',
    statusFinished: 'انتهيت',
    ratingLabel: 'التقييم',
    listLabel: 'القائمة',
    noList: '-- بدون قائمة --',
    notesLabel: 'ملاحظات...',
    coverLabel: 'غلاف الكتاب',
    pdfLabel: 'ملف PDF',
    addBookBtn: 'إضافة كتاب',
    dataManagement: 'إدارة البيانات',
    exportData: 'تصدير البيانات',
    exportDataDesc: 'حفظ نسخة احتياطية',
    importData: 'استيراد البيانات',
    importDataDesc: 'استعادة من نسخة سابقة',
    dataInfo: 'يمكنك تصدير جميع كتبك وقوائمك إلى ملف خارجي، واستيراده لاحقاً لاستعادة البيانات حتى لو تم حذف كاش المتصفح.',
    lastBackup: 'آخر نسخة احتياطية:',
    yourLibrary: 'مكتبتك',
    editBook: 'تعديل الكتاب',
    currentCover: 'الغلاف الحالي',
    changeCover: 'تغيير الغلاف',
    changePdf: 'تغيير ملف PDF',
    currentPdfNone: 'الملف الحالي: لا يوجد',
    currentPdfAttached: 'الملف الحالي: PDF مرفق',
    saveChanges: 'حفظ التغييرات',
    cancel: 'إلغاء',
    createThemeTitle: 'إنشاء ثيم مخصص',
    editThemeTitle: 'تعديل الثيم',
    themeName: 'اسم الثيم',
    themeMain: 'اللون الرئيسي',
    themeBackground: 'لون الخلفية',
    themeSidebar: 'لون الشريط الجانبي',
    themeText: 'لون النص',
    themeCard: 'لون بطاقات المحتوى',
    saveTheme: 'حفظ الثيم',
    noBooks: 'لا توجد كتب',
    noSearchResults: 'لا توجد نتائج مطابقة للبحث',
    startAdding: 'ابدأ بإضافة أول كتاب إلى مكتبتك.',
    pdfBadge: 'PDF',
    openBook: 'فتح',
    addToList: 'أضف',
    removeFromList: 'إزالة',
    selectList: 'اختر قائمة...',
    noLists: 'لا توجد قوائم',
    author: 'المؤلف',
    year: 'السنة',
    category: 'التصنيف',
    pages: 'عدد الصفحات',
    status: 'الحالة',
    path: 'مسار الملف',
    notes: 'ملاحظات',
    rating: 'التقييم',
    returnHome: 'العودة',
    downloadPdf: 'تحميل ملف PDF',
    pdfDownloaded: '✅ تم تحميل PDF: "{title}"',
    noPdfFile: 'لا يوجد ملف PDF مرفق لهذا الكتاب',
    waitLoading: '⏳ جاري تحميل البيانات، انتظر قليلاً',
    enterTitle: '⚠️ الرجاء إدخال عنوان الكتاب',
    enterAuthor: '⚠️ الرجاء إدخال اسم المؤلف',
    bookAdded: '✅ تم إضافة الكتاب بنجاح!',
    bookAddError: '❌ حدث خطأ أثناء إضافة الكتاب',
    bookUpdated: '✅ تم تحديث الكتاب بنجاح!',
    bookUpdateError: '❌ حدث خطأ أثناء التعديل',
    bookDeleted: '🗑 تم حذف "{title}"',
    pdfUpdated: '✅ تم تحديث ملف PDF بنجاح!',
    selectListPrompt: '⚠️ الرجاء اختيار قائمة',
    bookNotFound: '⚠️ الكتاب غير موجود',
    alreadyInList: '📚 "{title}" موجود بالفعل في قائمة "{list}"',
    listNotFound: '⚠️ القائمة "{list}" غير موجودة',
    addedToList: '✅ تم إضافة "{title}" إلى قائمة "{list}"',
    notInList: '⚠️ "{title}" ليس في قائمة "{list}"',
    removedFromList: '✅ تم إزالة "{title}" من قائمة "{list}"',
    noPdf: '⚠️ لا يوجد ملف PDF لهذا الكتاب',
    allowPopup: '⚠️ الرجاء السماح بفتح النوافذ المنبثقة',
    confirmDelete: 'هل أنت متأكد من حذف هذا الكتاب؟',
    confirmDeleteList: 'هل أنت متأكد من حذف قائمة "{list}"؟',
    listExists: '⚠️ هذه القائمة موجودة بالفعل',
    enterListName: '⚠️ الرجاء إدخال اسم القائمة',
    selectValidPdf: '⚠️ الرجاء اختيار ملف PDF صالح',
    themeExists: '⚠️ يوجد ثيم بالاسم "{name}" بالفعل',
    listCreated: '✅ تم إنشاء قائمة "{list}"',
    listDeleted: '🗑 تم حذف قائمة "{list}"',
    enterThemeName: '⚠️ الرجاء إدخال اسم الثيم',
    themeSaved: '✅ تم حفظ الثيم بنجاح',
    themeApplied: '✅ تم تطبيق ثيم: {name}',
    themeDeleted: '🗑 تم حذف الثيم "{name}"',
    themeExported: '✅ تم تصدير الثيمات',
    themeExportError: 'حدث خطأ أثناء تصدير الثيمات',
    themeImportSuccess: '✅ تم استيراد الثيمات',
    themeImportError: 'حدث خطأ أثناء استيراد الملف',
    themeInvalidFile: 'ملف غير صالح: لا يحتوي على ثيمات',
    dataExported: '✅ تم تصدير {books} كتاب و {lists} قائمة بنجاح!',
    dataExportError: '❌ حدث خطأ في تصدير البيانات',
    dataImportConfirm: '📚 استيراد البيانات\n\n📖 عدد الكتب: {books}\n📋 عدد القوائم: {lists}\n📅 تاريخ التصدير: {date}\n\n⚠️ سيتم استبدال جميع البيانات الحالية.\nهل أنت متأكد من الاستيراد؟',
    dataImportSuccess: '✅ تم استيراد {books} كتاب و {lists} قائمة بنجاح!',
    dataImportError: '❌ حدث خطأ في استيراد البيانات',
    invalidFile: '⚠️ الملف غير صالح أو تالف',
    selectFile: '⚠️ الرجاء اختيار ملف',
    unknownDate: 'غير معروف',
    bookInfoTitle: '{title} - معلومات الكتاب',
    bookDetailYear: '📅 سنة النشر',
    bookDetailPages: '📄 عدد الصفحات',
    bookDetailCategory: '📂 التصنيف',
    bookDetailRating: '⭐ التقييم',
    bookDetailPath: '📁 مسار الملف',
    bookNotesSection: 'ملاحظات',
    bookPathLabel: '📁 مسار الكتاب على الحاسوب:',
    themeLight: 'فاتح',
    themeDark: 'داكن',
    themeBlue: 'أزرق',
    themeGreen: 'أخضر',
    themePurple: 'أرجواني',
    deleteThemeConfirm: 'هل تريد حذف الثيم "{name}"؟',
    deleteThemeConfirmTitle: 'حذف الثيم',
    overwriteList: '(محذوفة)',
    exporting: 'جاري التصدير...',
    importing: 'جاري الاستيراد...',
    editBookSection: 'تعديل الكتاب',
    readingProgress: 'تقدم القراءة',
  },
  en: {
    appTitle: 'Book Manager Pro',
    sidebarLogo: 'Book Manager',
    navHome: 'Home',
    navAllBooks: 'All Books',
    navFavorites: 'Favorites',
    navFinished: 'Finished',
    navWantToRead: 'Want to Read',
    myLists: 'My Lists',
    newListPlaceholder: 'New list...',
    langToggle: 'Language',
    langAr: 'العربية',
    langEn: 'English',
    langRu: 'Русский',
    themeTitle: 'Themes',
    exportThemes: 'Export Themes',
    importThemes: 'Import Themes',
    createTheme: 'Add Theme',
    library: 'My Library',
    searchPlaceholder: 'Search books...',
    loading: 'Loading...',
    totalBooks: 'Total Books',
    favorites: 'Favorites',
    read: 'Read',
    wantToRead: 'Want to Read',
    addBookSection: 'Add New Book',
    titleLabel: 'Book Title',
    authorLabel: 'Author',
    yearLabel: 'Year',
    pagesLabel: 'Pages',
    categoryLabel: 'Category',
    statusLabel: 'Status',
    statusWantToRead: 'Want To Read',
    statusReading: 'Reading',
    statusFinished: 'Finished',
    ratingLabel: 'Rating',
    listLabel: 'List',
    noList: '-- No List --',
    notesLabel: 'Notes...',
    coverLabel: 'Book Cover',
    pdfLabel: 'PDF File',
    addBookBtn: 'Add Book',
    dataManagement: 'Data Management',
    exportData: 'Export Data',
    exportDataDesc: 'Save a backup',
    importData: 'Import Data',
    importDataDesc: 'Restore from backup',
    dataInfo: 'You can export all your books and lists to an external file, and import them later to restore data even if the browser cache is cleared.',
    lastBackup: 'Last backup:',
    yourLibrary: 'Your Library',
    editBook: 'Edit Book',
    currentCover: 'Current Cover',
    changeCover: 'Change Cover',
    changePdf: 'Change PDF File',
    currentPdfNone: 'Current file: None',
    currentPdfAttached: 'Current file: PDF attached',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    createThemeTitle: 'Create Custom Theme',
    editThemeTitle: 'Edit Theme',
    themeName: 'Theme Name',
    themeMain: 'Main Color',
    themeBackground: 'Background Color',
    themeSidebar: 'Sidebar Color',
    themeText: 'Text Color',
    themeCard: 'Card Color',
    saveTheme: 'Save Theme',
    noBooks: 'No Books',
    noSearchResults: 'No matching results',
    startAdding: 'Start by adding your first book.',
    pdfBadge: 'PDF',
    openBook: 'Open',
    addToList: 'Add',
    removeFromList: 'Remove',
    selectList: 'Choose a list...',
    noLists: 'No lists available',
    author: 'Author',
    year: 'Year',
    category: 'Category',
    pages: 'Pages',
    status: 'Status',
    path: 'File Path',
    notes: 'Notes',
    rating: 'Rating',
    returnHome: 'Back',
    downloadPdf: 'Download PDF',
    pdfDownloaded: '✅ PDF downloaded: "{title}"',
    noPdfFile: 'No PDF file attached to this book',
    waitLoading: '⏳ Loading data, please wait...',
    enterTitle: '⚠️ Please enter the book title',
    enterAuthor: '⚠️ Please enter the author name',
    bookAdded: '✅ Book added successfully!',
    bookAddError: '❌ Error adding book',
    bookUpdated: '✅ Book updated successfully!',
    bookUpdateError: '❌ Error updating book',
    bookDeleted: '🗑 "{title}" deleted',
    pdfUpdated: '✅ PDF file updated successfully!',
    selectListPrompt: '⚠️ Please select a list',
    bookNotFound: '⚠️ Book not found',
    alreadyInList: '📚 "{title}" already in list "{list}"',
    listNotFound: '⚠️ List "{list}" not found',
    addedToList: '✅ Added "{title}" to list "{list}"',
    notInList: '⚠️ "{title}" is not in list "{list}"',
    removedFromList: '✅ Removed "{title}" from list "{list}"',
    noPdf: '⚠️ No PDF file for this book',
    allowPopup: '⚠️ Please allow pop-up windows',
    confirmDelete: 'Are you sure you want to delete this book?',
    confirmDeleteList: 'Are you sure you want to delete list "{list}"?',
    listExists: '⚠️ This list already exists',
    enterListName: '⚠️ Please enter a list name',
    selectValidPdf: '⚠️ Please select a valid PDF file',
    themeExists: '⚠️ Theme "{name}" already exists',
    listCreated: '✅ List "{list}" created',
    listDeleted: '🗑 List "{list}" deleted',
    enterThemeName: '⚠️ Please enter a theme name',
    themeSaved: '✅ Theme saved successfully',
    themeApplied: '✅ Theme "{name}" applied',
    themeDeleted: '🗑 Theme "{name}" deleted',
    themeExported: '✅ Themes exported',
    themeExportError: 'Error exporting themes',
    themeImportSuccess: '✅ Themes imported',
    themeImportError: 'Error importing file',
    themeInvalidFile: 'Invalid file: no themes found',
    dataExported: '✅ Exported {books} books and {lists} lists successfully!',
    dataExportError: '❌ Error exporting data',
    dataImportConfirm: '📚 Import Data\n\n📖 Books: {books}\n📋 Lists: {lists}\n📅 Export date: {date}\n\n⚠️ All current data will be replaced.\nAre you sure?',
    dataImportSuccess: '✅ Imported {books} books and {lists} lists successfully!',
    dataImportError: '❌ Error importing data',
    invalidFile: '⚠️ Invalid or corrupted file',
    selectFile: '⚠️ Please select a file',
    unknownDate: 'Unknown',
    bookInfoTitle: '{title} - Book Info',
    bookDetailYear: '📅 Year',
    bookDetailPages: '📄 Pages',
    bookDetailCategory: '📂 Category',
    bookDetailRating: '⭐ Rating',
    bookDetailPath: '📁 File Path',
    bookNotesSection: 'Notes',
    bookPathLabel: '📁 File path on computer:',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeBlue: 'Blue',
    themeGreen: 'Green',
    themePurple: 'Purple',
    deleteThemeConfirm: 'Delete theme "{name}"?',
    deleteThemeConfirmTitle: 'Delete Theme',
    overwriteList: '(deleted)',
    exporting: 'Exporting...',
    importing: 'Importing...',
    editBookSection: 'Edit Book',
    readingProgress: 'Reading Progress',
  },
  ru: {
    appTitle: 'Продвинутый менеджер книг',
    sidebarLogo: 'Менеджер книг',
    navHome: 'Главная',
    navAllBooks: 'Все книги',
    navFavorites: 'Избранное',
    navFinished: 'Прочитано',
    navWantToRead: 'Хочу прочитать',
    myLists: 'Мои списки',
    newListPlaceholder: 'Новый список...',
    langToggle: 'Язык',
    langAr: 'العربية',
    langEn: 'English',
    langRu: 'Русский',
    themeTitle: 'Темы',
    exportThemes: 'Экспорт тем',
    importThemes: 'Импорт тем',
    createTheme: 'Добавить тему',
    library: 'Моя библиотека',
    searchPlaceholder: 'Поиск книги...',
    loading: 'Загрузка...',
    totalBooks: 'Всего книг',
    favorites: 'Избранное',
    read: 'Прочитано',
    wantToRead: 'Хочу прочитать',
    addBookSection: 'Добавить новую книгу',
    titleLabel: 'Название книги',
    authorLabel: 'Автор',
    yearLabel: 'Год издания',
    pagesLabel: 'Количество страниц',
    categoryLabel: 'Категория',
    statusLabel: 'Статус',
    statusWantToRead: 'Хочу прочитать',
    statusReading: 'Читаю сейчас',
    statusFinished: 'Завершено',
    ratingLabel: 'Оценка',
    listLabel: 'Список',
    noList: '-- Без списка --',
    notesLabel: 'Заметки...',
    coverLabel: 'Обложка книги',
    pdfLabel: 'PDF файл',
    addBookBtn: 'Добавить книгу',
    dataManagement: 'Управление данными',
    exportData: 'Экспорт данных',
    exportDataDesc: 'Сохранить резервную копию',
    importData: 'Импорт данных',
    importDataDesc: 'Восстановить из копии',
    dataInfo: 'Вы можете экспортировать все книги и списки в внешний файл и импортировать их позже для восстановления данных, даже если кэш браузера будет очищен.',
    lastBackup: 'Последняя резервная копия:',
    yourLibrary: 'Ваша библиотека',
    editBook: 'Редактировать книгу',
    currentCover: 'Текущая обложка',
    changeCover: 'Изменить обложку',
    changePdf: 'Изменить PDF файл',
    currentPdfNone: 'Текущий файл: отсутствует',
    currentPdfAttached: 'Текущий файл: PDF прикреплён',
    saveChanges: 'Сохранить изменения',
    cancel: 'Отмена',
    createThemeTitle: 'Создать пользовательскую тему',
    editThemeTitle: 'Редактировать тему',
    themeName: 'Название темы',
    themeMain: 'Основной цвет',
    themeBackground: 'Цвет фона',
    themeSidebar: 'Цвет боковой панели',
    themeText: 'Цвет текста',
    themeCard: 'Цвет карточек',
    saveTheme: 'Сохранить тему',
    noBooks: 'Нет книг',
    noSearchResults: 'Нет результатов поиска',
    startAdding: 'Начните с добавления первой книги в вашу библиотеку.',
    pdfBadge: 'PDF',
    openBook: 'Читать',
    addToList: 'Добавить',
    removeFromList: 'Удалить',
    selectList: 'Выберите список...',
    noLists: 'Нет списков',
    author: 'Автор',
    year: 'Год',
    category: 'Категория',
    pages: 'Страницы',
    status: 'Статус',
    path: 'Путь к файлу',
    notes: 'Заметки',
    rating: 'Оценка',
    returnHome: 'Назад',
    downloadPdf: 'Скачать PDF',
    pdfDownloaded: '✅ PDF загружен: "{title}"',
    noPdfFile: 'PDF файл не прикреплён к этой книге',
    waitLoading: '⏳ Загрузка данных, подождите...',
    enterTitle: '⚠️ Пожалуйста, введите название книги',
    enterAuthor: '⚠️ Пожалуйста, введите имя автора',
    bookAdded: '✅ Книга успешно добавлена!',
    bookAddError: '❌ Ошибка при добавлении книги',
    bookUpdated: '✅ Книга успешно обновлена!',
    bookUpdateError: '❌ Ошибка при обновлении книги',
    bookDeleted: '🗑 "{title}" удалена',
    pdfUpdated: '✅ PDF файл успешно обновлён!',
    selectListPrompt: '⚠️ Пожалуйста, выберите список',
    bookNotFound: '⚠️ Книга не найдена',
    alreadyInList: '📚 "{title}" уже в списке "{list}"',
    listNotFound: '⚠️ Список "{list}" не найден',
    addedToList: '✅ "{title}" добавлена в список "{list}"',
    notInList: '⚠️ "{title}" не в списке "{list}"',
    removedFromList: '✅ "{title}" удалена из списка "{list}"',
    noPdf: '⚠️ Нет PDF файла для этой книги',
    allowPopup: '⚠️ Пожалуйста, разрешите всплывающие окна',
    confirmDelete: 'Вы уверены, что хотите удалить эту книгу?',
    confirmDeleteList: 'Вы уверены, что хотите удалить список "{list}"?',
    listExists: '⚠️ Этот список уже существует',
    enterListName: '⚠️ Пожалуйста, введите название списка',
    selectValidPdf: '⚠️ Пожалуйста, выберите корректный PDF файл',
    themeExists: '⚠️ Тема "{name}" уже существует',
    listCreated: '✅ Список "{list}" создан',
    listDeleted: '🗑 Список "{list}" удалён',
    enterThemeName: '⚠️ Пожалуйста, введите название темы',
    themeSaved: '✅ Тема успешно сохранена',
    themeApplied: '✅ Применена тема: {name}',
    themeDeleted: '🗑 Тема "{name}" удалена',
    themeExported: '✅ Темы экспортированы',
    themeExportError: 'Ошибка при экспорте тем',
    themeImportSuccess: '✅ Темы импортированы',
    themeImportError: 'Ошибка при импорте файла',
    themeInvalidFile: 'Некорректный файл: темы не найдены',
    dataExported: '✅ Экспортировано {books} книг и {lists} списков!',
    dataExportError: '❌ Ошибка при экспорте данных',
    dataImportConfirm: '📚 Импорт данных\n\n📖 Книг: {books}\n📋 Списков: {lists}\n📅 Дата экспорта: {date}\n\n⚠️ Все текущие данные будут заменены.\nВы уверены?',
    dataImportSuccess: '✅ Импортировано {books} книг и {lists} списков!',
    dataImportError: '❌ Ошибка при импорте данных',
    invalidFile: '⚠️ Некорректный или повреждённый файл',
    selectFile: '⚠️ Пожалуйста, выберите файл',
    unknownDate: 'Неизвестно',
    bookInfoTitle: '{title} - Информация о книге',
    bookDetailYear: '📅 Год издания',
    bookDetailPages: '📄 Количество страниц',
    bookDetailCategory: '📂 Категория',
    bookDetailRating: '⭐ Оценка',
    bookDetailPath: '📁 Путь к файлу',
    bookNotesSection: 'Заметки',
    bookPathLabel: '📁 Путь к книге на компьютере:',
    themeLight: 'Светлая',
    themeDark: 'Тёмная',
    themeBlue: 'Синяя',
    themeGreen: 'Зелёная',
    themePurple: 'Фиолетовая',
    deleteThemeConfirm: 'Удалить тему "{name}"?',
    deleteThemeConfirmTitle: 'Удалить тему',
    overwriteList: '(удалён)',
    exporting: 'Экспорт...',
    importing: 'Импорт...',
    editBookSection: 'Редактировать книгу',
    readingProgress: 'Прогресс чтения',
  },
  zh: {
    appTitle: '高级图书管理器',
    sidebarLogo: '图书管理',
    navHome: '主页',
    navAllBooks: '所有图书',
    navFavorites: '收藏',
    navFinished: '已读完',
    navWantToRead: '想读',
    myLists: '我的书单',
    newListPlaceholder: '新书单...',
    langToggle: '语言',
    langAr: 'العربية',
    langEn: 'English',
    langRu: 'Русский',
    langZh: '中文',
    themeTitle: '主题',
    exportThemes: '导出主题',
    importThemes: '导入主题',
    createTheme: '添加主题',
    library: '我的图书馆',
    searchPlaceholder: '搜索图书...',
    loading: '正在加载...',
    totalBooks: '图书总数',
    favorites: '收藏',
    read: '已读完',
    wantToRead: '想读',
    addBookSection: '添加新书',
    titleLabel: '书名',
    authorLabel: '作者',
    yearLabel: '出版年份',
    pagesLabel: '页数',
    categoryLabel: '分类',
    statusLabel: '状态',
    statusWantToRead: '想读',
    statusReading: '正在阅读',
    statusFinished: '已读完',
    ratingLabel: '评分',
    listLabel: '书单',
    noList: '-- 无书单 --',
    notesLabel: '备注...',
    coverLabel: '封面',
    pdfLabel: 'PDF 文件',
    addBookBtn: '添加图书',
    dataManagement: '数据管理',
    exportData: '导出数据',
    exportDataDesc: '保存备份',
    importData: '导入数据',
    importDataDesc: '从备份恢复',
    dataInfo: '您可以将所有图书和书单导出到外部文件，之后即使清除了浏览器缓存，也可以导入以恢复数据。',
    lastBackup: '上次备份：',
    yourLibrary: '您的图书馆',
    editBook: '编辑图书',
    currentCover: '当前封面',
    changeCover: '更换封面',
    changePdf: '更换 PDF 文件',
    currentPdfNone: '当前文件：无',
    currentPdfAttached: '当前文件：已附加 PDF',
    saveChanges: '保存更改',
    cancel: '取消',
    createThemeTitle: '创建自定义主题',
    editThemeTitle: '编辑主题',
    themeName: '主题名称',
    themeMain: '主色',
    themeBackground: '背景色',
    themeSidebar: '侧边栏颜色',
    themeText: '文字颜色',
    themeCard: '卡片颜色',
    saveTheme: '保存主题',
    noBooks: '没有图书',
    noSearchResults: '没有匹配的搜索结果',
    startAdding: '从添加第一本图书开始吧。',
    pdfBadge: 'PDF',
    openBook: '打开',
    addToList: '添加',
    removeFromList: '移除',
    selectList: '选择书单...',
    noLists: '没有书单',
    author: '作者',
    year: '年份',
    category: '分类',
    pages: '页数',
    status: '状态',
    path: '文件路径',
    notes: '备注',
    rating: '评分',
    returnHome: '返回',
    downloadPdf: '下载 PDF',
    pdfDownloaded: '✅ 已下载 PDF："{title}"',
    noPdfFile: '本书没有附加 PDF 文件',
    waitLoading: '⏳ 数据加载中，请稍候...',
    enterTitle: '⚠️ 请输入书名',
    enterAuthor: '⚠️ 请输入作者姓名',
    bookAdded: '✅ 图书添加成功！',
    bookAddError: '❌ 添加图书时出错',
    bookUpdated: '✅ 图书更新成功！',
    bookUpdateError: '❌ 更新图书时出错',
    bookDeleted: '🗑 已删除"{title}"',
    pdfUpdated: '✅ PDF 文件更新成功！',
    selectListPrompt: '⚠️ 请选择一个书单',
    bookNotFound: '⚠️ 未找到该图书',
    alreadyInList: '📚 "{title}"已在书单"{list}"中',
    listNotFound: '⚠️ 未找到书单"{list}"',
    addedToList: '✅ 已将"{title}"添加到书单"{list}"',
    notInList: '⚠️ "{title}"不在书单"{list}"中',
    removedFromList: '✅ 已将"{title}"从书单"{list}"中移除',
    noPdf: '⚠️ 本书没有 PDF 文件',
    allowPopup: '⚠️ 请允许弹出窗口',
    confirmDelete: '确定要删除这本图书吗？',
    confirmDeleteList: '确定要删除书单"{list}"吗？',
    listExists: '⚠️ 该书单已存在',
    enterListName: '⚠️ 请输入书单名称',
    selectValidPdf: '⚠️ 请选择有效的 PDF 文件',
    themeExists: '⚠️ 主题"{name}"已存在',
    listCreated: '✅ 已创建书单"{list}"',
    listDeleted: '🗑 已删除书单"{list}"',
    enterThemeName: '⚠️ 请输入主题名称',
    themeSaved: '✅ 主题保存成功',
    themeApplied: '✅ 已应用主题：{name}',
    themeDeleted: '🗑 已删除主题"{name}"',
    themeExported: '✅ 主题已导出',
    themeExportError: '导出主题时出错',
    themeImportSuccess: '✅ 主题已导入',
    themeImportError: '导入文件时出错',
    themeInvalidFile: '文件无效：未找到主题',
    dataExported: '✅ 已成功导出 {books} 本图书和 {lists} 个书单！',
    dataExportError: '❌ 导出数据时出错',
    dataImportConfirm: '📚 导入数据\n\n📖 图书数量：{books}\n📋 书单数量：{lists}\n📅 导出日期：{date}\n\n⚠️ 所有当前数据都将被替换。\n确定要导入吗？',
    dataImportSuccess: '✅ 已成功导入 {books} 本图书和 {lists} 个书单！',
    dataImportError: '❌ 导入数据时出错',
    invalidFile: '⚠️ 文件无效或已损坏',
    selectFile: '⚠️ 请选择文件',
    unknownDate: '未知',
    bookInfoTitle: '{title} - 图书信息',
    bookDetailYear: '📅 出版年份',
    bookDetailPages: '📄 页数',
    bookDetailCategory: '📂 分类',
    bookDetailRating: '⭐ 评分',
    bookDetailPath: '📁 文件路径',
    bookNotesSection: '备注',
    bookPathLabel: '📁 图书在计算机上的路径：',
    themeLight: '浅色',
    themeDark: '深色',
    themeBlue: '蓝色',
    themeGreen: '绿色',
    themePurple: '紫色',
    deleteThemeConfirm: '确定要删除主题"{name}"吗？',
    deleteThemeConfirmTitle: '删除主题',
    overwriteList: '（已删除）',
    exporting: '正在导出...',
    importing: '正在导入...',
    editBookSection: '编辑图书',
    readingProgress: '阅读进度',
  },
  es: {
    appTitle: 'Gestor Avanzado de Libros',
    sidebarLogo: 'Gestor de Libros',
    navHome: 'Inicio',
    navAllBooks: 'Todos los libros',
    navFavorites: 'Favoritos',
    navFinished: 'Leídos',
    navWantToRead: 'Quiero leer',
    myLists: 'Mis listas',
    newListPlaceholder: 'Nueva lista...',
    langToggle: 'Idioma',
    langAr: 'العربية',
    langEn: 'English',
    langRu: 'Русский',
    langZh: '中文',
    langEs: 'Español',
    themeTitle: 'Temas',
    exportThemes: 'Exportar temas',
    importThemes: 'Importar temas',
    createTheme: 'Añadir tema',
    library: 'Mi biblioteca',
    searchPlaceholder: 'Buscar libro...',
    loading: 'Cargando...',
    totalBooks: 'Total de libros',
    favorites: 'Favoritos',
    read: 'Leídos',
    wantToRead: 'Quiero leer',
    addBookSection: 'Añadir nuevo libro',
    titleLabel: 'Título del libro',
    authorLabel: 'Autor',
    yearLabel: 'Año de publicación',
    pagesLabel: 'Número de páginas',
    categoryLabel: 'Categoría',
    statusLabel: 'Estado',
    statusWantToRead: 'Quiero leer',
    statusReading: 'Leyendo ahora',
    statusFinished: 'Terminado',
    ratingLabel: 'Calificación',
    listLabel: 'Lista',
    noList: '-- Sin lista --',
    notesLabel: 'Notas...',
    coverLabel: 'Portada del libro',
    pdfLabel: 'Archivo PDF',
    addBookBtn: 'Añadir libro',
    dataManagement: 'Gestión de datos',
    exportData: 'Exportar datos',
    exportDataDesc: 'Guardar copia de seguridad',
    importData: 'Importar datos',
    importDataDesc: 'Restaurar desde copia',
    dataInfo: 'Puedes exportar todos tus libros y listas a un archivo externo e importarlos más tarde para restaurar los datos incluso si se borra la caché del navegador.',
    lastBackup: 'Última copia de seguridad:',
    yourLibrary: 'Tu biblioteca',
    editBook: 'Editar libro',
    currentCover: 'Portada actual',
    changeCover: 'Cambiar portada',
    changePdf: 'Cambiar archivo PDF',
    currentPdfNone: 'Archivo actual: ninguno',
    currentPdfAttached: 'Archivo actual: PDF adjunto',
    saveChanges: 'Guardar cambios',
    cancel: 'Cancelar',
    createThemeTitle: 'Crear tema personalizado',
    editThemeTitle: 'Editar tema',
    themeName: 'Nombre del tema',
    themeMain: 'Color principal',
    themeBackground: 'Color de fondo',
    themeSidebar: 'Color de la barra lateral',
    themeText: 'Color del texto',
    themeCard: 'Color de las tarjetas',
    saveTheme: 'Guardar tema',
    noBooks: 'No hay libros',
    noSearchResults: 'No hay resultados que coincidan con la búsqueda',
    startAdding: 'Comienza añadiendo tu primer libro a tu biblioteca.',
    pdfBadge: 'PDF',
    openBook: 'Abrir',
    addToList: 'Añadir',
    removeFromList: 'Quitar',
    selectList: 'Elige una lista...',
    noLists: 'No hay listas',
    author: 'Autor',
    year: 'Año',
    category: 'Categoría',
    pages: 'Páginas',
    status: 'Estado',
    path: 'Ruta del archivo',
    notes: 'Notas',
    rating: 'Calificación',
    returnHome: 'Volver',
    downloadPdf: 'Descargar PDF',
    pdfDownloaded: '✅ PDF descargado: "{title}"',
    noPdfFile: 'No hay archivo PDF adjunto a este libro',
    waitLoading: '⏳ Cargando datos, espera un momento...',
    enterTitle: '⚠️ Por favor ingresa el título del libro',
    enterAuthor: '⚠️ Por favor ingresa el nombre del autor',
    bookAdded: '✅ ¡Libro añadido con éxito!',
    bookAddError: '❌ Error al añadir el libro',
    bookUpdated: '✅ ¡Libro actualizado con éxito!',
    bookUpdateError: '❌ Error al actualizar el libro',
    bookDeleted: '🗑 "{title}" eliminado',
    pdfUpdated: '✅ ¡Archivo PDF actualizado con éxito!',
    selectListPrompt: '⚠️ Por favor selecciona una lista',
    bookNotFound: '⚠️ Libro no encontrado',
    alreadyInList: '📚 "{title}" ya está en la lista "{list}"',
    listNotFound: '⚠️ Lista "{list}" no encontrada',
    addedToList: '✅ "{title}" añadido a la lista "{list}"',
    notInList: '⚠️ "{title}" no está en la lista "{list}"',
    removedFromList: '✅ "{title}" quitado de la lista "{list}"',
    noPdf: '⚠️ No hay archivo PDF para este libro',
    allowPopup: '⚠️ Por favor permite las ventanas emergentes',
    confirmDelete: '¿Estás seguro de que quieres eliminar este libro?',
    confirmDeleteList: '¿Estás seguro de que quieres eliminar la lista "{list}"?',
    listExists: '⚠️ Esta lista ya existe',
    enterListName: '⚠️ Por favor ingresa un nombre para la lista',
    selectValidPdf: '⚠️ Por favor selecciona un archivo PDF válido',
    themeExists: '⚠️ El tema "{name}" ya existe',
    listCreated: '✅ Lista "{list}" creada',
    listDeleted: '🗑 Lista "{list}" eliminada',
    enterThemeName: '⚠️ Por favor ingresa un nombre para el tema',
    themeSaved: '✅ Tema guardado con éxito',
    themeApplied: '✅ Tema aplicado: {name}',
    themeDeleted: '🗑 Tema "{name}" eliminado',
    themeExported: '✅ Temas exportados',
    themeExportError: 'Error al exportar los temas',
    themeImportSuccess: '✅ Temas importados',
    themeImportError: 'Error al importar el archivo',
    themeInvalidFile: 'Archivo no válido: no se encontraron temas',
    dataExported: '✅ ¡{books} libros y {lists} listas exportados con éxito!',
    dataExportError: '❌ Error al exportar los datos',
    dataImportConfirm: '📚 Importar datos\n\n📖 Libros: {books}\n📋 Listas: {lists}\n📅 Fecha de exportación: {date}\n\n⚠️ Todos los datos actuales serán reemplazados.\n¿Estás seguro de importar?',
    dataImportSuccess: '✅ ¡{books} libros y {lists} listas importados con éxito!',
    dataImportError: '❌ Error al importar los datos',
    invalidFile: '⚠️ Archivo no válido o corrupto',
    selectFile: '⚠️ Por favor selecciona un archivo',
    unknownDate: 'Desconocida',
    bookInfoTitle: '{title} - Información del libro',
    bookDetailYear: '📅 Año de publicación',
    bookDetailPages: '📄 Número de páginas',
    bookDetailCategory: '📂 Categoría',
    bookDetailRating: '⭐ Calificación',
    bookDetailPath: '📁 Ruta del archivo',
    bookNotesSection: 'Notas',
    bookPathLabel: '📁 Ruta del libro en el ordenador:',
    themeLight: 'Claro',
    themeDark: 'Oscuro',
    themeBlue: 'Azul',
    themeGreen: 'Verde',
    themePurple: 'Morado',
    deleteThemeConfirm: '¿Eliminar el tema "{name}"?',
    deleteThemeConfirmTitle: 'Eliminar tema',
    overwriteList: '(eliminada)',
    exporting: 'Exportando...',
    importing: 'Importando...',
    editBookSection: 'Editar libro',
    readingProgress: 'Progreso de lectura',
  }
};

let currentLang = localStorage.getItem('lang') || 'ar';

function t(key, params = {}) {
  let str = (translations[currentLang] && translations[currentLang][key]) || key;
  for (const [k, v] of Object.entries(params)) {
    str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  }
  return str;
}

/* ترجمة حالة الكتاب المخزنة بالإنجليزية إلى اللغة الحالية */
function tStatus(status) {
  const map = {
    'Want To Read': 'statusWantToRead',
    'Reading': 'statusReading',
    'Finished': 'statusFinished'
  };
  return t(map[status] || 'statusWantToRead');
}

function applyLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  document.documentElement.setAttribute('data-lang', lang);
  renderThemeList();
  renderLists();
  updateListSelect();
  renderBooks();
  updateStatistics();
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (el.placeholder !== undefined) {
      el.placeholder = t(key);
    } else {
      el.textContent = t(key);
    }
  });
  const logoH2 = document.querySelector('.logo h2');
  if (logoH2) logoH2.textContent = t('sidebarLogo');
  const headerH1 = document.querySelector('header h1');
  if (headerH1) headerH1.innerHTML = `<i class="fa-solid fa-book"></i> ${t('library')}`;
  const langArBtn = document.getElementById('langArBtn');
  const langEnBtn = document.getElementById('langEnBtn');
  const langRuBtn = document.getElementById('langRuBtn');
  const langZhBtn = document.getElementById('langZhBtn');
  const langEsBtn = document.getElementById('langEsBtn');
  if (langArBtn) langArBtn.classList.toggle('active', lang === 'ar');
  if (langEnBtn) langEnBtn.classList.toggle('active', lang === 'en');
  if (langRuBtn) langRuBtn.classList.toggle('active', lang === 'ru');
  if (langZhBtn) langZhBtn.classList.toggle('active', lang === 'zh');
  if (langEsBtn) langEsBtn.classList.toggle('active', lang === 'es');
  const formFields = {
    title: 'titleLabel', author: 'authorLabel', year: 'yearLabel',
    pages: 'pagesLabel', category: 'categoryLabel', notes: 'notesLabel'
  };
  Object.entries(formFields).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) el.placeholder = t(key);
  });
  ['status', 'editStatus'].forEach(function (selId) {
    const sel = document.getElementById(selId);
    if (sel && sel.options.length >= 3) {
      sel.options[0].text = t('statusWantToRead');
      sel.options[1].text = t('statusReading');
      sel.options[2].text = t('statusFinished');
    }
  });
  const addBtn = document.getElementById('addBookBtn');
  if (addBtn) addBtn.innerHTML = '<i class="fa-solid fa-plus"></i> ' + t('addBookBtn');
}

// render themes on startup
renderThemeList();

/*=========================
    تحميل أول مرة
=========================*/
/* =========================
   Language Toggle Events
   ========================= */
document.getElementById('langArBtn')?.addEventListener('click', function() {
    applyLang('ar');
});

document.getElementById('langEnBtn')?.addEventListener('click', function() {
    applyLang('en');
});

document.getElementById('langRuBtn')?.addEventListener('click', function() {
    applyLang('ru');
});

document.getElementById('langZhBtn')?.addEventListener('click', function() {
    applyLang('zh');
});

document.getElementById('langEsBtn')?.addEventListener('click', function() {
    applyLang('es');
});

async function initApp() {
    await loadAllData();
    renderLists();
    updateListSelect();
    renderBooks();
    updateStatistics();
    updateBackupInfo();
    applyLang(currentLang);
    console.log("📚 تم تحميل التطبيق بنجاح باستخدام IndexedDB!");
    console.log(`📖 عدد الكتب: ${books.length}`);
    console.log(`📋 عدد القوائم: ${customLists.length}`);
}

initApp();

console.log('📤 لتصدير البيانات استخدم: exportData()');
console.log('📥 لاستيراد بيانات استخدم: importData(file)');