const API_URL = 'http://localhost:9000/books';
 
document.addEventListener("DOMContentLoaded", function () {
    const bookForm = document.getElementById("bookForm");
    const searchForm = document.getElementById("searchBook");
    const incompleteBooksList = document.getElementById("incompleteBookList");
    const completeBooksList = document.getElementById("completeBookList");
    const titleInput = document.getElementById("bookFormTitle");
    const authorInput = document.getElementById("bookFormAuthor");
    const yearInput = document.getElementById("bookFormYear");
    const isCompleteInput = document.getElementById("bookFormIsComplete");
 
    fetch('http://localhost:9000/books')
        .then(response => response.json())
        .then(data => console.log(data));
 
    async function fetchBooks() {
        try {
            const response = await fetch(API_URL);
            const { status, data } = await response.json();
            if (status === 'success') {
                return data.books;
            }
            return [];
        } catch (error) {
            console.error('Error fetching books:', error);
            return [];
        }
    }
 
    function createBookElement(book) {
        const bookDiv = document.createElement("div");
        bookDiv.setAttribute("data-bookid", book.id);
        bookDiv.setAttribute("data-testid", "bookItem");
 
        bookDiv.innerHTML = `
        <h3 data-testid="bookItemTitle">${book.name}</h3>
        <p data-testid="bookItemAuthor">Penulis: ${book.author || 'Unknown'}</p>
        <p data-testid="bookItemYear">Tahun: ${book.year || 'Unknown'}</p>
        <div>
          <button data-testid="bookItemIsCompleteButton">${book.finished ? "Belum selesai dibaca" : "Selesai dibaca"}</button>
          <button data-testid="bookItemDeleteButton">Hapus Buku</button>
          <button data-testid="bookItemEditButton">Edit Buku</button>
        </div>
      `;
 
        const isCompleteButton = bookDiv.querySelector("[data-testid=bookItemIsCompleteButton]");
        const deleteButton = bookDiv.querySelector("[data-testid=bookItemDeleteButton]");
        const editButton = bookDiv.querySelector("[data-testid=bookItemEditButton]");
 
        isCompleteButton.addEventListener("click", async () => {
            const updatedBook = {
                name: book.name,
                year: book.year,
                author: book.author,
                summary: book.summary || '',
                publisher: book.publisher || '',
                pageCount: book.pageCount || 100,
                readPage: book.finished ? 0 : book.pageCount || 100,
                reading: !book.finished,
            };
 
            await fetch(`${API_URL}/${book.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedBook),
            });
            renderBooks();
        });
 
        deleteButton.addEventListener("click", async () => {
            if (confirm("Apakah Anda yakin ingin menghapus buku ini?")) {
                await fetch(`${API_URL}/${book.id}`, {
                    method: 'DELETE',
                });
                renderBooks();
            }
        });
 
        editButton.addEventListener("click", () => {
            titleInput.value = book.name;
            authorInput.value = book.author || '';
            yearInput.value = book.year || '';
            isCompleteInput.checked = book.finished;
 
            bookForm.dataset.editId = book.id; // Simpan ID untuk edit
        });
 
        return bookDiv;
    }
 
    async function renderBooks() {
        incompleteBooksList.innerHTML = "";
        completeBooksList.innerHTML = "";
 
        const books = await fetchBooks();
 
        if (books.length === 0) {
            incompleteBooksList.innerHTML = "<p>Belum ada buku.</p>";
            completeBooksList.innerHTML = "<p>Belum ada buku.</p>";
        } else {
            const detailedBooks = await Promise.all(
                books.map(async (book) => {
                    const response = await fetch(`${API_URL}/${book.id}`);
                    const { data } = await response.json();
                    return data.book;
                })
            );
 
            detailedBooks.forEach((book) => {
                const bookElement = createBookElement(book);
                if (book.finished) {
                    completeBooksList.appendChild(bookElement);
                } else {
                    incompleteBooksList.appendChild(bookElement);
                }
            });
        }
    }
 
    bookForm.addEventListener("submit", async (event) => {
        event.preventDefault();
 
        const newBook = {
            name: titleInput.value.trim(),
            year: parseInt(yearInput.value.trim(), 10),
            author: authorInput.value.trim(),
            summary: 'No summary provided',
            publisher: 'Unknown',
            pageCount: isCompleteInput.checked ? 100 : 100, // Default pageCount
            readPage: isCompleteInput.checked ? 100 : 0, // Default readPage
            reading: isCompleteInput.checked,
        };
 
        if (newBook.name && newBook.author && !isNaN(newBook.year)) {
            if (bookForm.dataset.editId) {
                // Update book
                await fetch(`${API_URL}/${bookForm.dataset.editId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newBook),
                });
                delete bookForm.dataset.editId;
            } else {
                // Add new book
                await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newBook),
                });
            }
            bookForm.reset();
            renderBooks();
        } else {
            alert("Masukkan data buku dengan benar, terutama tahun yang harus berupa angka.");
        }
    });
 
    searchForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const searchTerm = document.getElementById("searchBookTitle").value.toLowerCase().trim();
        const books = await fetchBooks();
 
        const filteredBooks = books.filter((book) =>
            book.name.toLowerCase().includes(searchTerm)
        );
 
        incompleteBooksList.innerHTML = "";
        completeBooksList.innerHTML = "";
 
        if (filteredBooks.length === 0) {
            incompleteBooksList.innerHTML = "<p>Buku tidak ditemukan.</p>";
            completeBooksList.innerHTML = "<p>Buku tidak ditemukan.</p>";
        } else {
            const detailedBooks = await Promise.all(
                filteredBooks.map(async (book) => {
                    const response = await fetch(`${API_URL}/${book.id}`);
                    const { data } = await response.json();
                    return data.book;
                })
            );
 
            detailedBooks.forEach((book) => {
                const bookElement = createBookElement(book);
                if (book.finished) {
                    completeBooksList.appendChild(bookElement);
                } else {
                    incompleteBooksList.appendChild(bookElement);
                }
            });
        }
    });
 
    renderBooks();
});