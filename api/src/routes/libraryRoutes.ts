import express from 'express';
import { getLibraryTree } from '../services/libraryService'; // We will create this service function
import { auth } from '../middleware/auth'; // Assuming fetching library requires auth

const router = express.Router();

/**
 * @swagger
 * /library/tree:
 *   get:
 *     summary: Retrieves the entire library structure for the user
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The nested library structure (Specials > Sets > Bits > Jokes)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LibraryItem' # Define this schema later
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/tree', auth, async (req, res, next) => {
  try {
    // Assuming user ID is attached to req by auth middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized: User ID missing' });
    }

    const libraryTree = await getLibraryTree(userId);
    res.json(libraryTree); // Send the nested structure
  } catch (error) {
    next(error); // Pass error to the error handling middleware
  }
});

// Define LibraryItem schema for Swagger later if needed
/**
 * @swagger
 * components:
 *   schemas:
 *     LibraryItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         type:
 *           type: string
 *           enum: [special, set, bit, joke, idea] # Adjust as needed
 *         label:
 *           type: string
 *         children:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/LibraryItem'
 *         # Add other relevant properties like text, setup, punchline, versions, metadata etc.
 *       required:
 *         - id
 *         - type
 *         - label
 */

export const libraryRoutes = router; 