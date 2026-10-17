import { Router } from 'express';
import { JokeService } from '../services/jokeService';
import { ApiResponse } from '../types';

const router = Router();
const jokeService = new JokeService();

// Create a new joke
router.post('/', async (req, res) => {
  const { text, metadata } = req.body;
  const userId = req.user?.userId;

  if (!text) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Joke text is required'
    };
    return res.status(400).json(response);
  }

  if (!userId) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'User ID is required'
    };
    return res.status(401).json(response);
  }

  const result = await jokeService.createJoke({
    text,
    metadata: metadata || {},
    user_id: userId
  });
  res.status(result.success ? 201 : 400).json(result);
});

// Get a joke by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'User ID is required'
    };
    return res.status(401).json(response);
  }

  const result = await jokeService.getJoke(id);
  res.status(result.success ? 200 : 404).json(result);
});

// Update a joke
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { text, metadata } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'User ID is required'
    };
    return res.status(401).json(response);
  }

  const result = await jokeService.updateJoke(id, {
    text,
    metadata: metadata || {}
  });
  res.status(result.success ? 200 : 404).json(result);
});

// Delete a joke
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'User ID is required'
    };
    return res.status(401).json(response);
  }

  const result = await jokeService.deleteJoke(id);
  res.status(result.success ? 200 : 404).json(result);
});

// Get jokes by bit ID
router.get('/bit/:bitId', async (req, res) => {
  const { bitId } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'User ID is required'
    };
    return res.status(401).json(response);
  }

  const result = await jokeService.getJokesByBit(bitId);
  res.status(result.success ? 200 : 404).json(result);
});

export { router as jokeRoutes }; 