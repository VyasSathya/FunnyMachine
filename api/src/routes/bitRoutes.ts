import { Router } from 'express';
import { BitService } from '../services/bitService';
import { ApiResponse } from '../types';

const router = Router();
const bitService = new BitService();

// Create a new bit
router.post('/', async (req, res) => {
  const { label, metadata } = req.body;
  const userId = req.user?.userId;

  if (!label) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Bit label is required'
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

  const result = await bitService.createBit({
    label,
    metadata: metadata || {},
    user_id: userId,
    is_archived: false
  });
  res.status(result.success ? 201 : 400).json(result);
});

// Get a bit by ID
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

  const result = await bitService.getBit(id);
  res.status(result.success ? 200 : 404).json(result);
});

// Update a bit
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { label, metadata } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'User ID is required'
    };
    return res.status(401).json(response);
  }

  const result = await bitService.updateBit(id, {
    label,
    metadata: metadata || {}
  });
  res.status(result.success ? 200 : 404).json(result);
});

// Delete a bit
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

  const result = await bitService.deleteBit(id);
  res.status(result.success ? 200 : 404).json(result);
});

// Add a joke to a bit
router.post('/:bitId/jokes/:jokeId', async (req, res) => {
  const { bitId, jokeId } = req.params;
  const { orderIndex } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'User ID is required'
    };
    return res.status(401).json(response);
  }

  if (typeof orderIndex !== 'number') {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Order index must be a number'
    };
    return res.status(400).json(response);
  }

  const result = await bitService.addJokeToBit(bitId, jokeId, orderIndex);
  res.status(result.success ? 201 : 400).json(result);
});

// Remove a joke from a bit
router.delete('/:bitId/jokes/:jokeId', async (req, res) => {
  const { bitId, jokeId } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'User ID is required'
    };
    return res.status(401).json(response);
  }

  const result = await bitService.removeJokeFromBit(bitId, jokeId);
  res.status(result.success ? 200 : 404).json(result);
});

export { router as bitRoutes }; 