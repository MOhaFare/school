import React, { useState, useEffect, forwardRef } from 'react';
import { LibraryBook } from '../../types';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';

interface BookFormProps {
  book?: LibraryBook | null;
  onSubmit: (data: Omit<LibraryBook, 'id' | 'available' | 'status'> & { id?: string }) => void;
}

const genres = ['Fiction', 'Science', 'History', 'Biography', 'Fantasy', 'Mystery', 'Technology', 'Art'];

const BookForm = forwardRef<HTMLFormElement, BookFormProps>(({ book, onSubmit }, ref) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    genre: genres[0],
    quantity: 1,
  });

  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        genre: book.genre,
        quantity: book.quantity,
      });
    } else {
      setFormData({
        title: '', author: '', isbn: '', genre: genres[0], quantity: 1,
      });
    }
  }, [book]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, id: book?.id });
  };

  return (
    <form ref={ref} onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Book Title</Label>
          <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="author">Author</Label>
          <Input id="author" name="author" value={formData.author} onChange={handleChange} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="isbn">ISBN</Label>
        <Input id="isbn" name="isbn" value={formData.isbn} onChange={handleChange} required />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="genre">Genre</Label>
          <Select id="genre" name="genre" value={formData.genre} onChange={handleChange}>
            {genres.map(g => <option key={g} value={g}>{g}</option>)}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input id="quantity" name="quantity" type="number" min="0" value={formData.quantity} onChange={handleChange} required />
        </div>
      </div>
      <button type="submit" className="hidden">Submit</button>
    </form>
  );
});

BookForm.displayName = 'BookForm';

export default BookForm;
