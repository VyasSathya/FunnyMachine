import { Router } from 'express';
import { UserService } from '../services/userService';
import { auth } from '../middleware/auth';
import { ApiResponse } from '../types';

const router = Router();
const userService = new UserService();

// Public routes
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  
  if (!email || !password) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Email and password are required'
    };
    return res.status(400).json(response);
  }

  try {
    const user = await userService.createUser({
      email,
      password,
      name: name || email.split('@')[0], // Use email username if name not provided
      metadata: {},
      is_active: true
    });
    const response: ApiResponse<typeof user> = {
      success: true,
      data: user
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user'
    };
    res.status(400).json(response);
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Email and password are required'
    };
    return res.status(400).json(response);
  }

  try {
    const result = await userService.login(email, password);
    if (!result) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid email or password'
      };
      return res.status(401).json(response);
    }
    const response: ApiResponse<typeof result> = {
      success: true,
      data: result
    };
    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to login'
    };
    res.status(500).json(response);
  }
});

// Protected routes
router.get('/me', auth, async (req, res) => {
  if (!req.user) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'User not found'
    };
    return res.status(401).json(response);
  }

  try {
    const user = await userService.getUser(req.user.id);
    if (!user) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'User not found'
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<typeof user> = {
      success: true,
      data: user
    };
    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user'
    };
    res.status(500).json(response);
  }
});

router.put('/me', auth, async (req, res) => {
  if (!req.user) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'User not found'
    };
    return res.status(401).json(response);
  }

  try {
    const user = await userService.updateUser(req.user.id, req.body);
    const response: ApiResponse<typeof user> = {
      success: true,
      data: user
    };
    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user'
    };
    res.status(500).json(response);
  }
});

router.delete('/me', auth, async (req, res) => {
  if (!req.user) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'User not found'
    };
    return res.status(401).json(response);
  }

  try {
    const user = await userService.deleteUser(req.user.id);
    const response: ApiResponse<typeof user> = {
      success: true,
      data: user
    };
    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete user'
    };
    res.status(500).json(response);
  }
});

export default router; 