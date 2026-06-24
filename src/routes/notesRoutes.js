import { Router } from 'express';

import { 
  getNotes, 
  getNoteById, 
  createNote, 
  updateNote, 
  deleteNote 
} from '../controllers/notesController.js';

import {
  getAllNotesSchema,
  noteIdSchema,
  createNoteSchema,
  updateNoteSchema,
} from '../validations/notesValidation.js';

const router = Router();

router.get('/', getAllNotesSchema, getNotes);

router.get('/:noteId', noteIdSchema, getNoteById);

router.post('/', createNoteSchema, createNote);

router.patch('/:noteId', updateNoteSchema, updateNote);

router.delete('/:noteId', noteIdSchema, deleteNote);

export default router;