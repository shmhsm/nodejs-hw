import { Note } from '../models/note.js';
import createHttpError from 'http-errors';

export const getAllNotes = async (req, res, next) => {
  try {
    const { page = 1, perPage = 10, tag, search } = req.query;
    const userId = req.user._id;

    const filter = { userId };

    if (tag) {
      filter.tag = tag;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(perPage);
    const limit = Number(perPage);

    const [notes, totalNotes] = await Promise.all([
      Note.find(filter).skip(skip).limit(limit),
      Note.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalNotes / limit);

    res.status(200).json({
      page: Number(page),
      perPage: limit,
      totalNotes,
      totalPages,
      notes,
    });
  } catch (error) {
    next(error);
  }
};

export const getNoteById = async (req, res, next) => {
  try {
    const { noteId } = req.params;
    const userId = req.user._id;
    
    const note = await Note.findOne({ _id: noteId, userId });
    
    if (!note) {
      return next(createHttpError(404, 'Note not found'));
    }
    
    res.status(200).json(note);
  } catch (error) {
    next(error);
  }
};

export const createNote = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const newNote = await Note.create({ ...req.body, userId });
    res.status(201).json(newNote);
  } catch (error) {
    next(error);
  }
};

export const deleteNote = async (req, res, next) => {
  try {
    const { noteId } = req.params;
    const userId = req.user._id;
    
    const deletedNote = await Note.findOneAndDelete({ _id: noteId, userId });
    
    if (!deletedNote) {
      return next(createHttpError(404, 'Note not found'));
    }
    
    res.status(200).json(deletedNote);
  } catch (error) {
    next(error);
  }
};

export const updateNote = async (req, res, next) => {
  try {
    const { noteId } = req.params; 
    const userId = req.user._id;
    
    const updatedNote = await Note.findOneAndUpdate(
      { _id: noteId, userId }, 
      req.body, 
      { returnDocument: 'after' } 
    );

    if (!updatedNote) {
      return next(createHttpError(404, 'Note not found'));
    }

    res.status(200).json(updatedNote);
  } catch (error) {
    next(error);
  }
};