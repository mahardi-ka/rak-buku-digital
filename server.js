const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const Path = require('path');
const { nanoid } = require('nanoid');
 
let books = [];
 
const init = async () => {
  const server = Hapi.server({
    port: 9000,
    host: 'localhost',
    routes: {
      cors: true // Untuk memungkinkan akses dari frontend
    }
  });
 
  // Registrasi plugin Inert untuk menyajikan file statis
  await server.register(Inert);
 
  // Route untuk menyajikan file statis dari folder public
  server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: Path.join(__dirname, '../public'), // Path ke folder public
        redirectToSlash: true,
        index: true // Menyajikan index.html di root
      }
    }
  });
 
  // API untuk menyimpan buku
  server.route({
    method: 'POST',
    path: '/books',
    handler: (request, h) => {
      try {
        const {
          name, year, author, summary = '', publisher = '', pageCount, readPage, reading
        } = request.payload;
 
        if (!name) {
          return h.response({
            status: 'fail',
            message: 'Gagal menambahkan buku. Mohon isi nama buku'
          }).code(400);
        }
 
        if (readPage > pageCount) {
          return h.response({
            status: 'fail',
            message: 'Gagal menambahkan buku. readPage tidak boleh lebih besar dari pageCount'
          }).code(400);
        }
 
        const id = nanoid(16);
        const finished = pageCount === readPage;
        const insertedAt = new Date().toISOString();
        const updatedAt = insertedAt;
 
        const newBook = {
          id, name, year, author, summary, publisher, pageCount, readPage, finished, reading, insertedAt, updatedAt
        };
 
        books.push(newBook);
 
        return h.response({
          status: 'success',
          message: 'Buku berhasil ditambahkan',
          data: { bookId: id }
        }).code(201);
      } catch (error) {
        console.error(error);
        return h.response({
          status: 'error',
          message: 'Terjadi kesalahan pada server'
        }).code(500);
      }
    }
  });
 
  // API untuk menampilkan seluruh buku
  server.route({
    method: 'GET',
    path: '/books',
    handler: () => {
      const bookList = books.map(({ id, name, publisher }) => ({ id, name, publisher }));
      return {
        status: 'success',
        data: { books: bookList }
      };
    }
  });
 
  // API untuk menampilkan detail buku
  server.route({
    method: 'GET',
    path: '/books/{bookId}',
    handler: (request, h) => {
      const { bookId } = request.params;
      const book = books.find((b) => b.id === bookId);
 
      if (!book) {
        return h.response({
          status: 'fail',
          message: 'Buku tidak ditemukan'
        }).code(404);
      }
 
      return {
        status: 'success',
        data: { book }
      };
    }
  });
 
  // API untuk mengubah data buku
  server.route({
    method: 'PUT',
    path: '/books/{bookId}',
    handler: (request, h) => {
      try {
        const { bookId } = request.params;
        const {
          name, year, author, summary = '', publisher = '', pageCount, readPage, reading
        } = request.payload;
 
        const bookIndex = books.findIndex((b) => b.id === bookId);
 
        if (bookIndex === -1) {
          return h.response({
            status: 'fail',
            message: 'Gagal memperbarui buku. Id tidak ditemukan'
          }).code(404);
        }
 
        if (!name) {
          return h.response({
            status: 'fail',
            message: 'Gagal memperbarui buku. Mohon isi nama buku'
          }).code(400);
        }
 
        if (readPage > pageCount) {
          return h.response({
            status: 'fail',
            message: 'Gagal memperbarui buku. readPage tidak boleh lebih besar dari pageCount'
          }).code(400);
        }
 
        const updatedAt = new Date().toISOString();
        const finished = pageCount === readPage;
 
        books[bookIndex] = {
          ...books[bookIndex],
          name, year, author, summary, publisher, pageCount, readPage, reading, finished, updatedAt
        };
 
        return h.response({
          status: 'success',
          message: 'Buku berhasil diperbarui'
        }).code(200);
      } catch (error) {
        console.error(error);
        return h.response({
          status: 'error',
          message: 'Terjadi kesalahan pada server'
        }).code(500);
      }
    }
  });
 
  // API untuk menghapus buku
  server.route({
    method: 'DELETE',
    path: '/books/{bookId}',
    handler: (request, h) => {
      const { bookId } = request.params;
      const bookIndex = books.findIndex((b) => b.id === bookId);
 
      if (bookIndex === -1) {
        return h.response({
          status: 'fail',
          message: 'Buku gagal dihapus. Id tidak ditemukan'
        }).code(404);
      }
 
      books.splice(bookIndex, 1);
 
      return h.response({
        status: 'success',
        message: 'Buku berhasil dihapus'
      }).code(200);
    }
  });
 
  // Jalankan server
  try {
    await server.start();
    console.log(`Server berjalan pada ${server.info.uri}`);
  } catch (error) {
    console.error('Gagal menjalankan server:', error);
    process.exit(1);
  }
};
 
// Panggil fungsi init
init();