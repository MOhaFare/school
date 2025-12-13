import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Book, User } from 'lucide-react';
import { LibraryBook } from '../types';
import Modal from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import BookForm from '../components/library/BookForm';
import TableSkeleton from '../components/ui/TableSkeleton';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

const Library: React.FC = () => {
  const [libraryBooks, setLibraryBooks] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<LibraryBook | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('library_books').select('*').order('title');
        if (error) throw error;
        setLibraryBooks(data);
      } catch (error: any) {
        const errorMessage = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
        toast.error(`Failed to fetch books: ${errorMessage}`);
        console.error("Error fetching library books:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  const filteredBooks = libraryBooks.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.isbn.includes(searchTerm)
  );

  const handleAdd = () => {
    setSelectedBook(null);
    setModalOpen(true);
  };

  const handleEdit = (book: LibraryBook) => {
    setSelectedBook(book);
    setModalOpen(true);
  };

  const handleDelete = (book: LibraryBook) => {
    setSelectedBook(book);
    setDeleteModalOpen(true);
  };

  const handleSaveBook = async (formData: Omit<LibraryBook, 'id' | 'available' | 'status' | 'created_at'> & { id?: string }) => {
    setIsSubmitting(true);
    await toast.promise(
      (async () => {
        const bookToSave = {
          ...formData,
          available: formData.quantity,
          status: formData.quantity > 0 ? 'available' : 'unavailable',
        };

        if (formData.id) {
          const { data, error } = await supabase.from('library_books').update(bookToSave).eq('id', formData.id).select().single();
          if (error) throw error;
          setLibraryBooks(prev => prev.map(b => b.id === formData.id ? data : b));
        } else {
          const { data, error } = await supabase.from('library_books').insert(bookToSave).select().single();
          if (error) throw error;
          setLibraryBooks(prev => [data, ...prev]);
        }
      })(),
      {
        loading: 'Saving book...',
        success: 'Book saved successfully!',
        error: (err) => `Failed to save book: ${err.message}`,
      }
    );
    setIsSubmitting(false);
    setModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (selectedBook) {
      setIsSubmitting(true);
      await toast.promise(
        (async () => {
          const { error } = await supabase.from('library_books').delete().eq('id', selectedBook.id);
          if (error) throw error;
          setLibraryBooks(prev => prev.filter(b => b.id !== selectedBook.id));
        })(),
        {
          loading: 'Deleting book...',
          success: 'Book deleted successfully!',
          error: (err) => `Failed to delete book: ${err.message}`,
        }
      );
      setIsSubmitting(false);
      setDeleteModalOpen(false);
      setSelectedBook(null);
    }
  };

  if (loading) {
    return <TableSkeleton title="Library" headers={['Book', 'Author', 'Genre', 'Availability', 'Actions']} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Library</h1>
          <p className="text-gray-600 mt-1">Manage library books and inventory</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus size={20} className="mr-2" />
          Add Book
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search books by title, author, or ISBN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Author</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Genre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Availability</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBooks.map((book) => (
                <tr key={book.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                        <Book size={20} className="text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{book.title}</div>
                        <div className="text-sm text-gray-500">{book.isbn}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <div className="flex items-center">
                      <User size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{book.author}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      {book.genre}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{book.available} / {book.quantity}</div>
                    <span className={`text-xs font-semibold ${book.status === 'available' ? 'text-green-600' : 'text-red-600'}`}>
                      {book.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                     <Button variant="ghost" size="icon" onClick={() => handleEdit(book)}><Edit className="h-4 w-4" /></Button>
                     <Button variant="ghost" size="icon" onClick={() => handleDelete(book)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedBook ? 'Edit Book' : 'Add New Book'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={() => formRef.current?.requestSubmit()} loading={isSubmitting}>
              {selectedBook ? 'Save Changes' : 'Add Book'}
            </Button>
          </>
        }
      >
        <BookForm ref={formRef} book={selectedBook} onSubmit={handleSaveBook} />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Book"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirmDelete} loading={isSubmitting}>Delete</Button>
          </>
        }
      >
        <p>Are you sure you want to delete <strong>{selectedBook?.title}</strong>? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default Library;
