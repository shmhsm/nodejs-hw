import { celebrate, Joi, Segments } from 'celebrate';
import { isValidObjectId } from 'mongoose';
import { TAGS } from '../constants/tags.js';

// Кастомный метод проверки ObjectId для Mongoose
const objectIdCustomValidation = (value, helpers) => {
  if (!isValidObjectId(value)) {
    return helpers.message('Invalid ObjectId');
  }
  return value;
};

// 1. Схема для GET /notes
export const getAllNotesSchema = celebrate({
  [Segments.QUERY]: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(5).max(20).default(10),
    tag: Joi.string().valid(...TAGS).optional(),
    search: Joi.string().allow('').optional(),
  }),
});

// 2. Универсальная схема для проверки noteId
export const noteIdSchema = celebrate({
  [Segments.PARAMS]: Joi.object().keys({
    noteId: Joi.string().custom(objectIdCustomValidation).required(),
  }),
});

// 3. Схема для POST /notes
export const createNoteSchema = celebrate({
  [Segments.BODY]: Joi.object().keys({
    title: Joi.string().min(1).required(),
    content: Joi.string().allow('').optional(),
    tag: Joi.string().valid(...TAGS).optional(),
  }),
});

// 4. Схема для PATCH /notes/:noteId
export const updateNoteSchema = celebrate({
  [Segments.PARAMS]: Joi.object().keys({
    noteId: Joi.string().custom(objectIdCustomValidation).required(),
  }),
  [Segments.BODY]: Joi.object()
    .keys({
      title: Joi.string().min(1).optional(),
      content: Joi.string().allow('').optional(),
      tag: Joi.string().valid(...TAGS).optional(),
    })
    .min(1), // Гарантирует, что хотя бы одно поле передано (тело не пустое)
});