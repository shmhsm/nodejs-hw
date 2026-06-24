import { Router } from 'express';
import * as notesController from '../controllers/notesController.js';
import {
  getAllNotesSchema,
  noteIdSchema,
  createNoteSchema,
  updateNoteSchema,
} from '../validations/notesValidation.js';

const router = Router();

router.get('/', getAllNotesSchema, notesController.getAllNotes);

router.get('/:noteId', noteIdSchema, notesController.getNoteById);

router.post('/', createNoteSchema, notesController.createNote);

router.patch('/:noteId', updateNoteSchema, notesController.updateNote);

router.delete('/:noteId', noteIdSchema, notesController.deleteNote);

export default router;